# Scout (working name)

Sales intelligence layer for small/midsize B2B sales organizations —
turns fragmented CRM notes, spreadsheets, and rep knowledge into a
prioritized, explainable prospecting workspace. See
[`docs/PRODUCT_CONSTITUTION.md`](./docs/PRODUCT_CONSTITUTION.md) for
the full mission, customer, and philosophy.

**Status: Phase 4 — UI/UX, website, integration, READY WITH RISKS
(explicitly not READY — see below).** All five signature experiences
(Target List workspace, Call-Ready Brief + Account Brain, Post-Call
workflow, Prospecting Analytics, and now a real marketing homepage) are
polished, tested, and working against Demo Mode's fictional dataset —
plus a real component library, a CSS-3D hero product composite, and
fixture data deliberately stress-tested for messy edge cases (10
sources, 6 stakeholders, null fields, zero data, a failed research
run). **Phase 3.5 (live-intelligence validation against real
providers) was never done — see
[`docs/PHASE_3_5_STATUS.md`](./docs/PHASE_3_5_STATUS.md).** Every
Call-Ready Brief in this product is still hand-written demo content,
not live research — this is why Phase 4's own completion report
declines to call the product "READY" outright, per that report's own
rule. See
[`docs/PHASE_4_COMPLETION_REPORT.md`](./docs/PHASE_4_COMPLETION_REPORT.md)
for the full honest breakdown, and
[`docs/COUNCIL_REVIEW_PHASE4.md`](./docs/COUNCIL_REVIEW_PHASE4.md) for
the Five-Person Council's critical review of the actual built UI.
(Earlier phases: [`PHASE_3_COMPLETION_REPORT.md`](./docs/PHASE_3_COMPLETION_REPORT.md) ·
[`PHASE_2_COMPLETION_REPORT.md`](./docs/PHASE_2_COMPLETION_REPORT.md).)

## Try it

```
npm install && npm run dev
```

Open `/` for the marketing homepage, or `/demo` directly for the
product — no auth, no setup, entirely fictional data. See
[`docs/DEMO.md`](./docs/DEMO.md).

## Start here

- [`docs/PRODUCT_CONSTITUTION.md`](./docs/PRODUCT_CONSTITUTION.md) — mission, customer, council, non-goals
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — system layers and stack decisions
- [`docs/DATA_MODEL.md`](./docs/DATA_MODEL.md) — entities, relationships, Mermaid ERD (Phase 1 + 2 + 3 Additions)
- [`DESIGN.md`](./DESIGN.md) — visual authority: marketing-site + in-app design system
- [`docs/PHASE_4_COMPLETION_REPORT.md`](./docs/PHASE_4_COMPLETION_REPORT.md) — what's actually built, right now
- [`docs/PHASE_3_5_STATUS.md`](./docs/PHASE_3_5_STATUS.md) — why the product isn't "READY" outright
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — phases + explicit non-goals
- [`docs/runbooks/`](./docs/runbooks/) — founder operations, written for a first-time SaaS operator

**UI/UX docs (Phase 4)**: [`ONBOARDING_UX.md`](./docs/ONBOARDING_UX.md) ·
[`CUSTOMER_ADMIN.md`](./docs/CUSTOMER_ADMIN.md)

**Research engine docs (Phase 3)**: [`RESEARCH_ENGINE.md`](./docs/RESEARCH_ENGINE.md) ·
[`ENTITY_RESOLUTION.md`](./docs/ENTITY_RESOLUTION.md) ·
[`SOURCE_MODEL.md`](./docs/SOURCE_MODEL.md) ·
[`RESEARCH_FRESHNESS.md`](./docs/RESEARCH_FRESHNESS.md) ·
[`PEOPLE_DISCOVERY.md`](./docs/PEOPLE_DISCOVERY.md) ·
[`EVIDENCE_MODEL.md`](./docs/EVIDENCE_MODEL.md) ·
[`CALL_READY_BRIEF.md`](./docs/CALL_READY_BRIEF.md) ·
[`RESEARCH_COSTS.md`](./docs/RESEARCH_COSTS.md) ·
[`RESEARCH_SECURITY.md`](./docs/RESEARCH_SECURITY.md) ·
[`RESEARCH_OPERATIONS.md`](./docs/RESEARCH_OPERATIONS.md) ·
[`AI_EVALUATIONS.md`](./docs/AI_EVALUATIONS.md)

**Product docs (Phase 2)**: [`TARGET_LISTS.md`](./docs/TARGET_LISTS.md) ·
[`ACCOUNT_BRAIN.md`](./docs/ACCOUNT_BRAIN.md) ·
[`PEOPLE_INTELLIGENCE.md`](./docs/PEOPLE_INTELLIGENCE.md) ·
[`SELLER_STYLE.md`](./docs/SELLER_STYLE.md) ·
[`POST_CALL_WORKFLOW.md`](./docs/POST_CALL_WORKFLOW.md) ·
[`CRM_WRITEBACK.md`](./docs/CRM_WRITEBACK.md) ·
[`PROSPECTING_ANALYTICS.md`](./docs/PROSPECTING_ANALYTICS.md) ·
[`RESEARCH_WORKSPACE.md`](./docs/RESEARCH_WORKSPACE.md) ·
[`CUSTOMER_IMPLEMENTATION.md`](./docs/CUSTOMER_IMPLEMENTATION.md) ·
[`PILOT.md`](./docs/PILOT.md) ·
[`FOUNDER_OPERATIONS.md`](./docs/FOUNDER_OPERATIONS.md) ·
[`WEBSITE.md`](./docs/WEBSITE.md) ·
[`PRODUCT_UX.md`](./docs/PRODUCT_UX.md) · [`DEMO.md`](./docs/DEMO.md)

**Architecture docs (Phase 1)**: [`RESEARCH_ARCHITECTURE.md`](./docs/RESEARCH_ARCHITECTURE.md) ·
[`AI_ARCHITECTURE.md`](./docs/AI_ARCHITECTURE.md) ·
[`SECURITY.md`](./docs/SECURITY.md) ·
[`INTEGRATIONS.md`](./docs/INTEGRATIONS.md) ·
[`COST_MODEL.md`](./docs/COST_MODEL.md) ·
[`JOBS_ARCHITECTURE.md`](./docs/JOBS_ARCHITECTURE.md) ·
[`DECISIONS.md`](./docs/DECISIONS.md) (ADRs, incl. Phase 3's ADR-0008) ·
[`COUNCIL_REVIEW.md`](./docs/COUNCIL_REVIEW.md) (Phase 1)

## Repo structure

```
src/
  app/            Next.js App Router — presentation layer
                    page.tsx  Marketing homepage (hero, story flow, CTA)
                    demo/     Demo Mode: Target Lists, Call-Ready Brief, Post-Call, Analytics
                    admin/    Founder Operations Console (unauthenticated stub — see FOUNDER_OPERATIONS.md)
  components/     Shared UI primitives
                    ui/       Button, Card, Input, Tabs, Skeleton, Drawer — DESIGN.md tokens as code
                    marketing/  Nav, hero product composite (CSS-3D, no engine dependency)
                    (badges, priority labels, stat tiles, states, funnel, filters — Scout-specific)
  demo/           Demo Mode fixture data + accessor layer, incl. stress-test fixtures (see DEMO.md)
  features/       Feature-level UI composition
  domain/         Business logic — target lists, analytics, entity resolution,
                    freshness, source quality, research security/status,
                    brief quality lint (all tested)
  services/       Provider interfaces (CRM incl. writeback, enrichment, research, import, billing)
  integrations/   Concrete vendor adapters implementing services/ interfaces
  ai/             AIProvider abstraction, workload-keyed model config
  db/             Supabase client construction (centralized — nowhere else)
  auth/           Auth context resolution, centralized permissions matrix
  jobs/           JobQueue interface
  lib/            Env validation, branding config
  types/          Shared types (tenancy, evidence, product)
trigger/          JobQueue implementation stub (Trigger.dev)
supabase/         Migrations (0001 tenancy, 0002 core product, 0003 research engine)
tests/            Vitest — highest-risk logic first (see ARCHITECTURE.md) — 108 tests, 10 files
```

## Environment

Requires **Node ≥22** (Supabase's client and several dev dependencies
require it). Full toolchain (typecheck, lint, build, test) is verified
green on Node 22.23.2. If your `node -v` shows 21.x or lower, `npm
install` will still mostly work but `npm test` will fail outright
(Vitest's bundler needs a Node-22-only `node:util` export) — upgrade
first. Copy `.env.example` to `.env.local` and fill in real values —
never commit `.env.local`. See `docs/SECURITY.md`.

**No live Supabase project, research provider, AI provider, CRM, or
Stripe account is connected yet** — see
`docs/PHASE_4_COMPLETION_REPORT.md`. `/` and `/demo` both work with
zero external dependencies.

## Commands

```
npm run dev         # local dev server
npm run build        # production build
npm run lint          # eslint
npm run typecheck     # tsc --noEmit
npm run test           # vitest
npm run format         # prettier --write
```

## What's NOT here yet

Real authentication, live research/AI provider connection, CRM
integrations, billing, the CSV/XLSX import UI, and a provisioned
database — see `docs/PHASE_4_COMPLETION_REPORT.md`'s Top 10 Next Tasks
for the actual next-step order. Do not skip ahead of
`docs/ROADMAP.md`'s phase order.
