-- Phase 2: core product schema. See docs/DATA_MODEL.md for the full
-- entity design (Phase 1 base entities + "Phase 2 Additions" section).
-- This is the first migration to create Account/Contact/KnowledgeItem/
-- etc. — 0001 only covered tenancy. Portable SQL per ADR-0002; RLS
-- policies follow 0001's pattern (read-only for now, write policies
-- land alongside src/auth/permissions.ts in the same phase that
-- builds real mutation code, not speculatively here).

alter table organizations
  add column first_value_at timestamptz;

alter table app_users
  add column platform_admin boolean not null default false;

-- === Accounts & entity resolution =====================================

create type account_relationship_status as enum (
  'prospect', 'current_customer', 'former_customer', 'partner', 'unknown'
);

create table accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  normalized_name text not null,
  primary_domain text,
  industry text,
  employee_count_range text,
  address jsonb,
  territory_id uuid,
  owner_membership_id uuid references memberships (id) on delete set null,
  relationship_status account_relationship_status not null default 'unknown',
  status text not null default 'active' check (status in ('active', 'inactive', 'merged')),
  merged_into_account_id uuid references accounts (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_accounts_org on accounts (organization_id);
create index idx_accounts_org_domain on accounts (organization_id, primary_domain);
create index idx_accounts_org_normalized_name on accounts (organization_id, normalized_name);

create table account_match_candidates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  raw_name text not null,
  raw_domain text,
  raw_source text not null check (raw_source in ('import_row', 'enrichment', 'crm')),
  candidate_account_id uuid references accounts (id) on delete cascade,
  match_confidence numeric,
  match_method text not null check (match_method in ('deterministic_domain', 'normalized_name', 'fuzzy', 'ai_assisted')),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected', 'auto_merged')),
  reviewed_by_membership_id uuid references memberships (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_match_candidates_org_status on account_match_candidates (organization_id, status);

-- === Contacts & buying-role intelligence ==============================

create table contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  account_id uuid not null references accounts (id) on delete cascade,
  first_name text,
  last_name text,
  title text,
  email text,
  phone text,
  linkedin_url text,
  status text not null default 'active' check (status in ('active', 'departed', 'unknown')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_contacts_org_account on contacts (organization_id, account_id);

create type buying_role as enum (
  'decision_maker', 'economic_buyer', 'champion', 'influencer',
  'technical_buyer', 'blocker', 'unknown'
);
create type certainty_type as enum ('KNOWN', 'INFERRED', 'SUGGESTED');

create table account_contact_relationships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  account_id uuid not null references accounts (id) on delete cascade,
  contact_id uuid not null references contacts (id) on delete cascade,
  role_hypothesis buying_role not null default 'unknown',
  certainty_type certainty_type not null default 'SUGGESTED',
  is_current boolean not null default true,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  source_knowledge_item_id uuid, -- FK added after knowledge_items exists, see below
  created_at timestamptz not null default now()
);

create index idx_acr_org_account on account_contact_relationships (organization_id, account_id);
create index idx_acr_contact on account_contact_relationships (contact_id);

-- === Sources, knowledge items (institutional memory core) ============

create table sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  type text not null check (type in ('user', 'import', 'crm', 'enrichment', 'web', 'ai_inference')),
  name text not null,
  url text,
  reliability_weight numeric not null default 0.5,
  created_at timestamptz not null default now()
);

create index idx_sources_org on sources (organization_id);

create table knowledge_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  account_id uuid not null references accounts (id) on delete cascade,
  contact_id uuid references contacts (id) on delete set null,
  type text not null,
  content text not null,
  structured_value jsonb,
  origin text not null check (origin in ('user_entered', 'imported', 'crm_synced', 'research_derived', 'ai_inferred')),
  source_id uuid references sources (id) on delete set null,
  source_reference text,
  source_url text,
  created_by_membership_id uuid references memberships (id) on delete set null,
  observed_at timestamptz,
  imported_at timestamptz,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  confidence numeric not null default 0.5,
  certainty_type certainty_type not null default 'SUGGESTED',
  verification_status text not null default 'current'
    check (verification_status in ('current', 'stale', 'superseded', 'conflicting', 'unverified')),
  supersedes uuid references knowledge_items (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_knowledge_items_org_account on knowledge_items (organization_id, account_id);
create index idx_knowledge_items_org_type on knowledge_items (organization_id, type);

alter table account_contact_relationships
  add constraint fk_acr_source_knowledge_item
  foreign key (source_knowledge_item_id) references knowledge_items (id) on delete set null;

-- === Contract / incumbent info =========================================

create table contract_info (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  account_id uuid not null references accounts (id) on delete cascade,
  incumbent_vendor text,
  contract_start_date date,
  contract_end_date date,
  lease_end_date date,
  certainty_type certainty_type not null default 'SUGGESTED',
  source_knowledge_item_id uuid references knowledge_items (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_contract_info_org_account on contract_info (organization_id, account_id);

-- === Interactions (raw logged activity, distinct from extracted knowledge) ===

create table interactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  account_id uuid not null references accounts (id) on delete cascade,
  contact_id uuid references contacts (id) on delete set null,
  membership_id uuid references memberships (id) on delete set null,
  type text not null check (type in ('call', 'email', 'meeting', 'note')),
  occurred_at timestamptz not null default now(),
  summary text,
  source text not null default 'manual' check (source in ('manual', 'import', 'crm_sync')),
  external_ref text,
  created_at timestamptz not null default now()
);

create index idx_interactions_org_account on interactions (organization_id, account_id);

-- === Research: runs, findings, signals, scores =========================

create table research_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  account_id uuid not null references accounts (id) on delete cascade,
  trigger_type text not null check (trigger_type in ('manual', 'scheduled', 'import_triggered')),
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed')),
  started_at timestamptz,
  completed_at timestamptz,
  cost_cents integer,
  provider_calls jsonb,
  created_at timestamptz not null default now()
);

create index idx_research_runs_org_account on research_runs (organization_id, account_id);
create index idx_research_runs_org_status on research_runs (organization_id, status);

create table research_findings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  account_id uuid not null references accounts (id) on delete cascade,
  research_run_id uuid references research_runs (id) on delete cascade,
  source_id uuid references sources (id) on delete set null,
  finding_type text not null,
  content text not null,
  structured_value jsonb,
  url text,
  retrieved_at timestamptz not null default now(),
  relevant_date date,
  confidence numeric not null default 0.5,
  certainty_type certainty_type not null default 'SUGGESTED',
  created_at timestamptz not null default now()
);

create index idx_research_findings_org_account on research_findings (organization_id, account_id);

create table signals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  account_id uuid not null references accounts (id) on delete cascade,
  signal_type text not null check (signal_type in ('expansion', 'leadership_change', 'funding', 'hiring', 'tech_change', 'filing', 'other')),
  detected_at timestamptz not null default now(),
  strength numeric,
  research_finding_id uuid references research_findings (id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_signals_org_account on signals (organization_id, account_id);

create table account_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  account_id uuid not null references accounts (id) on delete cascade,
  total_score numeric,
  computed_at timestamptz not null default now(),
  model_version text,
  explanation_summary text
);

create index idx_account_scores_org_account on account_scores (organization_id, account_id);

create table account_score_components (
  id uuid primary key default gen_random_uuid(),
  account_score_id uuid not null references account_scores (id) on delete cascade,
  component_type text not null check (component_type in
    ('icp_fit', 'timing', 'relationship', 'signal_strength', 'historical_context', 'data_confidence', 'strategic_priority')),
  points numeric not null,
  max_points numeric not null,
  evidence_refs jsonb
);

-- === Imports ============================================================

create table imports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  membership_id uuid references memberships (id) on delete set null,
  file_name text not null,
  file_type text not null check (file_type in ('csv', 'xlsx')),
  file_storage_path text,
  status text not null default 'uploaded'
    check (status in ('uploaded', 'mapping', 'processing', 'completed', 'failed')),
  column_mapping jsonb,
  row_count integer,
  error_count integer not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index idx_imports_org on imports (organization_id);

create table import_rows (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references imports (id) on delete cascade,
  row_number integer not null,
  raw_data jsonb not null,
  resolution_status text not null default 'pending'
    check (resolution_status in ('pending', 'imported', 'needs_review', 'failed')),
  matched_account_id uuid references accounts (id) on delete set null,
  match_candidate_id uuid references account_match_candidates (id) on delete set null,
  error text,
  created_at timestamptz not null default now()
);

create index idx_import_rows_import on import_rows (import_id);
create index idx_import_rows_import_status on import_rows (import_id, resolution_status);

-- === Integrations =======================================================

create table integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  provider_type text not null check (provider_type in ('crm', 'enrichment', 'research')),
  provider_name text not null,
  status text not null default 'disconnected' check (status in ('connected', 'disconnected', 'error')),
  credentials_ref text, -- reference into a secrets store, never a raw credential — see SECURITY.md
  connected_by_membership_id uuid references memberships (id) on delete set null,
  connected_at timestamptz,
  last_synced_at timestamptz,
  config jsonb
);

create index idx_integrations_org on integrations (organization_id);

-- === Target Lists (primary workspace object — see ADR-0006) ===========

create table target_lists (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  description text,
  owner_membership_id uuid references memberships (id) on delete set null,
  created_by_membership_id uuid references memberships (id) on delete set null,
  research_focus text,
  vertical text,
  geography text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  last_worked_at timestamptz
);

create index idx_target_lists_org on target_lists (organization_id);
create index idx_target_lists_org_owner on target_lists (organization_id, owner_membership_id);

create table target_list_items (
  id uuid primary key default gen_random_uuid(),
  target_list_id uuid not null references target_lists (id) on delete cascade,
  account_id uuid not null references accounts (id) on delete cascade,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'worked', 'skipped')),
  pinned boolean not null default false,
  position integer,
  worked_at timestamptz,
  added_at timestamptz not null default now(),
  unique (target_list_id, account_id)
);

create index idx_target_list_items_list on target_list_items (target_list_id);
create index idx_target_list_items_list_status on target_list_items (target_list_id, status);

-- === Seller Style (distinct memory category — see SELLER_STYLE.md) ====

create table seller_style_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  membership_id uuid not null references memberships (id) on delete cascade,
  sample_scripts jsonb not null default '[]',
  sample_emails jsonb not null default '[]',
  sample_voicemails jsonb not null default '[]',
  tone_notes text,
  updated_at timestamptz not null default now(),
  unique (membership_id)
);

-- === Call outcomes, selling situations, post-call notes ================

create type call_outcome_type as enum (
  'no_answer', 'voicemail', 'gatekeeper', 'general_staff', 'influencer',
  'champion', 'decision_maker', 'other_executive', 'wrong_contact',
  'not_interested', 'connected', 'meeting_booked', 'follow_up_required'
);

create table call_outcomes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  account_id uuid not null references accounts (id) on delete cascade,
  target_list_item_id uuid references target_list_items (id) on delete set null,
  contact_id uuid references contacts (id) on delete set null,
  membership_id uuid not null references memberships (id) on delete set null,
  outcome_type call_outcome_type not null,
  contact_role_observed text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index idx_call_outcomes_org_account on call_outcomes (organization_id, account_id);
create index idx_call_outcomes_org_membership on call_outcomes (organization_id, membership_id);
create index idx_call_outcomes_target_list_item on call_outcomes (target_list_item_id);

create table selling_situation_definitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  criteria text not null,
  is_default boolean not null default false,
  created_by_membership_id uuid references memberships (id) on delete set null,
  created_at timestamptz not null default now()
);

create table selling_situations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  account_id uuid not null references accounts (id) on delete cascade,
  definition_id uuid not null references selling_situation_definitions (id) on delete restrict,
  created_from_call_outcome_id uuid references call_outcomes (id) on delete set null,
  created_by_membership_id uuid references memberships (id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_selling_situations_org_account on selling_situations (organization_id, account_id);

create table post_call_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  account_id uuid not null references accounts (id) on delete cascade,
  call_outcome_id uuid not null references call_outcomes (id) on delete cascade,
  membership_id uuid not null references memberships (id) on delete set null,
  raw_input text not null,
  clean_note text,
  proposed_account_updates jsonb,
  follow_up_email_draft text,
  approved_at timestamptz,
  approved_by_membership_id uuid references memberships (id) on delete set null,
  crm_write_status text not null default 'not_applicable'
    check (crm_write_status in ('not_applicable', 'pending', 'written', 'failed')),
  created_at timestamptz not null default now()
);

create index idx_post_call_notes_org_account on post_call_notes (organization_id, account_id);

-- === Analytics (event-sourced — see PROSPECTING_ANALYTICS.md) =========

create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  event_type text not null check (event_type in (
    'call_attempted', 'conversation', 'target_conversation', 'meeting_booked',
    'selling_situation_created', 'opportunity_created', 'email_drafted',
    'email_sent', 'crm_note_created', 'contact_added', 'account_worked'
  )),
  account_id uuid references accounts (id) on delete set null,
  target_list_id uuid references target_lists (id) on delete set null,
  contact_id uuid references contacts (id) on delete set null,
  membership_id uuid references memberships (id) on delete set null,
  metadata jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index idx_analytics_events_org_type on analytics_events (organization_id, event_type);
create index idx_analytics_events_org_occurred on analytics_events (organization_id, occurred_at);
create index idx_analytics_events_target_list on analytics_events (target_list_id);

-- === Row-Level Security =================================================
-- Same pattern as 0001: read-only policies now (current_user_organization_ids()
-- already defined in 0001), write policies land with the mutation code
-- that needs them, kept in lockstep with src/auth/permissions.ts.

alter table accounts enable row level security;
alter table account_match_candidates enable row level security;
alter table contacts enable row level security;
alter table account_contact_relationships enable row level security;
alter table sources enable row level security;
alter table knowledge_items enable row level security;
alter table contract_info enable row level security;
alter table interactions enable row level security;
alter table research_runs enable row level security;
alter table research_findings enable row level security;
alter table signals enable row level security;
alter table account_scores enable row level security;
alter table account_score_components enable row level security;
alter table imports enable row level security;
alter table import_rows enable row level security;
alter table integrations enable row level security;
alter table target_lists enable row level security;
alter table target_list_items enable row level security;
alter table seller_style_profiles enable row level security;
alter table call_outcomes enable row level security;
alter table selling_situation_definitions enable row level security;
alter table selling_situations enable row level security;
alter table post_call_notes enable row level security;
alter table analytics_events enable row level security;

create policy "org members can read accounts" on accounts for select
  using (organization_id in (select current_user_organization_ids()));
create policy "org members can read match candidates" on account_match_candidates for select
  using (organization_id in (select current_user_organization_ids()));
create policy "org members can read contacts" on contacts for select
  using (organization_id in (select current_user_organization_ids()));
create policy "org members can read account_contact_relationships" on account_contact_relationships for select
  using (organization_id in (select current_user_organization_ids()));
create policy "org members can read sources" on sources for select
  using (organization_id in (select current_user_organization_ids()));
create policy "org members can read knowledge_items" on knowledge_items for select
  using (organization_id in (select current_user_organization_ids()));
create policy "org members can read contract_info" on contract_info for select
  using (organization_id in (select current_user_organization_ids()));
create policy "org members can read interactions" on interactions for select
  using (organization_id in (select current_user_organization_ids()));
create policy "org members can read research_runs" on research_runs for select
  using (organization_id in (select current_user_organization_ids()));
create policy "org members can read research_findings" on research_findings for select
  using (organization_id in (select current_user_organization_ids()));
create policy "org members can read signals" on signals for select
  using (organization_id in (select current_user_organization_ids()));
create policy "org members can read account_scores" on account_scores for select
  using (organization_id in (select current_user_organization_ids()));
create policy "org members can read account_score_components" on account_score_components for select
  using (account_score_id in (
    select id from account_scores where organization_id in (select current_user_organization_ids())
  ));
create policy "org members can read imports" on imports for select
  using (organization_id in (select current_user_organization_ids()));
create policy "org members can read import_rows" on import_rows for select
  using (import_id in (
    select id from imports where organization_id in (select current_user_organization_ids())
  ));
create policy "org members can read integrations" on integrations for select
  using (organization_id in (select current_user_organization_ids()));
create policy "org members can read target_lists" on target_lists for select
  using (organization_id in (select current_user_organization_ids()));
create policy "org members can read target_list_items" on target_list_items for select
  using (target_list_id in (
    select id from target_lists where organization_id in (select current_user_organization_ids())
  ));
create policy "org members can read seller_style_profiles" on seller_style_profiles for select
  using (organization_id in (select current_user_organization_ids()));
create policy "org members can read call_outcomes" on call_outcomes for select
  using (organization_id in (select current_user_organization_ids()));
create policy "org members can read selling_situation_definitions" on selling_situation_definitions for select
  using (organization_id in (select current_user_organization_ids()));
create policy "org members can read selling_situations" on selling_situations for select
  using (organization_id in (select current_user_organization_ids()));
create policy "org members can read post_call_notes" on post_call_notes for select
  using (organization_id in (select current_user_organization_ids()));
create policy "org members can read analytics_events" on analytics_events for select
  using (organization_id in (select current_user_organization_ids()));

-- Platform admin override: a small number of read policies additionally
-- allow app_users.platform_admin = true to select across all
-- organizations, for the Founder Operations Console (see ADR-0007,
-- docs/FOUNDER_OPERATIONS.md). Every such read must still be
-- audit-logged at the application layer — this policy grants DB-level
-- access, not a bypass of the audit requirement.
create or replace function is_platform_admin()
returns boolean
language sql
security definer
stable
as $$
  select coalesce((select platform_admin from app_users where id = auth.uid()), false);
$$;

create policy "platform admins can read all organizations" on organizations for select
  using (is_platform_admin());
create policy "platform admins can read all target_lists" on target_lists for select
  using (is_platform_admin());
create policy "platform admins can read all analytics_events" on analytics_events for select
  using (is_platform_admin());
