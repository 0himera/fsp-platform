package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/argon2"
)

var ErrInvalidCredentials = errors.New("invalid credentials")
var ErrEmailUnverified = errors.New("email not verified")
var ErrInvalidToken = errors.New("invalid or expired token")
var ErrTooSoon = errors.New("request sent too recently")
var ErrEmailInUse = errors.New("email address is already used")

type User struct {
	ID       int64  `json:"id"`
	Email    string `json:"email"`
	Role     string `json:"role"`
	FullName string `json:"full_name"`
}

type Service struct{ DB *pgxpool.Pool }

func hashPassword(password string) (string, error) {
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	hash := argon2.IDKey([]byte(password), salt, 2, 64*1024, 1, 32)
	return fmt.Sprintf("$argon2id$v=19$m=65536,t=2,p=1$%s$%s", base64.RawStdEncoding.EncodeToString(salt), base64.RawStdEncoding.EncodeToString(hash)), nil
}

func verifyPassword(encoded, password string) bool {
	parts := strings.Split(encoded, "$")
	if len(parts) != 6 || parts[1] != "argon2id" || parts[2] != "v=19" || parts[3] != "m=65536,t=2,p=1" {
		return false
	}
	salt, err1 := base64.RawStdEncoding.DecodeString(parts[4])
	want, err2 := base64.RawStdEncoding.DecodeString(parts[5])
	if err1 != nil || err2 != nil || len(salt) != 16 || len(want) != 32 {
		return false
	}
	got := argon2.IDKey([]byte(password), salt, 2, 64*1024, 1, 32)
	return subtle.ConstantTimeCompare(got, want) == 1
}

func (s Service) RegisterPending(ctx context.Context, email, password, fullName, organization, city, role string) (User, string, error) {
	return s.register(ctx, email, password, fullName, organization, city, role, false)
}

// RegisterVerified is for trusted local demo data, never for public requests.
func (s Service) RegisterVerified(ctx context.Context, email, password, fullName, organization, city string) (User, string, error) {
	return s.register(ctx, email, password, fullName, organization, city, "athlete", true)
}

func (s Service) register(ctx context.Context, email, password, fullName, organization, city, role string, verified bool) (User, string, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	fullName = strings.TrimSpace(fullName)
	hash, err := hashPassword(password)
	if err != nil {
		return User{}, "", err
	}
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return User{}, "", err
	}
	defer tx.Rollback(ctx)
	user := User{Email: email, Role: role, FullName: fullName}
	if err := tx.QueryRow(ctx, `INSERT INTO users (email,password_hash,role,email_verified_at) VALUES ($1,$2,$3,CASE WHEN $4 THEN now() ELSE NULL END) RETURNING id`, email, hash, role, verified).Scan(&user.ID); err != nil {
		return User{}, "", err
	}
	if role == "athlete" {
		if _, err := tx.Exec(ctx, `INSERT INTO athletes (user_id,full_name,organization,city) VALUES ($1,$2,$3,$4)`, user.ID, fullName, strings.TrimSpace(organization), strings.TrimSpace(city)); err != nil {
			return User{}, "", err
		}
	} else {
		// coach or judge: create staff profile
		if _, err := tx.Exec(ctx, `INSERT INTO staff_profiles (user_id,full_name,organization,city) VALUES ($1,$2,$3,$4)`, user.ID, fullName, strings.TrimSpace(organization), strings.TrimSpace(city)); err != nil {
			return User{}, "", err
		}
	}
	var token string
	if verified {
		token, err = createSession(ctx, tx, user.ID)
	} else {
		token, err = issueToken(ctx, tx, user.ID, "verify_email", 24*time.Hour)
	}
	if err != nil {
		return User{}, "", err
	}
	if err := tx.Commit(ctx); err != nil {
		return User{}, "", err
	}
	return user, token, nil
}

func (s Service) Login(ctx context.Context, email, password string) (User, string, error) {
	var user User
	var hash string
	var verifiedAt *time.Time
	err := s.DB.QueryRow(ctx, `SELECT u.id,u.email,u.role,COALESCE(a.full_name,''),u.password_hash,u.email_verified_at FROM users u LEFT JOIN athletes a ON a.user_id=u.id WHERE lower(u.email)=lower($1)`, strings.TrimSpace(email)).Scan(&user.ID, &user.Email, &user.Role, &user.FullName, &hash, &verifiedAt)
	if errors.Is(err, pgx.ErrNoRows) || (err == nil && !verifyPassword(hash, password)) {
		return User{}, "", ErrInvalidCredentials
	}
	if err != nil {
		return User{}, "", err
	}
	if verifiedAt == nil {
		return User{}, "", ErrEmailUnverified
	}
	token, err := createSession(ctx, s.DB, user.ID)
	return user, token, err
}

func createSession(ctx context.Context, db interface {
	Exec(context.Context, string, ...any) (pgconn.CommandTag, error)
}, userID int64) (string, error) {
	buffer := make([]byte, 32)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}
	token := base64.RawURLEncoding.EncodeToString(buffer)
	hash := sha256.Sum256([]byte(token))
	_, err := db.Exec(ctx, `INSERT INTO sessions (token_hash,user_id,expires_at) VALUES ($1,$2,$3)`, hash[:], userID, time.Now().UTC().Add(30*24*time.Hour))
	return token, err
}

func (s Service) Session(ctx context.Context, token string) (User, error) {
	var user User
	if token == "" {
		return user, pgx.ErrNoRows
	}
	hash := sha256.Sum256([]byte(token))
	err := s.DB.QueryRow(ctx, `SELECT u.id,u.email,u.role,COALESCE(a.full_name,'') FROM sessions s JOIN users u ON u.id=s.user_id LEFT JOIN athletes a ON a.user_id=u.id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.email_verified_at IS NOT NULL`, hash[:]).Scan(&user.ID, &user.Email, &user.Role, &user.FullName)
	return user, err
}

func (s Service) Logout(ctx context.Context, token string) error {
	if token == "" {
		return nil
	}
	hash := sha256.Sum256([]byte(token))
	_, err := s.DB.Exec(ctx, `DELETE FROM sessions WHERE token_hash=$1`, hash[:])
	return err
}

func (s Service) ChangePassword(ctx context.Context, userID int64, current, next string) error {
	var encoded string
	if err := s.DB.QueryRow(ctx, `SELECT password_hash FROM users WHERE id=$1`, userID).Scan(&encoded); err != nil {
		return err
	}
	if !verifyPassword(encoded, current) {
		return ErrInvalidCredentials
	}
	hash, err := hashPassword(next)
	if err != nil {
		return err
	}
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	if _, err := tx.Exec(ctx, `UPDATE users SET password_hash=$2 WHERE id=$1`, userID, hash); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM sessions WHERE user_id=$1`, userID); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (s Service) EnsureOrganizer(ctx context.Context, email, password string) error {
	if email == "" || password == "" {
		return nil
	}
	if utf8.RuneCountInString(password) < 12 {
		return fmt.Errorf("organizer password must be at least %s characters", strconv.Itoa(12))
	}
	hash, err := hashPassword(password)
	if err != nil {
		return err
	}
	_, err = s.DB.Exec(ctx, `INSERT INTO users (email,password_hash,role,email_verified_at) VALUES ($1,$2,'organizer',now()) ON CONFLICT DO NOTHING`, strings.ToLower(strings.TrimSpace(email)), hash)
	return err
}
