# System Architecture

Companion docs: `DATA_MODEL.md`, `RESEARCH_ARCHITECTURE.md`,
`AI_ARCHITECTURE.md`, `SECURITY.md`, `INTEGRATIONS.md`,
`COST_MODEL.md`. This document is the map; the others are the detail.

## Guiding constraint

Solo founder. Optimize for speed of development, low operational
complexity, maintainability, testability, provider independence, and
the *option* to extract services later — not for looking like a
100-engineer company's architecture today. See §12 challenge below for
where the source prompt's suggested stack was accepted vs. pushed back
on.

## Pattern: modular monolith

One deployable Next.js application. Internal module boundaries
(`domain`, `services`, `integrations`, `ai`, `jobs`) are enforced by
directory structure and import discipline, not network boundaries.
Nothing here should require a service mesh, an internal RPC layer, or
inter-service auth. If a specific module (most likely: research/
enrichment processing) later needs independent scaling, its clean
interface boundary is what makes extraction possible without a
rewrite — that's the payoff of doing this now instead of skipping
straight to "just import it directly wherever."

## The six layers

```
Layer 1 — Presentation
  Marketing site, application UI, onboarding, account views, Daily
  Plan, admin/settings. Next.js App Router + React + TypeScript,
  Tailwind + shadcn/ui-style composable primitives.

Layer 2 — Application / API
  Auth, authorization, Organizations, Accounts, Contacts, Imports,
  Research, Scoring, Daily Plans, Integrations, Billing. Route
  handlers / server actions. Thin — validates input, calls domain
  services, returns output. No business logic lives here.

Layer 3 — Domain
  Sales Profile, Account Brain, Institutional Memory, People
  Intelligence, Research Findings, Signals, Account Scores,
  Recommendations. Pure(ish) business logic, framework-agnostic where
  practical, unit-testable without spinning up Next.js or a DB.

Layer 4 — Intelligence
  Extraction, entity resolution, classification, evidence evaluation,
  reasoning, summarization, scoring assistance, knowledge retrieval.
  Consumes the AIProvider abstraction (AI_ARCHITECTURE.md) — never
  imports a specific model SDK directly from domain code.

Layer 5 — Integration Adapters
  CSV/XLSX, CRMProvider, EnrichmentProvider, WebResearchProvider,
  SocialProvider, LLMProvider. Every external vendor sits behind an
  interface defined in Layer 3/4's terms, not the vendor's terms — see
  INTEGRATIONS.md.

Layer 6 — Data
  PostgreSQL (via Supabase), object storage, vector embeddings (pgvector),
  audit records, job state.
```

Dependency direction: 1 → 2 → 3 → (4, 5) → 6. Layer 3 (domain) must
never import Layer 1 (presentation) or a specific Layer 5 vendor SDK.
Layer 4 (intelligence) is consumed by Layer 3, not the reverse.

## Stack decisions

| Concern | Choice | Why |
|---|---|---|
| App framework | Next.js App Router, React, TypeScript | Single deployable, server + client in one codebase, fits solo-founder velocity constraint |
| UI | Tailwind + shadcn/ui-style primitives | Composable, accessible, no bespoke component framework to maintain |
| Database | PostgreSQL via Supabase | Relational integrity for a genuinely relational domain (see DATA_MODEL.md — this is not a document-shaped problem); Supabase bundles auth/storage/RLS without hand-rolling infra as a solo founder |
| Auth | Supabase Auth | Avoids hand-rolled session/credential handling; swappable behind an interface if outgrown |
| Authorization | App-level RBAC + Postgres RLS, org-scoped | Defense in depth — see SECURITY.md |
| Storage | Supabase Storage | CSV/XLSX uploads, future documents; same platform as DB/auth reduces integration surface |
| Vector search | pgvector | Semantic retrieval as an *aid*, not the source of truth — see DATA_MODEL.md §Embeddings |
| Background jobs | Trigger.dev (or equivalent durable job runner) | Research/enrichment/import processing must survive past an HTTP request lifetime; needs retries, observability, scheduling |
| Billing | Stripe (architected for, not fully wired in Phase 0) | Standard, avoids PCI scope, well-documented subscription primitives |
| AI | Provider-abstracted (`AIProvider`) | Model/vendor churn is a certainty over a company's lifetime — see AI_ARCHITECTURE.md |

## Where the source brief's stack recommendation was interrogated, not just accepted

The council (see `docs/COUNCIL_REVIEW.md`) specifically challenged two
defaults rather than rubber-stamping them:

1. **Supabase as both DB and Auth provider** creates a real vendor
   dependency at the platform level, not just the library level —
   migrating off Supabase later means migrating auth *and* data
   simultaneously. Accepted anyway: for a solo founder pre-revenue,
   the velocity gain outweighs the lock-in risk, provided (a) auth
   logic is still wrapped in an internal interface so call sites don't
   directly depend on Supabase's SDK shape, and (b) RLS policies are
   written in portable SQL, not Supabase-proprietary constructs where
   avoidable. This is `ADR-0002` in `DECISIONS.md`.
2. **Trigger.dev specifically** is named in the brief but is one
   vendor among several viable durable-job runners (Inngest, Graphile
   Worker on the same Postgres instance, etc.). Decision: implement
   against a small internal `JobQueue` interface (enqueue, schedule,
   idempotency key, retry policy) so the specific runner is a Phase 0
   config choice, not something domain code calls directly. See
   `docs/JOBS_ARCHITECTURE.md`. This is `ADR-0003`.

## Naming / branding isolation

A single `src/lib/branding.ts` (or `branding.config.ts`) module holds
product name, domain, support email, and any user-facing string that
encodes "Scout." No other file references the literal string "Scout"
for anything user-facing. Database table/column names, route segments,
env var names, and service names use domain vocabulary (`accounts`,
`daily_plan`, `knowledge_items`) rather than the product name, so a
rebrand never touches schema or infrastructure.

## What this architecture explicitly refuses to do (see PRODUCT_CONSTITUTION.md, ROADMAP.md)

No microservice split at launch. No LinkedIn scraping dependency. No
treating embeddings as authoritative storage. No AI call path that
lacks a cost/usage counter. No tenant-crossing query path. No feature
that requires enterprise infra before there's a single paying
customer.
