# Founder Operations

## Why this exists

One founder handles sales, demos, onboarding, implementation, support,
and operations alone (`PRODUCT_CONSTITUTION.md`). Every customer
problem has to be diagnosable without manually querying production
tables — product spec §88.

## The Founder Operations Console

Internal, cross-organization admin view. Full design spec, view list,
and mockup: see the console's dedicated architecture note in
`ARCHITECTURE.md`-adjacent design below and the minimal implementation
stub at `src/app/admin/page.tsx`.

Views: **Customer** (org/plan/pilot-or-paid/seats/users), **Implementation**
(onboarding state, target lists, imports, First Value), **Integrations**
(connected systems, last sync, errors), **Research** (accounts
researched, queue status, failed jobs, provider health, cost),
**Product Activity** (accounts worked, meetings, selling situations,
emails, CRM updates), **Billing** (subscription, payment status),
**Health** (Healthy / Needs Attention / At Risk — see below).

## Authorization (hard requirement, not a secret URL)

Gated on `app_users.platform_admin = true` (ADR-0007,
`supabase/migrations/0002_core_product.sql`) — a platform-level flag,
deliberately separate from any org-scoped `Membership.role`, set
directly in the database rather than through any self-service flow.
Every console read is audit-logged (`AuditLog`, `SECURITY.md`). See
`docs/runbooks/USER_ACCESS.md`.

## Customer health — computed, not predicted

`Healthy` / `Needs Attention` / `At Risk`, computed on read from real
signals (days since login, days since last research, days since last
`AnalyticsEvent`, integration connection status) — explicitly not a
predictive churn model (product spec §87, `DATA_MODEL.md`'s "Customer
health — computed, not stored"). The calculation must stay explainable
enough that the founder can look at a status and immediately know why.

## Support diagnostics

The console must answer, without a manual query, every question in
product spec §88: why didn't this account research, why did a list
stall, why is a CRM disconnected, why didn't a note sync, why was a
company matched incorrectly, why can't a rep see a list, why did
research cost spike, why wasn't an email drafted, why is today's data
stale. See `docs/runbooks/` for the corresponding failure-mode
runbooks — the console's job is surfacing the *symptom*; the runbook is
the *procedure* once the founder sees it.

## Status

Design + minimal route stub only in Phase 2 (`src/app/admin/page.tsx`)
— no live data, no real authorization check wired to a live Supabase
project yet (none is provisioned — see `README.md`). Full
implementation is Phase 6+ (`ROADMAP.md`), built alongside real
customer data existing to operate on.
