package auth

import (
	"context"
	"errors"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/0himera/fsp-platform/internal/platform"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func TestEmailAccountFlow(t *testing.T) {
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
	schema := fmt.Sprintf("auth_test_%d", time.Now().UnixNano())
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
	svc := Service{DB: db}
	user, verification, err := svc.RegisterPending(ctx, " Test@Example.org ", "original-password", "Тестовый спортсмен", "ДГУ", "Махачкала", "athlete")
	if err != nil {
		t.Fatal(err)
	}
	if user.Email != "test@example.org" {
		t.Fatalf("email was not normalized: %q", user.Email)
	}
	if _, _, err := svc.Login(ctx, user.Email, "original-password"); !errors.Is(err, ErrEmailUnverified) {
		t.Fatalf("unverified login: %v", err)
	}
	if duplicate, err := svc.RequestToken(ctx, user.Email, "verify_email"); err != nil || duplicate != "" {
		t.Fatalf("verification resend cooldown: token=%q err=%v", duplicate, err)
	}
	confirmed, session, err := svc.VerifyEmail(ctx, verification)
	if err != nil || confirmed.ID != user.ID {
		t.Fatalf("verification failed: user=%+v err=%v", confirmed, err)
	}
	if _, _, err := svc.VerifyEmail(ctx, verification); !errors.Is(err, ErrInvalidToken) {
		t.Fatalf("verification token reused: %v", err)
	}
	if current, err := svc.Session(ctx, session); err != nil || current.ID != user.ID {
		t.Fatalf("new session: user=%+v err=%v", current, err)
	}
	if _, _, err := svc.Login(ctx, user.Email, "original-password"); err != nil {
		t.Fatal(err)
	}
	reset, err := svc.RequestToken(ctx, user.Email, "reset_password")
	if err != nil || reset == "" {
		t.Fatalf("reset token: %q %v", reset, err)
	}
	if err := svc.ResetPassword(ctx, reset, "new-password-2026"); err != nil {
		t.Fatal(err)
	}
	if err := svc.ResetPassword(ctx, reset, "other-password"); !errors.Is(err, ErrInvalidToken) {
		t.Fatalf("reset token reused: %v", err)
	}
	if _, err := svc.Session(ctx, session); !errors.Is(err, pgx.ErrNoRows) {
		t.Fatalf("old session survived reset: %v", err)
	}
	if _, _, err := svc.Login(ctx, user.Email, "original-password"); !errors.Is(err, ErrInvalidCredentials) {
		t.Fatalf("old password accepted: %v", err)
	}
	if _, _, err := svc.Login(ctx, user.Email, "new-password-2026"); err != nil {
		t.Fatal(err)
	}
	if unknown, err := svc.RequestToken(ctx, "unknown@example.org", "reset_password"); err != nil || unknown != "" {
		t.Fatalf("unknown email response: %q %v", unknown, err)
	}
}
