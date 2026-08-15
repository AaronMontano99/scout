-- Local SQLite schema for Scout's single-user, self-hosted mode.
--
-- Flattened from supabase/migrations/0002_core_product.sql +
-- 0003_research_engine.sql (0001_init_tenancy.sql's organizations /
-- memberships / app_users / audit_log / RLS scaffolding is dropped
-- entirely — there is exactly one implicit local user, so every
-- organization_id column from the source migrations is removed, and
-- every *_membership_id column is kept only as a plain TEXT value
-- (no memberships table to reference) so the shapes in
-- src/types/product.ts don't need to change.
--
-- Postgres -> SQLite mapping used throughout:
--   uuid            -> TEXT   (id generated in JS via crypto.randomUUID())
--   jsonb           -> TEXT   (JSON.stringify/parse at the app boundary)
--   timestamptz     -> TEXT   (ISO-8601 string, set by the app; SQLite
--                               has no reliable ISO-8601-with-Z default)
--   date             -> TEXT   (YYYY-MM-DD)
--   numeric          -> REAL
--   smallint/integer -> INTEGER
--   boolean          -> INTEGER (0/1, coerced to JS boolean in src/data)
--   enum types       -> inline CHECK (col IN (...))  -- this repo already
--                        wrote most Postgres constraints this way, so the
--                        translation is mechanical for every enum too.
--
-- supabase/migrations/ is kept as historical reference for the
-- multi-tenant shape this was flattened from — see supabase/README.md.
--
-- No migration runner exists yet: every statement below is
-- `CREATE TABLE IF NOT EXISTS`, applied idempotently on every app
-- startup by src/db/client.ts. If real schema changes are needed later
-- (a genuine multi-version migration need), that's a deliberately
-- deferred future problem — add a `schema_version` pragma + a
-- `db/migrations/` directory then, not now.

PRAGMA foreign_keys = ON;

-- === Accounts & entity resolution =====================================

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  primary_domain TEXT,
  industry TEXT,
  employee_count_range TEXT,
  address TEXT, -- JSON
  territory_id TEXT, -- unused; no territories table exists even upstream
  owner_membership_id TEXT,
  relationship_status TEXT NOT NULL DEFAULT 'unknown'
    CHECK (relationship_status IN ('prospect', 'current_customer', 'former_customer', 'partner', 'unknown')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'merged')),
  merged_into_account_id TEXT REFERENCES accounts (id) ON DELETE SET NULL,
  -- Phase 3 additions (0003), inlined directly rather than as a later ALTER:
  research_status TEXT NOT NULL DEFAULT 'queued' CHECK (research_status IN (
    'queued', 'identifying', 'researching', 'processing',
    'ready', 'limited_data', 'needs_review', 'failed', 'refreshing'
  )),
  identity_status TEXT NOT NULL DEFAULT 'unconfirmed' CHECK (identity_status IN (
    'unconfirmed', 'confirmed', 'likely_match', 'lower_confidence', 'review_recommended'
  )),
  identity_confirmed_at TEXT,
  identity_confirmed_by_membership_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_accounts_domain ON accounts (primary_domain);
CREATE INDEX IF NOT EXISTS idx_accounts_normalized_name ON accounts (normalized_name);
CREATE INDEX IF NOT EXISTS idx_accounts_research_status ON accounts (research_status);

CREATE TABLE IF NOT EXISTS account_match_candidates (
  id TEXT PRIMARY KEY,
  raw_name TEXT NOT NULL,
  raw_domain TEXT,
  raw_source TEXT NOT NULL CHECK (raw_source IN ('import_row', 'enrichment', 'crm')),
  candidate_account_id TEXT REFERENCES accounts (id) ON DELETE CASCADE,
  match_confidence REAL,
  match_method TEXT NOT NULL CHECK (match_method IN ('deterministic_domain', 'normalized_name', 'fuzzy', 'ai_assisted')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'auto_merged')),
  reviewed_by_membership_id TEXT,
  reviewed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_match_candidates_status ON account_match_candidates (status);

-- === Contacts & buying-role intelligence ==============================

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  title TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'departed', 'unknown')),
  last_verified_at TEXT, -- Phase 3 addition (0003)
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contacts_account ON contacts (account_id);

CREATE TABLE IF NOT EXISTS account_contact_relationships (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  contact_id TEXT NOT NULL REFERENCES contacts (id) ON DELETE CASCADE,
  role_hypothesis TEXT NOT NULL DEFAULT 'unknown' CHECK (role_hypothesis IN (
    'decision_maker', 'economic_buyer', 'champion', 'influencer',
    'technical_buyer', 'blocker', 'unknown'
  )),
  certainty_type TEXT NOT NULL DEFAULT 'SUGGESTED' CHECK (certainty_type IN ('KNOWN', 'INFERRED', 'SUGGESTED')),
  is_current INTEGER NOT NULL DEFAULT 1,
  valid_from TEXT NOT NULL,
  valid_until TEXT,
  source_knowledge_item_id TEXT REFERENCES knowledge_items (id) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_acr_account ON account_contact_relationships (account_id);
CREATE INDEX IF NOT EXISTS idx_acr_contact ON account_contact_relationships (contact_id);

-- === Sources, knowledge items (institutional memory core) ============

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('user', 'import', 'crm', 'enrichment', 'web', 'ai_inference')),
  name TEXT NOT NULL,
  url TEXT,
  reliability_weight REAL NOT NULL DEFAULT 0.5,
  -- Phase 3 additions (0003):
  source_tier INTEGER CHECK (source_tier BETWEEN 1 AND 5),
  publisher_domain TEXT,
  title TEXT,
  extraction_status TEXT NOT NULL DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'extracted', 'failed', 'skipped')),
  content_hash TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sources_content_hash ON sources (content_hash);

CREATE TABLE IF NOT EXISTS knowledge_items (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  contact_id TEXT REFERENCES contacts (id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  structured_value TEXT, -- JSON
  origin TEXT NOT NULL CHECK (origin IN ('user_entered', 'imported', 'crm_synced', 'research_derived', 'ai_inferred')),
  source_id TEXT REFERENCES sources (id) ON DELETE SET NULL,
  source_reference TEXT,
  source_url TEXT,
  created_by_membership_id TEXT,
  observed_at TEXT,
  imported_at TEXT,
  valid_from TEXT NOT NULL,
  valid_until TEXT,
  confidence REAL NOT NULL DEFAULT 0.5,
  certainty_type TEXT NOT NULL DEFAULT 'SUGGESTED' CHECK (certainty_type IN ('KNOWN', 'INFERRED', 'SUGGESTED')),
  verification_status TEXT NOT NULL DEFAULT 'current'
    CHECK (verification_status IN ('current', 'stale', 'superseded', 'conflicting', 'unverified')),
  supersedes TEXT REFERENCES knowledge_items (id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_knowledge_items_account ON knowledge_items (account_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_type ON knowledge_items (type);

-- === Contract / incumbent info =========================================

CREATE TABLE IF NOT EXISTS contract_info (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  incumbent_vendor TEXT,
  contract_start_date TEXT,
  contract_end_date TEXT,
  lease_end_date TEXT,
  certainty_type TEXT NOT NULL DEFAULT 'SUGGESTED' CHECK (certainty_type IN ('KNOWN', 'INFERRED', 'SUGGESTED')),
  source_knowledge_item_id TEXT REFERENCES knowledge_items (id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contract_info_account ON contract_info (account_id);

-- === Interactions (raw logged activity, distinct from extracted knowledge) ===

CREATE TABLE IF NOT EXISTS interactions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  contact_id TEXT REFERENCES contacts (id) ON DELETE SET NULL,
  membership_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note')),
  occurred_at TEXT NOT NULL,
  summary TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'import', 'crm_sync')),
  external_ref TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_interactions_account ON interactions (account_id);

-- === Research: runs, findings, signals, scores =========================

CREATE TABLE IF NOT EXISTS research_runs (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'initial_import', 'user_request', 'target_list_refresh',
    'stale_data', 'crm_update', 'person_correction', 'admin_retry'
  )),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  started_at TEXT,
  completed_at TEXT,
  cost_cents INTEGER,
  provider_calls TEXT, -- JSON
  -- Phase 3 additions (0003):
  target_list_id TEXT REFERENCES target_lists (id) ON DELETE SET NULL,
  requested_focus TEXT,
  cache_used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_research_runs_account ON research_runs (account_id);
CREATE INDEX IF NOT EXISTS idx_research_runs_status ON research_runs (status);
CREATE INDEX IF NOT EXISTS idx_research_runs_target_list ON research_runs (target_list_id);

CREATE TABLE IF NOT EXISTS research_findings (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  research_run_id TEXT REFERENCES research_runs (id) ON DELETE CASCADE,
  source_id TEXT REFERENCES sources (id) ON DELETE SET NULL,
  finding_type TEXT NOT NULL,
  content TEXT NOT NULL,
  structured_value TEXT, -- JSON
  url TEXT,
  retrieved_at TEXT NOT NULL,
  relevant_date TEXT,
  confidence REAL NOT NULL DEFAULT 0.5,
  certainty_type TEXT NOT NULL DEFAULT 'SUGGESTED' CHECK (certainty_type IN ('KNOWN', 'INFERRED', 'SUGGESTED')),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_research_findings_account ON research_findings (account_id);

CREATE TABLE IF NOT EXISTS signals (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('expansion', 'leadership_change', 'funding', 'hiring', 'tech_change', 'filing', 'other')),
  detected_at TEXT NOT NULL,
  strength REAL,
  research_finding_id TEXT REFERENCES research_findings (id) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_signals_account ON signals (account_id);

CREATE TABLE IF NOT EXISTS account_scores (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  total_score REAL,
  computed_at TEXT NOT NULL,
  model_version TEXT,
  explanation_summary TEXT
);

CREATE INDEX IF NOT EXISTS idx_account_scores_account ON account_scores (account_id);

CREATE TABLE IF NOT EXISTS account_score_components (
  id TEXT PRIMARY KEY,
  account_score_id TEXT NOT NULL REFERENCES account_scores (id) ON DELETE CASCADE,
  component_type TEXT NOT NULL CHECK (component_type IN
    ('icp_fit', 'timing', 'relationship', 'signal_strength', 'historical_context', 'data_confidence', 'strategic_priority')),
  points REAL NOT NULL,
  max_points REAL NOT NULL,
  evidence_refs TEXT -- JSON
);

-- === Imports ============================================================

CREATE TABLE IF NOT EXISTS imports (
  id TEXT PRIMARY KEY,
  membership_id TEXT,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('csv', 'xlsx')),
  file_storage_path TEXT,
  status TEXT NOT NULL DEFAULT 'uploaded'
    CHECK (status IN ('uploaded', 'mapping', 'processing', 'completed', 'failed')),
  column_mapping TEXT, -- JSON
  row_count INTEGER,
  error_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS import_rows (
  id TEXT PRIMARY KEY,
  import_id TEXT NOT NULL REFERENCES imports (id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  raw_data TEXT NOT NULL, -- JSON
  resolution_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (resolution_status IN ('pending', 'imported', 'needs_review', 'failed')),
  matched_account_id TEXT REFERENCES accounts (id) ON DELETE SET NULL,
  match_candidate_id TEXT REFERENCES account_match_candidates (id) ON DELETE SET NULL,
  error TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_import_rows_import ON import_rows (import_id);
CREATE INDEX IF NOT EXISTS idx_import_rows_import_status ON import_rows (import_id, resolution_status);

-- === Integrations =======================================================
-- Unused in local-first mode (no live CRM/enrichment/research provider is
-- connected) — kept so the shape exists if src/services/*-provider.ts
-- interfaces are ever wired up to a real adapter later.

CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('crm', 'enrichment', 'research')),
  provider_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  credentials_ref TEXT, -- reference into a secrets store, never a raw credential — see docs/SECURITY.md
  connected_by_membership_id TEXT,
  connected_at TEXT,
  last_synced_at TEXT,
  config TEXT -- JSON
);

-- === Target Lists (primary workspace object — see ADR-0006) ===========

CREATE TABLE IF NOT EXISTS target_lists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_membership_id TEXT,
  created_by_membership_id TEXT,
  research_focus TEXT,
  vertical TEXT,
  geography TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TEXT NOT NULL,
  last_worked_at TEXT
);

CREATE TABLE IF NOT EXISTS target_list_items (
  id TEXT PRIMARY KEY,
  target_list_id TEXT NOT NULL REFERENCES target_lists (id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'worked', 'skipped')),
  pinned INTEGER NOT NULL DEFAULT 0,
  position INTEGER,
  worked_at TEXT,
  added_at TEXT NOT NULL,
  UNIQUE (target_list_id, account_id)
);

CREATE INDEX IF NOT EXISTS idx_target_list_items_list ON target_list_items (target_list_id);
CREATE INDEX IF NOT EXISTS idx_target_list_items_list_status ON target_list_items (target_list_id, status);

-- === Seller Style (distinct memory category — see docs/SELLER_STYLE.md) ====

CREATE TABLE IF NOT EXISTS seller_style_profiles (
  id TEXT PRIMARY KEY,
  membership_id TEXT NOT NULL UNIQUE,
  sample_scripts TEXT NOT NULL DEFAULT '[]', -- JSON
  sample_emails TEXT NOT NULL DEFAULT '[]', -- JSON
  sample_voicemails TEXT NOT NULL DEFAULT '[]', -- JSON
  tone_notes TEXT,
  updated_at TEXT NOT NULL
);

-- === Call outcomes, selling situations, post-call notes ================

CREATE TABLE IF NOT EXISTS call_outcomes (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  target_list_item_id TEXT REFERENCES target_list_items (id) ON DELETE SET NULL,
  contact_id TEXT REFERENCES contacts (id) ON DELETE SET NULL,
  membership_id TEXT NOT NULL,
  outcome_type TEXT NOT NULL CHECK (outcome_type IN (
    'no_answer', 'voicemail', 'gatekeeper', 'general_staff', 'influencer',
    'champion', 'decision_maker', 'other_executive', 'wrong_contact',
    'not_interested', 'connected', 'meeting_booked', 'follow_up_required'
  )),
  contact_role_observed TEXT,
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_call_outcomes_account ON call_outcomes (account_id);
CREATE INDEX IF NOT EXISTS idx_call_outcomes_target_list_item ON call_outcomes (target_list_item_id);

CREATE TABLE IF NOT EXISTS selling_situation_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  criteria TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_by_membership_id TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS selling_situations (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  definition_id TEXT NOT NULL REFERENCES selling_situation_definitions (id) ON DELETE RESTRICT,
  created_from_call_outcome_id TEXT REFERENCES call_outcomes (id) ON DELETE SET NULL,
  created_by_membership_id TEXT,
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_selling_situations_account ON selling_situations (account_id);

CREATE TABLE IF NOT EXISTS post_call_notes (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  call_outcome_id TEXT NOT NULL REFERENCES call_outcomes (id) ON DELETE CASCADE,
  membership_id TEXT NOT NULL,
  raw_input TEXT NOT NULL,
  clean_note TEXT,
  proposed_account_updates TEXT, -- JSON
  follow_up_email_draft TEXT,
  approved_at TEXT,
  approved_by_membership_id TEXT,
  crm_write_status TEXT NOT NULL DEFAULT 'not_applicable'
    CHECK (crm_write_status IN ('not_applicable', 'pending', 'written', 'failed')),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_post_call_notes_account ON post_call_notes (account_id);

-- === Analytics (event-sourced — see docs/PROSPECTING_ANALYTICS.md) =========

CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'call_attempted', 'conversation', 'target_conversation', 'meeting_booked',
    'selling_situation_created', 'opportunity_created', 'email_drafted',
    'email_sent', 'crm_note_created', 'contact_added', 'account_worked'
  )),
  account_id TEXT REFERENCES accounts (id) ON DELETE SET NULL,
  target_list_id TEXT REFERENCES target_lists (id) ON DELETE SET NULL,
  contact_id TEXT REFERENCES contacts (id) ON DELETE SET NULL,
  membership_id TEXT,
  metadata TEXT, -- JSON
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events (event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_occurred ON analytics_events (occurred_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_target_list ON analytics_events (target_list_id);

-- === Settings (local-first, single implicit user) =====================
-- One row, free-form JSON — this workspace has exactly one user and a
-- handful of profile fields (see docs/PRODUCT_UX.md's Settings screen),
-- so a full key/value table would be needless structure for what it
-- stores. See src/data/settings.ts.

CREATE TABLE IF NOT EXISTS workspace_settings (
  id TEXT PRIMARY KEY DEFAULT 'local',
  data TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);
