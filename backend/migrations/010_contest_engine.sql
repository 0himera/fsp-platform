CREATE TABLE IF NOT EXISTS contests (
    competition_id bigint PRIMARY KEY REFERENCES competitions(id) ON DELETE CASCADE,
    mode text NOT NULL CHECK (mode IN ('algorithm', 'csv_metric')),
    instructions text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    finalized_at timestamptz
);

CREATE TABLE IF NOT EXISTS contest_tasks (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    competition_id bigint NOT NULL REFERENCES contests(competition_id) ON DELETE CASCADE,
    title text NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
    statement text NOT NULL CHECK (length(statement) BETWEEN 1 AND 12000),
    max_points numeric(10,2) NOT NULL CHECK (max_points > 0 AND max_points <= 100000),
    position integer NOT NULL DEFAULT 1 CHECK (position > 0),
    public_csv text NOT NULL DEFAULT '',
    expected_labels jsonb NOT NULL DEFAULT '{}'::jsonb,
    positive_label text NOT NULL DEFAULT '1',
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (competition_id, position),
    UNIQUE (competition_id, id)
);
CREATE INDEX IF NOT EXISTS contest_tasks_competition_idx ON contest_tasks(competition_id, position, id);

CREATE TABLE IF NOT EXISTS contest_submissions (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    competition_id bigint NOT NULL REFERENCES contests(competition_id) ON DELETE CASCADE,
    task_id bigint NOT NULL REFERENCES contest_tasks(id) ON DELETE CASCADE,
    athlete_id bigint NOT NULL REFERENCES athletes(user_id) ON DELETE CASCADE,
    language text NOT NULL DEFAULT '',
    source_code text NOT NULL DEFAULT '',
    file_name text NOT NULL DEFAULT '',
    file_content bytea NOT NULL DEFAULT ''::bytea,
    status text NOT NULL CHECK (status IN ('submitted', 'queued', 'checking', 'graded', 'invalid')),
    automatic_score numeric(10,2),
    score numeric(10,2),
    verdict text NOT NULL DEFAULT '',
    feedback text NOT NULL DEFAULT '',
    reviewed_by bigint REFERENCES users(id),
    reviewed_at timestamptz,
    submitted_at timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (competition_id, task_id) REFERENCES contest_tasks(competition_id, id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS contest_submissions_athlete_idx ON contest_submissions(competition_id, athlete_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS contest_submissions_task_idx ON contest_submissions(task_id, submitted_at DESC);

CREATE TABLE IF NOT EXISTS contest_jobs (
    submission_id bigint PRIMARY KEY REFERENCES contest_submissions(id) ON DELETE CASCADE,
    state text NOT NULL CHECK (state IN ('queued', 'running', 'done')) DEFAULT 'queued',
    attempts integer NOT NULL DEFAULT 0,
    available_at timestamptz NOT NULL DEFAULT now(),
    locked_at timestamptz,
    last_error text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contest_jobs_queue_idx ON contest_jobs(state, available_at, created_at);
