ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('athlete', 'organizer', 'coach', 'judge'));

CREATE TABLE IF NOT EXISTS staff_profiles (
  user_id      bigint PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name    text NOT NULL,
  organization text NOT NULL DEFAULT '',
  city         text NOT NULL DEFAULT '',
  bio          text NOT NULL DEFAULT '',
  avatar_url   text NOT NULL DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS athlete_coaches (
  athlete_id bigint NOT NULL REFERENCES athletes(user_id) ON DELETE CASCADE,
  coach_id   bigint NOT NULL REFERENCES staff_profiles(user_id) ON DELETE CASCADE,
  since      date,
  PRIMARY KEY (athlete_id, coach_id)
);
CREATE INDEX IF NOT EXISTS athlete_coaches_coach_idx ON athlete_coaches (coach_id);

CREATE TABLE IF NOT EXISTS competition_judges (
  competition_id bigint NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  judge_id       bigint NOT NULL REFERENCES staff_profiles(user_id) ON DELETE CASCADE,
  role_note      text NOT NULL DEFAULT '',
  PRIMARY KEY (competition_id, judge_id)
);
CREATE INDEX IF NOT EXISTS competition_judges_competition_idx ON competition_judges (competition_id);
