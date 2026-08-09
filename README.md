# Scout (working name)

Sales intelligence layer for small/midsize B2B sales organizations —
turns fragmented CRM notes, spreadsheets, and rep knowledge into a
prioritized, explainable prospecting workspace. See
[`docs/PRODUCT_CONSTITUTION.md`](./docs/PRODUCT_CONSTITUTION.md) for
the full mission, customer, and philosophy.

**Status: Phase 2 — commercial product, READY WITH RISKS.** All four
signature experiences (Target List workspace, Call-Ready Brief +
Account Brain, Post-Call workflow, Prospecting Analytics) are real,
tested, and working — against Demo Mode's fictional dataset. No live
research provider, CRM, billing, or database is connected yet. See
[`docs/PHASE_2_COMPLETION_REPORT.md`](./docs/PHASE_2_COMPLETION_REPORT.md)
for the full honest breakdown of what's built vs. mocked vs. requires a
real API, and
[`docs/COUNCIL_REVIEW_PHASE2.md`](./docs/COUNCIL_REVIEW_PHASE2.md) for
the Five-Person Council's critical review of the actual product.

## Try it

```
npm install && npm run dev
```

Then open `/demo` — no auth, no setup, entirely fictional data. See
[`docs/DEMO.md`](./docs/DEMO.md).

## Start here

- [`docs/PRODUCT_CONSTITUTION.md`](./docs/PRODUCT_CONSTITUTION.md) — mission, customer, council, non-goals
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — system layers and stack decisions
- [`docs/DATA_MODEL.md`](./docs/DATA_MODEL.md) — entities, relationships, Mermaid ERD (Phase 1 + Phase 2 Additions)
- [`DESIGN.md`](./DESIGN.md) — visual authority: marketing-site + in-app design system
- [`docs/PHASE_2_COMPLETION_REPORT.md`](./docs/PHASE_2_COMPLETION_REPORT.md) — what's actually built, right now
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — phases + explicit non-goals
- [`docs/runbooks/`](./docs/runbooks/) — founder operations, written for a first-time SaaS operator

**Product docs**: [`TARGET_LISTS.md`](./docs/TARGET_LISTS.md) ·
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

**Architecture docs**: [`RESEARCH_ARCHITECTURE.md`](./docs/RESEARCH_ARCHITECTURE.md) ·
[`AI_ARCHITECTURE.md`](./docs/AI_ARCHITECTURE.md) ·
[`SECURITY.md`](./docs/SECURITY.md) ·
[`INTEGRATIONS.md`](./docs/INTEGRATIONS.md) ·
[`COST_MODEL.md`](./docs/COST_MODEL.md) ·
[`JOBS_ARCHITECTURE.md`](./docs/JOBS_ARCHITECTURE.md) ·
[`DECISIONS.md`](./docs/DECISIONS.md) (ADRs) ·
[`COUNCIL_REVIEW.md`](./docs/COUNCIL_REVIEW.md) (Phase 1)

## Repo structure

```
src/
  app/            Next.js App Router — presentation layer
                    demo/     Demo Mode: Target Lists, Call-Ready Brief, Post-Call
                    admin/    Founder Operations Console (unauthenticated stub — see FOUNDER_OPERATIONS.md)
  components/     Shared UI primitives (badges, priority labels, stat tiles, states)
  demo/           Demo Mode fixture data + accessor layer (see DEMO.md)
  features/       Feature-level UI composition
  domain/         Business logic — target lists, analytics, entity resolution (tested)
  services/       Provider interfaces (CRM incl. writeback, enrichment, research, import, billing)
  integrations/   Concrete vendor adapters implementing services/ interfaces
  ai/             AIProvider abstraction, workload-keyed model config
  db/             Supabase client construction (centralized — nowhere else)
  auth/           Auth context resolution, centralized permissions matrix
  jobs/           JobQueue interface
  lib/            Env validation, branding config
  types/          Shared types (tenancy, evidence, product)
trigger/          JobQueue implementation stub (Trigger.dev)
supabase/         Migrations (0001 tenancy, 0002 core product)
tests/            Vitest — highest-risk logic first (see ARCHITECTURE.md)
```

## Environment

Requires **Node ≥22** (Supabase's client and several dev dependencies
require it). Full toolchain (typecheck, lint, build, test) is verified
green on Node 22.23.2. If your `node -v` shows 21.x or lower, `npm
install` will still mostly work but `npm test` will fail outright
(Vitest's bundler needs a Node-22-only `node:util` export) — upgrade
first. Copy `.env.example` to `.env.local` and fill in real values —
never commit `.env.local`. See `docs/SECURITY.md`.

**No live Supabase project, research provider, CRM, or Stripe account
is connected yet** — see `docs/PHASE_2_COMPLETION_REPORT.md`'s
"Requires Real API" section. `/demo` works with zero external
dependencies.

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
integrations, billing, the import UI, and a provisioned database — see
`docs/PHASE_2_COMPLETION_REPORT.md`'s Top 10 Next Tasks for the actual
next-step order. Do not skip ahead of `docs/ROADMAP.md`'s phase order.
