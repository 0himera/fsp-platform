CREATE TABLE IF NOT EXISTS schema_migrations (
    version integer PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email text NOT NULL,
    password_hash text NOT NULL,
    role text NOT NULL CHECK (role IN ('athlete', 'organizer')),
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (lower(email));

CREATE TABLE IF NOT EXISTS athletes (
    user_id bigint PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    organization text NOT NULL DEFAULT '',
    city text NOT NULL DEFAULT '',
    rank_code text NOT NULL DEFAULT 'none'
        CHECK (rank_code IN ('none', 'III', 'II', 'I', 'KMS', 'MS', 'MSMK', 'ZMS')),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS disciplines (
    code text PRIMARY KEY,
    name text NOT NULL,
    sort_order integer NOT NULL
);
INSERT INTO disciplines (code, name, sort_order) VALUES
    ('algorithmic', 'Алгоритмическое программирование', 1),
    ('product', 'Продуктовое программирование', 2),
    ('security', 'Программирование систем информационной безопасности', 3),
    ('robotics', 'Программирование робототехники', 4),
    ('uav', 'Программирование беспилотных авиационных систем', 5)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS athlete_disciplines (
    athlete_id bigint NOT NULL REFERENCES athletes(user_id) ON DELETE CASCADE,
    discipline_code text NOT NULL REFERENCES disciplines(code),
    PRIMARY KEY (athlete_id, discipline_code)
);

CREATE TABLE IF NOT EXISTS sessions (
    token_hash bytea PRIMARY KEY,
    user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id);

CREATE TABLE IF NOT EXISTS competitions (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title text NOT NULL,
    level_code text NOT NULL CHECK (level_code IN ('rf_championship', 'all_russian', 'interregional', 'rd_championship', 'regional')),
    discipline_code text NOT NULL REFERENCES disciplines(code),
    format text NOT NULL CHECK (format IN ('individual', 'team')),
    starts_at timestamptz NOT NULL,
    ends_at timestamptz NOT NULL,
    registration_deadline timestamptz NOT NULL,
    location text NOT NULL DEFAULT '',
    description text NOT NULL DEFAULT '',
    status text NOT NULL CHECK (status IN ('draft', 'open', 'running', 'completed')) DEFAULT 'draft',
    created_by bigint NOT NULL REFERENCES users(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (ends_at >= starts_at),
    CHECK (registration_deadline <= ends_at)
);
CREATE INDEX IF NOT EXISTS competitions_starts_idx ON competitions (starts_at DESC);

CREATE TABLE IF NOT EXISTS registrations (
    competition_id bigint NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    athlete_id bigint NOT NULL REFERENCES athletes(user_id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (competition_id, athlete_id)
);

CREATE TABLE IF NOT EXISTS teams (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    competition_id bigint NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (competition_id, name),
    UNIQUE (competition_id, id)
);

CREATE TABLE IF NOT EXISTS team_members (
    competition_id bigint NOT NULL,
    team_id bigint NOT NULL,
    athlete_id bigint NOT NULL,
    PRIMARY KEY (team_id, athlete_id),
    UNIQUE (competition_id, athlete_id),
    FOREIGN KEY (competition_id, team_id) REFERENCES teams(competition_id, id) ON DELETE CASCADE,
    FOREIGN KEY (competition_id, athlete_id) REFERENCES registrations(competition_id, athlete_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS results (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    competition_id bigint NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    athlete_id bigint,
    team_id bigint,
    place integer NOT NULL CHECK (place >= 1),
    score_text text NOT NULL DEFAULT '',
    published_at timestamptz NOT NULL DEFAULT now(),
    CHECK ((athlete_id IS NOT NULL) <> (team_id IS NOT NULL)),
    FOREIGN KEY (competition_id, athlete_id) REFERENCES registrations(competition_id, athlete_id),
    FOREIGN KEY (competition_id, team_id) REFERENCES teams(competition_id, id)
);
CREATE UNIQUE INDEX IF NOT EXISTS results_athlete_unique ON results (competition_id, athlete_id) WHERE athlete_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS results_team_unique ON results (competition_id, team_id) WHERE team_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS results_competition_idx ON results (competition_id);

CREATE TABLE IF NOT EXISTS result_publications (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    competition_id bigint NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    published_by bigint NOT NULL REFERENCES users(id),
    protocol jsonb NOT NULL,
    published_at timestamptz NOT NULL DEFAULT now()
);
