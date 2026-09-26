ALTER TABLE athletes ADD COLUMN avatar_url text NOT NULL DEFAULT '';
ALTER TABLE athletes ADD COLUMN featured_achievement_code text NOT NULL DEFAULT '';
ALTER TABLE auth_tokens DROP CONSTRAINT auth_tokens_purpose_check;
ALTER TABLE auth_tokens ADD CONSTRAINT auth_tokens_purpose_check CHECK (purpose IN ('verify_email', 'reset_password', 'change_email'));
ALTER TABLE auth_tokens ADD COLUMN target_email text;

CREATE TABLE documents (
    id bigserial PRIMARY KEY,
    competition_id bigint REFERENCES competitions(id) ON DELETE CASCADE,
    title text NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
    storage_key text NOT NULL UNIQUE,
    media_type text NOT NULL,
    file_size bigint NOT NULL CHECK (file_size > 0),
    created_by bigint NOT NULL REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX documents_competition_idx ON documents (competition_id, created_at DESC);
