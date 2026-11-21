-- Meridian DSS schema (matches the README ER diagram:
-- DEPARTMENTS, USERS, TEST_RESULTS, EMAIL_LOG, plus DASHBOARDS and SESSIONS).

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- crypt()/gen_salt() for password hashing

CREATE TABLE IF NOT EXISTS departments (
  name        text PRIMARY KEY,
  is_hr_flow  boolean NOT NULL DEFAULT false  -- true = Flow 2 (company oversight)
);

CREATE TABLE IF NOT EXISTS users (
  id             text PRIMARY KEY,
  name           text NOT NULL CHECK (length(trim(name)) > 0),
  username       text NOT NULL CHECK (username !~ '\s' AND length(username) > 0),
  password_hash  text NOT NULL,                       -- bcrypt via pgcrypto
  email          text NOT NULL CHECK (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  department     text NOT NULL REFERENCES departments(name),
  created_at     timestamptz NOT NULL DEFAULT now()
);
-- Usernames are unique regardless of case.
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_key ON users (lower(username));

CREATE TABLE IF NOT EXISTS test_results (
  user_id       text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  o             smallint NOT NULL CHECK (o BETWEEN 10 AND 50),
  c             smallint NOT NULL CHECK (c BETWEEN 10 AND 50),
  e             smallint NOT NULL CHECK (e BETWEEN 10 AND 50),
  a             smallint NOT NULL CHECK (a BETWEEN 10 AND 50),
  n             smallint NOT NULL CHECK (n BETWEEN 10 AND 50),
  completed_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS email_log (
  id          text PRIMARY KEY,
  to_user_id  text REFERENCES users(id) ON DELETE SET NULL,
  to_email    text NOT NULL,
  subject     text NOT NULL,
  body        text NOT NULL,
  sent_at     timestamptz NOT NULL DEFAULT now(),
  sent_by     text NOT NULL
);

CREATE TABLE IF NOT EXISTS dashboards (
  id           text PRIMARY KEY,
  title        text NOT NULL CHECK (length(trim(title)) > 0),
  source       text NOT NULL DEFAULT 'link' CHECK (source IN ('link', 'file')),
  url          text NOT NULL DEFAULT '',
  file_name    text,
  file_type    text,
  file_size    bigint,
  description  text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  created_by   text NOT NULL,
  CHECK (source <> 'link' OR url LIKE 'https://%'),
  CHECK (source <> 'file' OR file_name IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS sessions (
  token       text PRIMARY KEY,
  user_id     text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL DEFAULT now() + interval '7 days'
);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);
