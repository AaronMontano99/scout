# Data Model

PostgreSQL is authoritative. Embeddings (pgvector) support retrieval;
they are never the source of truth for a fact — see
`AI_ARCHITECTURE.md`. Every tenant-owned table carries `organization_id`
directly (never only through a multi-hop join) so row-level security
policies stay simple and auditable — see `SECURITY.md`.

## ERD

```mermaid
erDiagram
    ORGANIZATION ||--o{ MEMBERSHIP : has
    ORGANIZATION ||--o{ TERRITORY : has
    ORGANIZATION ||--|| SALES_PROFILE : has
    ORGANIZATION ||--o{ ACCOUNT : owns
    ORGANIZATION ||--o{ CONTACT : owns
    ORGANIZATION ||--o{ IMPORT : owns
    ORGANIZATION ||--o{ INTEGRATION : owns
    ORGANIZATION ||--o{ KNOWLEDGE_ITEM : owns
    ORGANIZATION ||--o{ SOURCE : owns
    ORGANIZATION ||--o{ RESEARCH_RUN : owns
    ORGANIZATION ||--o{ DAILY_PLAN : owns
    ORGANIZATION ||--o{ USAGE_RECORD : owns
    ORGANIZATION ||--o{ AUDIT_LOG : owns
    ORGANIZATION ||--|| SUBSCRIPTION : has

    USER ||--o{ MEMBERSHIP : has

    MEMBERSHIP }o--o{ TERRITORY : "assigned to"
    MEMBERSHIP ||--o{ DAILY_PLAN : "generated for"
    MEMBERSHIP ||--o{ ACCOUNT : "owns (rep)"
    MEMBERSHIP ||--o{ INTERACTION : logs
    MEMBERSHIP ||--o{ IMPORT : uploads
    MEMBERSHIP ||--o{ INTEGRATION : connects

    TERRITORY ||--o{ ACCOUNT : contains

    ACCOUNT ||--o{ ACCOUNT_CONTACT_RELATIONSHIP : has
    ACCOUNT ||--o{ INTERACTION : has
    ACCOUNT ||--o{ KNOWLEDGE_ITEM : has
    ACCOUNT ||--o{ RESEARCH_FINDING : has
    ACCOUNT ||--o{ SIGNAL : has
    ACCOUNT ||--o{ ACCOUNT_SCORE : has
    ACCOUNT ||--o{ DAILY_PLAN_ITEM : "appears in"
    ACCOUNT ||--o{ RECOMMENDATION : has
    ACCOUNT ||--o{ ACCOUNT_MATCH_CANDIDATE : "resolved from"
    ACCOUNT ||--o{ OUTCOME : has

    CONTACT ||--o{ ACCOUNT_CONTACT_RELATIONSHIP : has
    CONTACT ||--o{ INTERACTION : "participates in"
    CONTACT ||--o{ KNOWLEDGE_ITEM : "subject of"
    CONTACT ||--o{ RECOMMENDATION : "subject of"

    KNOWLEDGE_ITEM }o--|| SOURCE : "sourced from"
    KNOWLEDGE_ITEM ||--o{ KNOWLEDGE_ITEM : supersedes
    KNOWLEDGE_ITEM ||--o{ ACCOUNT_CONTACT_RELATIONSHIP : evidences

    RESEARCH_RUN ||--o{ RESEARCH_FINDING : produces
    RESEARCH_FINDING }o--|| SOURCE : "sourced from"
    RESEARCH_FINDING ||--o{ SIGNAL : "may produce"
    RESEARCH_FINDING ||--o{ KNOWLEDGE_ITEM : "may become"

    ACCOUNT_SCORE ||--o{ ACCOUNT_SCORE_COMPONENT : "decomposes into"

    DAILY_PLAN ||--o{ DAILY_PLAN_ITEM : contains
    DAILY_PLAN_ITEM }o--|| ACCOUNT_SCORE : "ranked by"
    DAILY_PLAN_ITEM }o--o| RECOMMENDATION : explains
    DAILY_PLAN_ITEM ||--o{ OUTCOME : "results in"

    IMPORT ||--o{ IMPORT_ROW : contains
    IMPORT_ROW }o--o| ACCOUNT : "resolves to"
    IMPORT_ROW }o--o| ACCOUNT_MATCH_CANDIDATE : "if ambiguous"

    INTEGRATION ||--o{ RESEARCH_RUN : triggers
    INTEGRATION ||--o{ USAGE_RECORD : generates

    SUBSCRIPTION ||--o{ USAGE_RECORD : meters
```

## Entities

### Organization
The tenant boundary. `id, name, slug, industry, created_at, updated_at,
deleted_at`. Everything else hangs off this, directly or transitively.

### User / Membership
`User` maps 1:1 to a Supabase Auth identity (`auth_user_id`) plus
profile fields (`email, full_name`). `Membership` is the join between
`User` and `Organization`, carrying `role` (`OWNER | ADMIN | MANAGER |
REP`), optional territory assignment, `status` (active/invited/
removed), `created_at`. **A user's authorization is always resolved
through Membership, never through User directly** — see `SECURITY.md`.

### Territory
Optional grouping (`id, organization_id, name, description`) used for
manager-visibility scoping. V1 keeps this simple — a Membership can be
associated with zero or more Territories; an Account belongs to at most
one. Do not over-build hierarchical territory trees in V1.

### SalesProfile
Effectively one row per Organization (versioned via `updated_at` +
history in `AuditLog`, not a separate version table in V1):
`what_we_sell, value_props, icp JSONB, deal_size_min, deal_size_max,
sales_cycle_days, common_buyer_titles JSONB, common_influencer_titles
JSONB, common_champion_titles JSONB, common_objections JSONB,
disqualifiers JSONB, strategic_priorities JSONB`. This is read by
scoring (`AccountScoreComponent` "ICP Fit") and by research
(`RESEARCH_ARCHITECTURE.md`) to decide what evidence matters.

### Account
`id, organization_id, name, normalized_name, primary_domain, industry,
employee_count_range, address JSONB, territory_id, owner_membership_id,
status (active/inactive/merged), merged_into_account_id, created_at,
updated_at`. `normalized_name`/`primary_domain` are the deterministic
half of entity resolution (see below).

### AccountMatchCandidate
Entity-resolution review queue. `id, organization_id, raw_name,
raw_domain, raw_source (import_row/enrichment/crm), candidate_account_id,
match_confidence, match_method (deterministic_domain/normalized_name/
fuzzy/ai_assisted), status (PENDING | CONFIRMED | REJECTED |
AUTO_MERGED), reviewed_by_membership_id, reviewed_at, created_at`. See
"Entity Resolution" below — ambiguous matches never silently merge.

### Contact
`id, organization_id, account_id, first_name, last_name, title, email,
phone, linkedin_url (reference only, never scraped — see
INTEGRATIONS.md), status (active/departed/unknown), created_at,
updated_at`.

### AccountContactRelationship
This is where role hypotheses live, deliberately separated from the
raw `Contact` record because a contact's *role in the buying
committee* is knowledge with provenance, not a fixed attribute: `id,
account_id, contact_id, role_hypothesis (decision_maker/influencer/
champion/blocker/unknown), certainty_type (KNOWN | INFERRED |
SUGGESTED), is_current, valid_from, valid_until, source_knowledge_item_id,
created_at`. Multiple rows can exist for the same account+contact over
time — old hypotheses aren't deleted when superseded, they're closed
out via `valid_until` and a new row references the old one implicitly
through time overlap.

### Interaction
Logged sales activity: `id, organization_id, account_id, contact_id,
membership_id, type (call/email/meeting/note), occurred_at, summary,
source (manual/import/crm_sync), external_ref, created_at`. Interactions
are a specific, narrower thing than `KnowledgeItem` — an Interaction is
"this event happened"; a `KnowledgeItem` derived from it ("Sarah
handles purchasing") is a fact extracted from it. Not every Interaction
produces a KnowledgeItem, and not every KnowledgeItem originates from
an Interaction (many come from research or import).

### KnowledgeItem — the institutional-memory core

This is the entity the whole product depends on getting right; see
`PRODUCT_CONSTITUTION.md` on why a single `account.notes` text field
was rejected. Fields:

```
id, organization_id, account_id, contact_id (nullable),
type (note/call_note/crm_activity/meeting_observation/
  decision_maker/contract_timing/incumbent_vendor/relationship/
  objection/historical_event/research_finding/announcement/
  inferred_observation),
content (text),
structured_value (JSONB, nullable — e.g. {"incumbent_vendor": "Ricoh"}),
origin (user_entered/imported/crm_synced/research_derived/ai_inferred),
source_id (FK -> Source),
source_reference (e.g. CRM record id),
source_url (nullable),
created_by (FK -> Membership, nullable if machine-originated),
observed_at (when the fact was true/noted in the real world),
imported_at (when it entered Scout, if different from observed_at),
valid_from, valid_until (nullable — open-ended if still believed current),
confidence (numeric 0-1),
certainty_type (KNOWN | INFERRED | SUGGESTED),
verification_status (CURRENT | STALE | SUPERSEDED | CONFLICTING | UNVERIFIED),
supersedes (FK -> KnowledgeItem, nullable),
created_at, updated_at
```

**Non-negotiable rule**: no code path deletes a KnowledgeItem to
"clean up" conflicting or outdated information. A new, more current
item gets created with `supersedes` pointing at the old one, and the
old item's `verification_status` moves to `SUPERSEDED` — it stays
queryable for history/explainability (see §23 of the source brief:
"Scout should not simply delete the 2019 note"). `CONFLICTING` status
is used when two *current* items disagree and neither clearly
supersedes the other — the product surfaces the conflict rather than
picking a winner algorithmically.

### Source
`id, organization_id, type (user/import/crm/enrichment/web/
ai_inference), name, url (nullable), reliability_weight (numeric,
used in scoring), created_at`. Every `KnowledgeItem` and
`ResearchFinding` references a `Source` — this is what makes "why is
Scout telling me this" answerable (see `AI_ARCHITECTURE.md`
§Explainability).

### Import / ImportRow
`Import`: `id, organization_id, membership_id, file_name, file_type
(csv/xlsx), status (uploaded/mapping/processing/completed/failed),
column_mapping (JSONB), row_count, error_count, created_at,
completed_at`. `ImportRow`: `id, import_id, row_number, raw_data
(JSONB), resolution_status (matched/ambiguous/new/error),
matched_account_id (nullable), match_candidate_id (nullable FK ->
AccountMatchCandidate), error (nullable), created_at`. Row-level
granularity means a bad row never blocks the rest of an import, and
gives the entity-resolution review queue something concrete to point
at.

### Integration
`id, organization_id, provider_type (crm/enrichment/research),
provider_name, status (connected/disconnected/error), credentials_ref
(reference into a secrets store — never the raw credential in this
table, see `SECURITY.md`), connected_by_membership_id, connected_at,
last_synced_at, config (JSONB)`.

### ResearchRun / ResearchFinding / Signal
`ResearchRun`: `id, organization_id, account_id, trigger_type
(manual/scheduled/import_triggered), status (queued/running/completed/
failed), started_at, completed_at, cost_cents, provider_calls (JSONB
log of which providers were hit)`. `ResearchFinding`: `id,
organization_id, account_id, research_run_id, source_id, finding_type,
content, structured_value (JSONB), url, retrieved_at, relevant_date
(nullable — the date the underlying event happened, vs. retrieved_at
which is when Scout found it), confidence, certainty_type, created_at`.
`Signal`: `id, organization_id, account_id, signal_type (expansion/
leadership_change/funding/hiring/tech_change/filing/other),
detected_at, strength (numeric), research_finding_id, created_at`. A
`Signal` is a `ResearchFinding` that's been classified as
prioritization-relevant — not every finding is a signal.

### AccountScore / AccountScoreComponent
`AccountScore`: `id, organization_id, account_id, total_score,
computed_at, model_version, explanation_summary`. `AccountScoreComponent`:
`id, account_score_id, component_type (icp_fit/timing/relationship/
signal_strength/historical_context/data_confidence/strategic_priority),
points, max_points, evidence_refs (JSONB array of KnowledgeItem/
ResearchFinding/Signal ids)`. The exact scoring formula is deferred
(see `ROADMAP.md`/`DECISIONS.md`) — what's architecturally fixed is
that a score is never stored without its components, and components
always carry evidence references back to real rows, not free text.

### DailyPlan / DailyPlanItem / Recommendation / Outcome
`DailyPlan`: `id, organization_id, membership_id, plan_date, status
(generating/ready/stale), generated_at`. `DailyPlanItem`: `id,
daily_plan_id, account_id, rank, tier (call_first/worth_contacting/
nurture/low_priority), account_score_id, recommendation_id`.
`Recommendation`: `id, organization_id, account_id, contact_id
(nullable), headline, reasoning (text), evidence_refs (JSONB),
confidence, generated_at, model_version`. `Outcome`: `id,
organization_id, daily_plan_item_id (nullable), account_id,
membership_id, outcome_type (contacted/meeting_booked/no_response/
skipped/deferred), occurred_at, notes`. `Outcome` closes the loop —
it's what eventually lets scoring get evaluated against reality
instead of staying a static formula forever (explicitly deferred past
V1, but the table exists from day one so history isn't lost waiting
for that feature).

### UsageRecord / Subscription
`UsageRecord`: `id, organization_id, usage_type (research_run/ai_call/
enrichment_credit/storage_mb/job_execution), quantity, unit_cost_cents,
occurred_at, related_id (polymorphic reference)`. `Subscription`: `id,
organization_id, stripe_customer_id, stripe_subscription_id, plan,
status, seats, current_period_end`. See `COST_MODEL.md`.

### AuditLog
`id, organization_id, actor_membership_id (nullable — system actions
have none), action, target_type, target_id, metadata (JSONB),
created_at`. Append-only, never updated or deleted by application
code.

## Entity resolution

Imports and enrichment will produce near-duplicate company references
("ABC Inc." / "ABC Incorporated" / "abc.com"). Resolution order:

1. **Deterministic domain match** — normalized primary domain equality.
   Highest confidence, auto-applied.
2. **Normalized-name match** (case/punctuation/legal-suffix-insensitive)
   combined with a secondary signal (address, CRM ID, enrichment ID) —
   auto-applied only when at least two signals agree.
3. **Fuzzy match** (name similarity alone, or a single weak signal) —
   never auto-applied. Creates an `AccountMatchCandidate` row in
   `PENDING` status for human review.
4. **AI-assisted match** (LLM judges likely-same-entity from combined
   context) — same rule as fuzzy: assists ranking of candidates shown
   to a human, never auto-merges on its own.

**No silent merges below full deterministic confidence.** A wrong
auto-merge corrupts institutional memory in a way that's hard to
detect later — this is a case where the CTO/security council role
overruled a "just use AI to match everything" shortcut (see
`docs/COUNCIL_REVIEW.md`).

## Embeddings

`pgvector` stores embeddings for `KnowledgeItem` and `ResearchFinding`
content, keyed back to the source row's primary key. Embeddings exist
to power semantic retrieval (e.g. "find everything Scout knows that's
relevant to this account's timing") — they are a derived index, never
queried as ground truth, and are fully rebuildable from the relational
data at any time. If the vector index is lost, nothing about the
business is lost — that's the test for whether something belongs in
pgvector vs. Postgres proper.

## What's deferred, on purpose

Territory hierarchies beyond one level, SalesProfile versioning as a
first-class history table (relying on `AuditLog` for now), a formal
scoring-weight-tuning system, self-serve entity-resolution rule
authoring. See `ROADMAP.md` and `DECISIONS.md`.
