ALTER TABLE competitions ADD COLUMN max_team_size integer NOT NULL DEFAULT 5 CHECK (max_team_size BETWEEN 2 AND 5);
ALTER TABLE teams ADD COLUMN captain_id bigint REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE teams ADD COLUMN description text NOT NULL DEFAULT '' CHECK (length(description) <= 500);
UPDATE teams t SET captain_id = (SELECT min(m.athlete_id) FROM team_members m WHERE m.team_id=t.id);

CREATE TABLE team_invitations (
    id bigserial PRIMARY KEY,
    competition_id bigint NOT NULL,
    team_id bigint NOT NULL,
    token_hash bytea NOT NULL UNIQUE,
    invite_email text,
    expires_at timestamptz NOT NULL,
    accepted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (competition_id, team_id) REFERENCES teams(competition_id, id) ON DELETE CASCADE
);
CREATE INDEX team_invitations_team_idx ON team_invitations(team_id, expires_at);
