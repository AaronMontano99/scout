# Architecture Readiness Report

Date: 2026-08-08

## ARCHITECTURE STATUS

**READY WITH RISKS**

The system design — data model, tenancy/security model, provider
abstractions, research pipeline, job architecture, and cost
instrumentation — is coherent, internally consistent, and grounded in
the product's actual constraints (solo founder, real confidential
customer data, unproven unit economics). It is not fully de-risked,
because the biggest open questions are empirical (does the product
work for real reps, is real customer data rich enough) and can't be
resolved by more architecture — they need Phase 1-3 built and shown to
real prospects. See Council Review for the specific risks this status
carries forward rather than hides.

## CORE DECISIONS

- Modular monolith on Next.js/TypeScript/Postgres via Supabase
  (ADR-0001, ADR-0002), with auth wrapped for portability.
- Background jobs behind an internal `JobQueue` interface, Trigger.dev
  as the Phase 0 implementation (ADR-0003).
- Dual-layer authorization: application-level org-scoping *and*
  Postgres RLS, not either alone (ADR-0004).
- Institutional memory as a first-class `KnowledgeItem` model with
  provenance, certainty tiers (KNOWN/INFERRED/SUGGESTED), and
  supersession — never destructive overwrites (`DATA_MODEL.md`).
- Entity resolution auto-merges only at full deterministic confidence;
  everything else goes to human review (ADR-0005).
- AI fully abstracted behind `AIProvider`, keyed by workload not
  vendor, with mandatory schema validation on structured output and a
  hard rule that AI output never writes a `KNOWN`-certainty record
  (`AI_ARCHITECTURE.md`).
- Every score and recommendation is evidence-linked and decomposable —
  no unexplained AI scores (`DATA_MODEL.md`, `AI_ARCHITECTURE.md`).
- Cost/usage instrumentation (`UsageRecord`) is architected in from the
  first research job, not added after a cost surprise (`COST_MODEL.md`).
- CSV/XLSX is V1's only integration, built as a real `ImportProvider`
  adapter — proving the pattern before CRM/enrichment integrations are
  attempted (Phase 7, not before).

## RISKS (carried forward deliberately, not resolved by more design work)

1. **Product risk** — unproven that the Daily Plan/Account Brain beat
   a rep's existing habits on first use. Needs real usage, not more
   architecture.
2. **Technical risk** — institutional-memory correctness under real,
   messy customer CRM exports is designed-for but untested at scale.
3. **Financial risk** — per-account research/AI cost is an estimate;
   pricing decided before real cost data risks an unprofitable floor.
4. **Customer-adoption risk** — time-to-value in onboarding (Sales
   Profile → import → first Daily Plan) is a Phase 2/3 build; if it's
   slow, the target customer (time-poor, skeptical) won't return.
5. **Dangerous assumption** — that typical target-customer historical
   data is rich enough for institutional memory to be the differentiator,
   rather than the Research Engine having to carry most of the value
   (which changes the cost picture significantly). See
   `COUNCIL_REVIEW.md` for full detail on all five.

## DEFERRED DECISIONS (explicitly not blocking Phase 0 exit)

`AccountScore` weighting formula, pricing tiers and usage limits, data
retention policy specifics, territory hierarchy depth beyond one
level, SalesProfile versioning approach, first real `ResearchProvider`
vendor choice, review-queue UX for entity resolution (assigned to
Phase 2 per Council). Full list: `ROADMAP.md`.

## COUNCIL VERDICT

**PROCEED**, with two binding conditions carried into implementation
(not left as suggestions):

1. Supabase auth/RLS portability mitigations from ADR-0002 are
   required, not optional cleanup.
2. Entity-resolution review-queue UX is explicit Phase 2 scope (CFO's
   condition in `COUNCIL_REVIEW.md`), not deferred to Phase 4.

The council did not reach unanimous comfort on V1's exact territory/
visibility scope — resolved as: build the permission-system *shape*
for it now, defer full enforcement, per `SECURITY.md`. This is
recorded as an intentional middle ground, not a unanimous decision.

## V1 IMPLEMENTATION ORDER

Per `ROADMAP.md`, unchanged by this review: **Phase 0 (this work) →
Phase 1 (SaaS shell: auth, orgs, memberships, roles, app/marketing
shell) → Phase 2 (Sales Profile + CSV/XLSX import, with real
entity-resolution review UX per the Council condition above) → Phase 3
(Account Brain: knowledge timeline, KNOWN/INFERRED/SUGGESTED surfaced)
→ Phase 4 (Research Engine: real background jobs, one real
ResearchProvider) → Phase 5 (Scoring + Daily Plan) → Phase 6 (Team +
Stripe billing) → Phase 7 (CRM/enrichment integrations)**. Do not skip
ahead to Phase 7.

## Phase 0 exit scaffold (this session)

Given READY WITH RISKS status, proceeding to scaffold the foundational
Phase 0 structure only: Next.js/TypeScript project, Tailwind, Supabase
client structure, migration scaffolding for the core tenancy tables,
auth structure, provider interface stubs, job-queue interface stub,
env example, lint/format config, and a testing foundation. No product
pages, no Daily Plan UI, no research pipeline implementation — that's
Phase 1+.
