ALTER TABLE contests ADD COLUMN IF NOT EXISTS codeforces_contest_id integer;
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS codeforces_handle text NOT NULL DEFAULT '';
