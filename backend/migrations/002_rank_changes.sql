CREATE TABLE IF NOT EXISTS rank_changes (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    athlete_id bigint NOT NULL REFERENCES athletes(user_id) ON DELETE CASCADE,
    old_rank_code text NOT NULL,
    new_rank_code text NOT NULL,
    changed_by bigint NOT NULL REFERENCES users(id),
    changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rank_changes_athlete_idx ON rank_changes (athlete_id, changed_at DESC);
