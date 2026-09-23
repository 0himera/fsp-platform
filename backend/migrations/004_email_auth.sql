ALTER TABLE users ADD COLUMN email_verified_at timestamptz;
UPDATE users SET email_verified_at = created_at WHERE email_verified_at IS NULL;

CREATE TABLE auth_tokens (
    token_hash bytea PRIMARY KEY,
    user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose text NOT NULL CHECK (purpose IN ('verify_email', 'reset_password')),
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, purpose)
);
CREATE INDEX auth_tokens_expires_idx ON auth_tokens (expires_at);
