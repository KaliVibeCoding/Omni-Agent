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

-- ─── Telehealth Tables ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS appointments (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_name     TEXT    NOT NULL,
  patient_phone    TEXT    NOT NULL,
  patient_email    TEXT,
  provider_name    TEXT,
  appointment_time TEXT    NOT NULL,
  status           TEXT    NOT NULL DEFAULT 'scheduled',
  type             TEXT    NOT NULL DEFAULT 'telehealth',
  notes            TEXT,
  reminder_sent    INTEGER NOT NULL DEFAULT 0,
  video_room_sid   TEXT,
  created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS video_rooms (
  sid              TEXT PRIMARY KEY,
  unique_name      TEXT,
  friendly_name    TEXT,
  type             TEXT    DEFAULT 'go',
  status           TEXT    DEFAULT 'in-progress',
  patient_identity TEXT,
  provider_identity TEXT,
  appointment_id   INTEGER REFERENCES appointments(id),
  duration         INTEGER DEFAULT 0,
  date_created     TEXT,
  date_completed   TEXT,
  created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ─── Multi-Tenant Credentials ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenant_credentials (
  id                       INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id                  TEXT    NOT NULL UNIQUE,
  account_sid              TEXT    NOT NULL,
  auth_token_encrypted     TEXT    NOT NULL,
  account_name             TEXT,
  api_key_sid              TEXT,
  api_key_secret_encrypted TEXT,
  phone_number             TEXT,
  plan                     TEXT    NOT NULL DEFAULT 'starter',
  created_at               TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at               TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ─── Industry Hub Records (all 19 niches share this table, partitioned by slug) ─

CREATE TABLE IF NOT EXISTS niche_records (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT    NOT NULL,
  entity_name   TEXT    NOT NULL,
  entity_phone  TEXT    NOT NULL,
  entity_email  TEXT,
  record_type   TEXT    DEFAULT 'general',
  status        TEXT    DEFAULT 'new',
  notes         TEXT,
  assigned_to   TEXT,
  scheduled_at  TEXT,
  reminder_sent INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_messages_conversation   ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_created       ON call_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created        ON sms_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_contacts_name           ON contacts(name);
CREATE INDEX IF NOT EXISTS idx_appointments_time       ON appointments(appointment_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status     ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_phone      ON appointments(patient_phone);
CREATE INDEX IF NOT EXISTS idx_tenant_credentials_user ON tenant_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_niche_records_slug      ON niche_records(slug);
CREATE INDEX IF NOT EXISTS idx_niche_records_slug_stat ON niche_records(slug, status);
