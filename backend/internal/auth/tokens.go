package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

func issueToken(ctx context.Context, tx pgx.Tx, userID int64, purpose string, ttl time.Duration) (string, error) {
	secret := make([]byte, 32)
	if _, err := rand.Read(secret); err != nil {
		return "", err
	}
	token := base64.RawURLEncoding.EncodeToString(secret)
	hash := sha256.Sum256([]byte(token))
	var stored []byte
	err := tx.QueryRow(ctx, `INSERT INTO auth_tokens (token_hash,user_id,purpose,expires_at)
		VALUES ($1,$2,$3,$4)
		ON CONFLICT (user_id,purpose) DO UPDATE SET token_hash=EXCLUDED.token_hash,expires_at=EXCLUDED.expires_at,created_at=now()
		WHERE auth_tokens.created_at < now()-interval '60 seconds'
		RETURNING token_hash`, hash[:], userID, purpose, time.Now().UTC().Add(ttl)).Scan(&stored)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrTooSoon
	}
	return token, err
}

// RequestToken returns no token for unknown or ineligible addresses, avoiding account disclosure.
func (s Service) RequestToken(ctx context.Context, email, purpose string) (string, error) {
	if purpose != "verify_email" && purpose != "reset_password" {
		return "", ErrInvalidToken
	}
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return "", err
	}
	defer tx.Rollback(ctx)
	var userID int64
	var verified bool
	err = tx.QueryRow(ctx, `SELECT id,email_verified_at IS NOT NULL FROM users WHERE lower(email)=lower($1)`, strings.TrimSpace(email)).Scan(&userID, &verified)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", nil
	}
	if err != nil {
		return "", err
	}
	if (purpose == "verify_email" && verified) || (purpose == "reset_password" && !verified) {
		return "", nil
	}
	ttl := 15 * time.Minute
	if purpose == "verify_email" {
		ttl = 24 * time.Hour
	}
	token, err := issueToken(ctx, tx, userID, purpose, ttl)
	if errors.Is(err, ErrTooSoon) {
		return "", nil
	}
	if err != nil {
		return "", err
	}
	return token, tx.Commit(ctx)
}

func (s Service) RequestEmailChange(ctx context.Context, userID int64, email string) (string, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return "", err
	}
	defer tx.Rollback(ctx)
	var current string
	if err := tx.QueryRow(ctx, `SELECT email FROM users WHERE id=$1 FOR UPDATE`, userID).Scan(&current); err != nil {
		return "", err
	}
	if current == email {
		return "", ErrInvalidToken
	}
	var exists bool
	if err := tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM users WHERE lower(email)=lower($1))`, email).Scan(&exists); err != nil {
		return "", err
	}
	if exists {
		return "", ErrEmailInUse
	}
	token, err := issueToken(ctx, tx, userID, "change_email", 15*time.Minute)
	if err != nil {
		return "", err
	}
	if _, err := tx.Exec(ctx, `UPDATE auth_tokens SET target_email=$2 WHERE user_id=$1 AND purpose='change_email'`, userID, email); err != nil {
		return "", err
	}
	return token, tx.Commit(ctx)
}

func (s Service) VerifyEmailChange(ctx context.Context, token string) error {
	hash := sha256.Sum256([]byte(token))
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	var userID int64
	var email string
	err = tx.QueryRow(ctx, `SELECT user_id,target_email FROM auth_tokens WHERE token_hash=$1 AND purpose='change_email' AND expires_at>now() FOR UPDATE`, hash[:]).Scan(&userID, &email)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrInvalidToken
	}
	if err != nil {
		return err
	}
	if email == "" {
		return ErrInvalidToken
	}
	if _, err := tx.Exec(ctx, `UPDATE users SET email=$2 WHERE id=$1`, userID, email); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM auth_tokens WHERE user_id=$1`, userID); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM sessions WHERE user_id=$1`, userID); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (s Service) VerifyEmail(ctx context.Context, token string) (User, string, error) {
	hash := sha256.Sum256([]byte(token))
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return User{}, "", err
	}
	defer tx.Rollback(ctx)
	var user User
	err = tx.QueryRow(ctx, `SELECT u.id,u.email,u.role,COALESCE(a.full_name,'')
		FROM auth_tokens t JOIN users u ON u.id=t.user_id LEFT JOIN athletes a ON a.user_id=u.id
		WHERE t.token_hash=$1 AND t.purpose='verify_email' AND t.expires_at>now() FOR UPDATE OF t`, hash[:]).Scan(&user.ID, &user.Email, &user.Role, &user.FullName)
	if errors.Is(err, pgx.ErrNoRows) {
		return User{}, "", ErrInvalidToken
	}
	if err != nil {
		return User{}, "", err
	}
	if _, err := tx.Exec(ctx, `UPDATE users SET email_verified_at=now() WHERE id=$1 AND email_verified_at IS NULL`, user.ID); err != nil {
		return User{}, "", err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM auth_tokens WHERE user_id=$1 AND purpose='verify_email'`, user.ID); err != nil {
		return User{}, "", err
	}
	session, err := createSession(ctx, tx, user.ID)
	if err != nil {
		return User{}, "", err
	}
	return user, session, tx.Commit(ctx)
}

func (s Service) ResetPassword(ctx context.Context, token, password string) error {
	hash := sha256.Sum256([]byte(token))
	passwordHash, err := hashPassword(password)
	if err != nil {
		return err
	}
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	var userID int64
	err = tx.QueryRow(ctx, `SELECT user_id FROM auth_tokens WHERE token_hash=$1 AND purpose='reset_password' AND expires_at>now() FOR UPDATE`, hash[:]).Scan(&userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrInvalidToken
	}
	if err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `UPDATE users SET password_hash=$2 WHERE id=$1`, userID, passwordHash); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM auth_tokens WHERE user_id=$1`, userID); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM sessions WHERE user_id=$1`, userID); err != nil {
		return err
	}
	return tx.Commit(ctx)
}
