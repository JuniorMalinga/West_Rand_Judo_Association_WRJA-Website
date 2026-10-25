-- WRJA database schema (SQLite).
-- Kept in plain, portable SQL on purpose: when you move to Supabase (Postgres)
-- these tables map across almost 1:1 (swap the INTEGER PRIMARY KEY AUTOINCREMENT
-- columns for "bigint generated always as identity", and the TEXT timestamps for
-- timestamptz).

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  phone         TEXT,
  date_of_birth TEXT,
  role          TEXT NOT NULL DEFAULT 'athlete' CHECK (role IN ('athlete', 'guardian', 'admin')),
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

-- Server-side login sessions. Only a SHA-256 hash of the token is stored, so a
-- leaked database can't be used to hijack a session.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash   TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  expires_at   TEXT NOT NULL,
  ip           TEXT,
  user_agent   TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS competitions (
  id                   TEXT PRIMARY KEY,
  slug                 TEXT NOT NULL UNIQUE,
  name                 TEXT NOT NULL,
  type                 TEXT NOT NULL,
  description          TEXT NOT NULL DEFAULT '',
  date                 TEXT NOT NULL DEFAULT '',
  location             TEXT NOT NULL DEFAULT '',
  registration_deadline TEXT NOT NULL DEFAULT '',
  registration_status  TEXT NOT NULL DEFAULT 'Registration link pending',
  registration_type    TEXT NOT NULL DEFAULT 'external',
  registration_url     TEXT NOT NULL DEFAULT '',
  payment_required     INTEGER NOT NULL DEFAULT 0,
  payment_instructions TEXT NOT NULL DEFAULT '',
  payment_url          TEXT NOT NULL DEFAULT '',
  image                TEXT NOT NULL DEFAULT '',
  additional_info      TEXT NOT NULL DEFAULT '',
  display_order        INTEGER NOT NULL DEFAULT 99,
  created_at           TEXT NOT NULL,
  updated_at           TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  name                  TEXT NOT NULL,
  type                  TEXT NOT NULL,
  date                  TEXT NOT NULL,
  location              TEXT NOT NULL,
  description           TEXT NOT NULL DEFAULT '',
  image                 TEXT NOT NULL DEFAULT '',
  application_sheet_url TEXT NOT NULL DEFAULT '',
  qr_code_image         TEXT NOT NULL DEFAULT '',
  created_at            TEXT NOT NULL,
  updated_at            TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS news (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  date_label TEXT NOT NULL,
  sort_date  TEXT NOT NULL,
  category   TEXT NOT NULL,
  excerpt    TEXT NOT NULL,
  body       TEXT NOT NULL DEFAULT '',
  image      TEXT NOT NULL DEFAULT '',
  source     TEXT NOT NULL DEFAULT '',
  url        TEXT NOT NULL DEFAULT '',
  has_video  INTEGER NOT NULL DEFAULT 0,
  likes      INTEGER NOT NULL DEFAULT 0,
  views      INTEGER NOT NULL DEFAULT 0,
  comments   INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  phone      TEXT NOT NULL DEFAULT '',
  message    TEXT NOT NULL,
  source     TEXT NOT NULL DEFAULT 'Contact page',
  status     TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read')),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id               TEXT PRIMARY KEY,
  user_id          TEXT REFERENCES users(id) ON DELETE SET NULL,
  user_name        TEXT NOT NULL,
  user_email       TEXT NOT NULL,
  competition_slug TEXT NOT NULL DEFAULT '',
  competition_name TEXT NOT NULL,
  file_name        TEXT NOT NULL,
  file_size        INTEGER NOT NULL DEFAULT 0,
  file_type        TEXT NOT NULL,
  stored_name      TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'Submitted for review'
                   CHECK (status IN ('Submitted for review', 'Approved', 'Rejected')),
  uploaded_at      TEXT NOT NULL,
  reviewed_at      TEXT
);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
