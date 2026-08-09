# Architecture Decision Records

Format: `ADR-XXXX`, status, context, decision, consequences. Once
accepted, an ADR is not silently edited — a changed decision gets a new
ADR that supersedes the old one.

---

## ADR-0001: Modular monolith over microservices for V1

**Status:** Accepted

**Context:** Solo founder, pre-revenue, need to move fast without
accumulating unmanageable operational surface. The source brief
explicitly warns against premature microservice splits.

**Decision:** Single Next.js deployable with enforced internal module
boundaries (`domain`, `services`, `integrations`, `ai`, `jobs`) via
directory structure and import discipline. No inter-service network
calls, no service mesh, no per-module deployment pipeline.

**Consequences:** Faster iteration, one thing to deploy/monitor/debug.
Trade-off: if one module (most likely research/enrichment processing)
needs independent scaling later, extracting it requires discipline
maintained now (clean interfaces) to pay off — see `ARCHITECTURE.md`.

---

## ADR-0002: Supabase for Postgres + Auth + Storage

**Status:** Accepted, with mitigation

**Context:** Solo founder needs to avoid hand-rolling auth,
infrastructure, and storage from scratch. Supabase bundles Postgres,
Auth, Storage, and RLS support on one platform.

**Decision:** Use Supabase for all three. Mitigate platform lock-in by
(a) wrapping Supabase Auth behind an internal `src/auth` interface so
call sites don't depend on the Supabase SDK shape directly, and (b)
writing RLS policies in portable SQL rather than Supabase-proprietary
constructs beyond standard claim access.

**Consequences:** Fast to build, less infra to operate. Real
dependency on Supabase as a platform (not just a library) — migrating
away later means migrating auth and data together. Accepted as
worthwhile given the velocity need at this stage; revisit if Supabase
becomes a demonstrated constraint (pricing, reliability, feature gaps).

---

## ADR-0003: Background job runner selected via internal interface, not hardcoded to Trigger.dev

**Status:** Accepted

**Context:** Source brief names Trigger.dev specifically. Trigger.dev
is a reasonable choice but not the only viable durable-job runner
(Inngest, Graphile Worker on the same Postgres instance are
alternatives), and domain code shouldn't care which one is running.

**Decision:** Define an internal `JobQueue` interface (enqueue,
schedule, idempotency key, retry policy) in `src/jobs`. Trigger.dev is
the Phase 0 implementation behind that interface, chosen for its
managed-service simplicity for a solo founder, but it's a config/
adapter choice, not something domain code calls directly.

**Consequences:** Slight extra abstraction cost now; avoids a rewrite
if Trigger.dev's pricing or limits become a problem at scale.

---

## ADR-0004: Dual-layer authorization — app-level checks AND Postgres RLS, not one or the other

**Status:** Accepted (council disagreement resolved)

**Context:** CTO council role initially favored RLS-only for
simplicity (fewer places to get authorization wrong). Founder/Product
role pushed back: RLS alone means a raw debugging query or an admin
tool bypasses the same protection app code gets, and is invisible in
code review the way an app-level check is.

**Decision:** Both layers, always. App-level checks scope every query
explicitly by `organization_id` resolved from the authenticated
Membership; RLS is the backstop that fails closed if app logic has a
bug. See `SECURITY.md`.

**Consequences:** More to implement and test up front. Judged worth it
given the total severity of a cross-tenant data leak for a product
whose entire value proposition is trustworthy handling of confidential
sales data.

---

## ADR-0005: Entity resolution never auto-merges below full deterministic confidence

**Status:** Accepted (council disagreement resolved)

**Context:** CFO/Founder roles favored more aggressive auto-merging
(including AI-assisted fuzzy matches) to reduce manual review burden
during import, since review queues slow down time-to-value. CTO/CRO
roles objected: a wrong auto-merge corrupts institutional memory
(the product's core asset) in a way that's hard to detect and worse
than a slower import.

**Decision:** Only deterministic domain match, or normalized-name
match corroborated by a second independent signal, auto-applies.
Fuzzy and AI-assisted matches always create a human-reviewable
`AccountMatchCandidate` (see `DATA_MODEL.md`).

**Consequences:** Slower import for messy spreadsheets with real
duplicates; explicit tradeoff of speed for data integrity, judged
correct given the product's institutional-memory premise.

---

## ADR-0006: TargetList/TargetListItem supersede DailyPlan/DailyPlanItem

**Status:** Accepted

**Context:** Phase 1 designed `DailyPlan` as a single-day ranked
account list. The Phase 2 commercial product spec makes persistent,
named, multi-day prospecting workspaces ("Construction," "Law Firms")
the central object — a rep leaves a list Monday and returns Wednesday
expecting exact progress preservation, which a "daily" plan doesn't
model.

**Decision:** `TargetList`/`TargetListItem` (see `DATA_MODEL.md`
Phase 2 Additions) replace `DailyPlan`/`DailyPlanItem` as the primary
workspace object. `AccountScore` and `Recommendation` are retained and
now feed a Target List's "Suggested Calls" ordering. `daily_plan`/
`daily_plan_item` are dropped from the schema in migration
`0002_core_product.sql` — they were designed but never implemented
against a live database, so this is a clean removal, not a data
migration.

**Consequences:** One fewer redundant workspace concept. Any future
"what should I work today across all my lists" cross-list view (not
built in Phase 2) can be a computed query over `TargetListItem`, not a
new persisted entity.

---

## ADR-0007: Platform-admin is a flag on `app_users`, not a Membership role

**Status:** Accepted

**Context:** The Founder Operations Console (`FOUNDER_OPERATIONS.md`)
needs cross-organization visibility for a solo founder operating every
customer alone. The existing `Membership.role` enum
(OWNER/ADMIN/MANAGER/REP) is org-scoped by design — adding a "super
admin" value to that enum would make cross-tenant access look like an
ordinary org role, which is exactly the kind of authorization
confusion `SECURITY.md` warns against.

**Decision:** Add `app_users.platform_admin` (boolean), checked
separately from and in addition to normal org-scoped authorization.
Every console read is audit-logged. No UI ever grants this flag to
itself — it's set directly in the database by the founder, not through
an app-level "make me admin" flow.

**Consequences:** One more manual step to grant founder-level access
(acceptable — this should never be self-service). Keeps the security
model's core invariant intact: an org role can never imply access to
another org's data.

---

## ADR-0008: Phase 3 research engine extends existing entities — no parallel Claim/Identity/SourceQuality/ResearchState tables

**Status:** Accepted

**Context:** The Phase 3 brief explicitly warns against rebuilding
architecture that already works, and separately floats several new
entity concepts (a normalized "Claim" model, per-person "employment
confidence" tracking, a source-quality entity, a rich account research
state machine) while itself cautioning "do not over-engineer if
[X] already solves this cleanly." Before writing migration
`0003_research_engine.sql`, each proposed new entity was checked
against what Phase 1/2 already built.

**Decision, entity by entity:**

- **No new "Claim" table.** `KnowledgeItem` (subject=`account_id`/
  `contact_id`, predicate=`type`, value=`content`/`structured_value`,
  provenance=`source_id`/`source_reference`, temporal=`valid_from`/
  `valid_until`/`observed_at`, trust=`certainty_type`/
  `verification_status`/`supersedes`) and `ResearchFinding`
  (`retrieved_at`/`relevant_date`/`confidence`/`certainty_type`) already
  cover every field the spec's proposed Claim model asks for. Adding a
  third table that represents the same thing differently would create
  exactly the "parallel system solving the same problem" the Phase 3
  brief prohibits.
- **No new "EntityIdentity" table.** Extends `accounts` with
  `identity_status` and `identity_confirmed_at`/
  `identity_confirmed_by_membership_id` instead. The review queue for
  uncertain matches already exists (`account_match_candidates`,
  ADR-0005) — Phase 3 only needed a place to record *confirmed*
  identity, which is a small column addition, not a new entity.
- **No new "PersonProfile" table.** `contacts` +
  `account_contact_relationships` already model role/certainty/
  `valid_from`/`valid_until` — which already handles the "CFO changed
  from John Smith to Sarah Lee" conflict pattern the brief describes
  (two relationship rows, old one closed via `valid_until`, per Phase 2
  design). Extended `contacts` with `last_verified_at` only.
- **No new "AccountResearchState" table.** Adds `accounts
  .research_status` — a coarser, user-facing enum (`queued | identifying
  | researching | processing | ready | limited_data | needs_review |
  failed | refreshing`) derived from and distinct from
  `research_runs.status` (which stays as the simple internal job state:
  `queued | running | completed | failed`). One column, not a new
  table, and it deliberately does not duplicate `research_runs`.
- **No new "SourceQuality" table.** Extends `sources` with
  `source_tier` (1-5, per the brief's tier hierarchy), `publisher_domain`,
  `title`, `extraction_status`, and `content_hash` (for
  deduplication) — all properties *of* a source, added as columns on
  the table that already represents a source.
- **`research_runs` extended, not replaced**: adds `target_list_id`,
  `requested_focus`, `cache_used` columns and widens the `trigger_type`
  check constraint (`initial_import | user_request | target_list_refresh
  | stale_data | crm_update | person_correction | admin_retry`,
  replacing the narrower Phase 2 set) — same table, richer job
  metadata.

**Consequences:** Every Phase 3 concept maps onto an extension of an
existing table rather than a new one. The tradeoff is that
`accounts.research_status` and `research_runs.status` are two related
but distinct state fields living on different tables — worth the small
duplication-of-concept cost to avoid overloading `research_runs` (an
internal job log) with what needs to be a simple, stable, user-facing
enum.

---

## Deferred (not yet decided — see ROADMAP.md)

`AccountScore` weighting formula; pricing/plan tiers; data retention
period specifics; first Phase-4 `ResearchProvider` vendor choice.
