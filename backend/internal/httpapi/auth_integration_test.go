package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/0himera/fsp-platform/internal/platform"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type failingMailer struct{}

func (failingMailer) Send(context.Context, string, string, string) error {
	return errors.New("smtp unavailable")
}

type recordingMailer struct{ sent bool }

func (m *recordingMailer) Send(context.Context, string, string, string) error {
	m.sent = true
	return nil
}

func TestRegistrationWhenMailFails(t *testing.T) {
	databaseURL := os.Getenv("TEST_DATABASE_URL")
	if databaseURL == "" {
		t.Skip("set TEST_DATABASE_URL to run the PostgreSQL integration test")
	}
	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()
	admin, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(admin.Close)
	schema := fmt.Sprintf("httpapi_test_%d", time.Now().UnixNano())
	identifier := pgx.Identifier{schema}.Sanitize()
	if _, err := admin.Exec(ctx, "CREATE SCHEMA "+identifier); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		cleanupCtx, done := context.WithTimeout(context.Background(), 10*time.Second)
		defer done()
		if _, err := admin.Exec(cleanupCtx, "DROP SCHEMA "+identifier+" CASCADE"); err != nil {
			t.Errorf("remove temporary schema: %v", err)
		}
	})
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		t.Fatal(err)
	}
	if config.ConnConfig.RuntimeParams == nil {
		config.ConnConfig.RuntimeParams = map[string]string{}
	}
	config.ConnConfig.RuntimeParams["search_path"] = schema
	db, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(db.Close)
	if err := platform.Migrate(ctx, db, "../../migrations"); err != nil {
		t.Fatal(err)
	}
	server := New(db, "../../../frontend", failingMailer{}, "http://localhost:8080", "", "")
	fullName := strings.Repeat("Я", 100)
	request := httptest.NewRequest(http.MethodPost, "/api/auth/register", strings.NewReader(fmt.Sprintf(`{"email":"mail-failed@example.org","password":"long-password","full_name":%q,"city":"Махачкала","organization":"ДГУ"}`, fullName)))
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()
	server.Handler().ServeHTTP(response, request)
	if response.Code != http.StatusCreated {
		t.Fatalf("registration status: %d, body: %s", response.Code, response.Body.String())
	}
	var body struct {
		CheckEmail bool `json:"check_email"`
		MailSent   bool `json:"mail_sent"`
	}
	if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if !body.CheckEmail || body.MailSent {
		t.Fatalf("mail failure was hidden: %+v", body)
	}
	request = httptest.NewRequest(http.MethodPost, "/api/auth/register", strings.NewReader(fmt.Sprintf(`{"email":"too-long@example.org","password":"long-password","full_name":%q}`, fullName+"Я")))
	request.Header.Set("Content-Type", "application/json")
	response = httptest.NewRecorder()
	server.Handler().ServeHTTP(response, request)
	if response.Code != http.StatusBadRequest {
		t.Fatalf("name beyond character limit: status=%d", response.Code)
	}
	var count int
	if err := db.QueryRow(ctx, `SELECT count(*) FROM users u JOIN auth_tokens t ON t.user_id=u.id WHERE u.email='mail-failed@example.org' AND u.email_verified_at IS NULL AND t.purpose='verify_email'`).Scan(&count); err != nil || count != 1 {
		t.Fatalf("pending account and resend token: count=%d, err=%v", count, err)
	}
	if _, err := db.Exec(ctx, `UPDATE auth_tokens SET created_at=now()-interval '61 seconds' WHERE purpose='verify_email'`); err != nil {
		t.Fatal(err)
	}
	mailer := &recordingMailer{}
	server.Mailer = mailer
	request = httptest.NewRequest(http.MethodPost, "/api/auth/resend-verification", strings.NewReader(`{"email":"mail-failed@example.org"}`))
	request.Header.Set("Content-Type", "application/json")
	response = httptest.NewRecorder()
	server.Handler().ServeHTTP(response, request)
	if response.Code != http.StatusAccepted || !mailer.sent {
		t.Fatalf("verification resend failed: status=%d, sent=%v", response.Code, mailer.sent)
	}
}
