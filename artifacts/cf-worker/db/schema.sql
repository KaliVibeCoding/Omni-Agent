-- ─── Twilio Platform D1 Schema ───────────────────────────────────────────────
-- Apply with: wrangler d1 execute twilio-platform --file=db/schema.sql
-- For production: wrangler d1 execute twilio-platform --file=db/schema.sql --remote

CREATE TABLE IF NOT EXISTS conversations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT    NOT NULL,
  content         TEXT    NOT NULL,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS call_logs (
  sid          TEXT PRIMARY KEY,
  from_number  TEXT,
  to_number    TEXT,
  status       TEXT,
  direction    TEXT,
  duration     INTEGER DEFAULT 0,
  start_time   TEXT,
  end_time     TEXT,
  price        TEXT,
  notes        TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sms_logs (
  sid          TEXT PRIMARY KEY,
  from_number  TEXT,
  to_number    TEXT,
  body         TEXT,
  status       TEXT,
  direction    TEXT,
  num_segments INTEGER DEFAULT 1,
  price        TEXT,
  error_code   TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contacts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  phone      TEXT,
  email      TEXT,
  company    TEXT,
  notes      TEXT,
  tags       TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
