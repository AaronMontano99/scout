-- Phase 0/1 foundation: tenancy core only. See docs/DATA_MODEL.md for
-- the full entity design; remaining tables (Account, Contact,
-- KnowledgeItem, etc.) are added in Phase 2+ migrations as those
-- features are built — this migration intentionally does not
-- pre-create tables no code will touch for a while.
--
-- Portable SQL per ADR-0002: uses standard Postgres RLS + auth.uid()
-- (the one Supabase-specific primitive that's hard to avoid and easy
-- to replace later), not proprietary helper functions beyond that.

create extension if not exists "pgcrypto";

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  industry text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Mirrors auth.users 1:1; see docs/SECURITY.md — app code resolves
-- identity through this table + memberships, never auth.users directly.
create table app_users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);

create type membership_role as enum ('OWNER', 'ADMIN', 'MANAGER', 'REP');
create type membership_status as enum ('active', 'invited', 'removed');

create table memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  user_id uuid not null references app_users (id) on delete cascade,
  role membership_role not null,
  status membership_status not null default 'invited',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index idx_memberships_org on memberships (organization_id);
create index idx_memberships_user on memberships (user_id);

-- One SalesProfile per Organization for V1 — see docs/DATA_MODEL.md,
-- versioning deferred (ROADMAP.md).
create table sales_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references organizations (id) on delete cascade,
  what_we_sell text,
  value_props jsonb,
  icp jsonb,
  deal_size_min numeric,
  deal_size_max numeric,
  sales_cycle_days integer,
  common_buyer_titles jsonb,
  common_influencer_titles jsonb,
  common_champion_titles jsonb,
  common_objections jsonb,
  disqualifiers jsonb,
  strategic_priorities jsonb,
  updated_at timestamptz not null default now()
);

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations (id) on delete cascade,
  actor_membership_id uuid references memberships (id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_log_org on audit_log (organization_id);

-- === Row-Level Security ===============================================
-- Defense-in-depth layer 2 (layer 1 is app-level org-scoping in every
-- query — see docs/SECURITY.md, ADR-0004). Policies below assume a
-- helper that resolves the caller's membership org ids from auth.uid().

alter table organizations enable row level security;
alter table app_users enable row level security;
alter table memberships enable row level security;
alter table sales_profiles enable row level security;
alter table audit_log enable row level security;

create or replace function current_user_organization_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select organization_id
  from memberships
  where user_id = auth.uid()
    and status = 'active';
$$;

create policy "org members can read their organization"
  on organizations for select
  using (id in (select current_user_organization_ids()));

create policy "users can read their own app_users row"
  on app_users for select
  using (id = auth.uid());

create policy "org members can read memberships in their org"
  on memberships for select
  using (organization_id in (select current_user_organization_ids()));

create policy "org members can read their sales profile"
  on sales_profiles for select
  using (organization_id in (select current_user_organization_ids()));

create policy "org members can read their audit log"
  on audit_log for select
  using (organization_id in (select current_user_organization_ids()));

-- Write policies (insert/update/delete) are intentionally deferred to
-- Phase 1 alongside the app-level permission matrix
-- (src/auth/permissions.ts) they must mirror — see docs/SECURITY.md.
-- Read-only RLS ships first so nothing is accidentally exposed while
-- write paths are still being designed.
