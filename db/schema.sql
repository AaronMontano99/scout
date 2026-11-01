-- Scout schema (SQLite via sql.js). Every statement is idempotent and
-- applied on startup by src/db/client.ts. Additive changes only: add new
-- tables/columns with IF NOT EXISTS or a guarded ALTER in client.ts.

-- An account is a company Aaron is calling or emailing. Created the first
-- time he says "I'm calling/emailing X"; research fills in the rest.
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  address TEXT,
  zip TEXT,
  phone TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_accounts_normalized_name ON accounts (normalized_name);

-- Notes pasted from Aaron's real CRM, verbatim. The history every call
-- card and email reopens threads from.
CREATE TABLE IF NOT EXISTS crm_notes (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_crm_notes_account ON crm_notes (account_id, created_at);

-- Live-researched intel per account (see intelSchema).
CREATE TABLE IF NOT EXISTS sdr_intel (
  account_id TEXT PRIMARY KEY REFERENCES accounts (id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  model TEXT,
  researched_at TEXT NOT NULL
);

-- Generated call cards and emails (latest per kind is current).
CREATE TABLE IF NOT EXISTS sdr_drafts (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('call_card', 'email')),
  data TEXT NOT NULL,
  instruction TEXT,
  model TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sdr_drafts_account ON sdr_drafts (account_id, kind, created_at);

-- Confirmed activity: calls, emails, walk-ins, LinkedIn. Source of
-- "Day finished" — only what Aaron logged, never estimated.
CREATE TABLE IF NOT EXISTS sdr_activities (
  id TEXT PRIMARY KEY,
  account_id TEXT REFERENCES accounts (id) ON DELETE SET NULL,
  account_name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('call', 'email', 'walk_in', 'linkedin')),
  category TEXT NOT NULL DEFAULT 'prospecting' CHECK (category IN ('prospecting', 'admin')),
  outcome TEXT,
  contact_name TEXT,
  raw_notes TEXT,
  crm_notes TEXT,
  coaching TEXT,
  connected INTEGER NOT NULL DEFAULT 0,
  decision_maker INTEGER NOT NULL DEFAULT 0,
  relevant INTEGER NOT NULL DEFAULT 0,
  meeting_asked INTEGER NOT NULL DEFAULT 0,
  meeting_booked INTEGER NOT NULL DEFAULT 0,
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sdr_activities_occurred ON sdr_activities (occurred_at);
CREATE INDEX IF NOT EXISTS idx_sdr_activities_account ON sdr_activities (account_id);

-- Hot List: Qualified-IN accounts being worked toward a meeting.
CREATE TABLE IF NOT EXISTS sdr_hotlist (
  account_id TEXT PRIMARY KEY REFERENCES accounts (id) ON DELETE CASCADE,
  priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
  stage TEXT NOT NULL DEFAULT 'new_qi' CHECK (stage IN ('new_qi', 'developing', 'warm', 'meeting_ask_ready', 'meeting_booked', 'closed')),
  contact TEXT NOT NULL DEFAULT '',
  why_qualified TEXT NOT NULL DEFAULT '',
  last_interaction TEXT NOT NULL DEFAULT '',
  learned TEXT NOT NULL DEFAULT '',
  hypothesis TEXT NOT NULL DEFAULT '',
  next_question TEXT NOT NULL DEFAULT '',
  next_action TEXT NOT NULL DEFAULT 'call' CHECK (next_action IN ('call', 'email', 'walk_in', 'linkedin', 'research')),
  next_touch_date TEXT,
  angle TEXT NOT NULL DEFAULT '',
  meeting_hypothesis TEXT NOT NULL DEFAULT '',
  close_reason TEXT NOT NULL DEFAULT '',
  added_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Last Hot List assessment per account, including "not qualified in".
CREATE TABLE IF NOT EXISTS sdr_hotlist_checks (
  account_id TEXT PRIMARY KEY REFERENCES accounts (id) ON DELETE CASCADE,
  decision TEXT NOT NULL,
  reason TEXT NOT NULL,
  checked_at TEXT NOT NULL
);

-- "Get me today's leads" suggestions, kept so none ever repeats.
CREATE TABLE IF NOT EXISTS sdr_lead_candidates (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  company TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  data TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'added', 'dismissed')),
  account_id TEXT REFERENCES accounts (id) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);

-- Single-row settings (name, callback phone, Claude model).
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'local',
  data TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);

-- Things Aaron wants to do on a date: calls, meetings, follow-ups. Separate
-- from a Hot List row's next touch, though the Schedule shows both.
CREATE TABLE IF NOT EXISTS sdr_tasks (
  id TEXT PRIMARY KEY,
  account_id TEXT REFERENCES accounts (id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'task' CHECK (kind IN ('call', 'email', 'walk_in', 'linkedin', 'meeting', 'research', 'task')),
  due_date TEXT NOT NULL,
  due_time TEXT,
  notes TEXT NOT NULL DEFAULT '',
  done_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sdr_tasks_due ON sdr_tasks (due_date);
CREATE INDEX IF NOT EXISTS idx_sdr_tasks_account ON sdr_tasks (account_id);

-- Starred accounts in the directory.
CREATE TABLE IF NOT EXISTS sdr_favorites (
  account_id TEXT PRIMARY KEY REFERENCES accounts (id) ON DELETE CASCADE,
  created_at TEXT NOT NULL
);
