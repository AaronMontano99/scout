-- Phase 3: research engine columns. Per ADR-0008, this migration
-- deliberately extends existing tables (accounts, sources,
-- research_runs, contacts) rather than introducing parallel Claim/
-- EntityIdentity/SourceQuality/ResearchState tables — see DECISIONS.md
-- for the full reasoning behind each choice below.

-- === Account identity + user-facing research status ===================

create type account_research_status as enum (
  'queued', 'identifying', 'researching', 'processing',
  'ready', 'limited_data', 'needs_review', 'failed', 'refreshing'
);

create type account_identity_status as enum (
  'unconfirmed', 'confirmed', 'likely_match', 'lower_confidence', 'review_recommended'
);

alter table accounts
  add column research_status account_research_status not null default 'queued',
  add column identity_status account_identity_status not null default 'unconfirmed',
  add column identity_confirmed_at timestamptz,
  add column identity_confirmed_by_membership_id uuid references memberships (id) on delete set null;

create index idx_accounts_org_research_status on accounts (organization_id, research_status);

-- === Source quality (tier hierarchy, dedup, extraction tracking) ======

alter table sources
  add column source_tier smallint check (source_tier between 1 and 5),
  add column publisher_domain text,
  add column title text,
  add column extraction_status text not null default 'pending'
    check (extraction_status in ('pending', 'extracted', 'failed', 'skipped')),
  add column content_hash text;

create index idx_sources_org_content_hash on sources (organization_id, content_hash);
comment on column sources.source_tier is
  'See docs/SOURCE_MODEL.md: 1=first-party internal, 2=official company, 3=high-quality external (news/filings/reputable providers), 4=professional public info, 5=lower-confidence web data.';

-- === Research run: richer trigger taxonomy + Target List context =====

alter table research_runs
  add column target_list_id uuid references target_lists (id) on delete set null,
  add column requested_focus text,
  add column cache_used boolean not null default false;

-- Widen trigger_type per docs/RESEARCH_ENGINE.md — replaces the
-- narrower Phase 2 constraint with the Phase 3 taxonomy.
alter table research_runs drop constraint research_runs_trigger_type_check;
alter table research_runs add constraint research_runs_trigger_type_check
  check (trigger_type in (
    'initial_import', 'user_request', 'target_list_refresh',
    'stale_data', 'crm_update', 'person_correction', 'admin_retry'
  ));

create index idx_research_runs_target_list on research_runs (target_list_id);

-- === Contacts: employment freshness ====================================

alter table contacts
  add column last_verified_at timestamptz;

comment on column contacts.last_verified_at is
  'Distinct from KnowledgeItem/ResearchFinding freshness — see docs/RESEARCH_FRESHNESS.md. People change jobs; a stale last_verified_at should render as "potentially stale," never silently as current.';

-- === Research findings: event-date semantics already covered =========
-- relevant_date already distinguishes "when the underlying event
-- happened" from retrieved_at ("when Scout found it") — see
-- DATA_MODEL.md's original ResearchFinding design. Nothing to add here;
-- documented in DECISIONS.md ADR-0008 as a deliberate non-change.
