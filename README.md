# Scout (working name)

Sales intelligence layer for small/midsize B2B sales organizations —
turns fragmented CRM notes, spreadsheets, and rep knowledge into a
prioritized, explainable daily prospecting plan. See
[`docs/PRODUCT_CONSTITUTION.md`](./docs/PRODUCT_CONSTITUTION.md) for
the full mission, customer, and philosophy.

**Status: Phase 0 — architecture + foundation scaffold. No product
features are built yet.** See
[`docs/ARCHITECTURE_READINESS_REPORT.md`](./docs/ARCHITECTURE_READINESS_REPORT.md).

## Start here

- [`docs/PRODUCT_CONSTITUTION.md`](./docs/PRODUCT_CONSTITUTION.md) — mission, customer, council, non-goals
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — system layers and stack decisions
- [`docs/DATA_MODEL.md`](./docs/DATA_MODEL.md) — entities, relationships, Mermaid ERD
- [`docs/RESEARCH_ARCHITECTURE.md`](./docs/RESEARCH_ARCHITECTURE.md) — research pipeline + provider interfaces
- [`docs/AI_ARCHITECTURE.md`](./docs/AI_ARCHITECTURE.md) — AI provider abstraction + trust rules
- [`docs/SECURITY.md`](./docs/SECURITY.md) — multi-tenancy, RLS, auth/authz
- [`docs/INTEGRATIONS.md`](./docs/INTEGRATIONS.md) — adapter contracts
- [`docs/COST_MODEL.md`](./docs/COST_MODEL.md) — usage/cost instrumentation
- [`docs/JOBS_ARCHITECTURE.md`](./docs/JOBS_ARCHITECTURE.md) — background job design
- [`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md) — marketing-site design tokens (colors, type, radius), wired into `src/app/globals.css`
- [`docs/COUNCIL_REVIEW.md`](./docs/COUNCIL_REVIEW.md) — Five-Person Council architecture review
- [`docs/DECISIONS.md`](./docs/DECISIONS.md) — Architecture Decision Records
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — phases + explicit non-goals

## Repo structure

```
src/
  app/            Next.js App Router — presentation layer
  components/     Shared UI primitives
  features/       Feature-level UI composition
  domain/         Business logic (Sales Profile, Account Brain, scoring, ...)
  services/       Provider interfaces (CRM, enrichment, research, import)
  integrations/   Concrete vendor adapters implementing services/ interfaces
  ai/             AIProvider abstraction, workload-keyed model config
  db/             Supabase client construction (centralized — nowhere else)
  auth/           Auth context resolution, centralized permissions matrix
  jobs/           JobQueue interface
  lib/            Env validation, branding config
  types/          Shared types (tenancy, evidence)
trigger/          Phase 0 JobQueue implementation stub (Trigger.dev)
supabase/         Migrations
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

No authentication flow, no application UI beyond a placeholder page,
no CRM/enrichment integrations, no research pipeline implementation,
no billing. This is Phase 0 foundation only — see `docs/ROADMAP.md`
for the real build order. Do not skip ahead to later phases.
