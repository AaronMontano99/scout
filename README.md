# Scout (working name)

Sales intelligence layer for small/midsize B2B sales organizations —
turns fragmented CRM notes, spreadsheets, and rep knowledge into a
prioritized, explainable prospecting workspace. See
[`docs/PRODUCT_CONSTITUTION.md`](./docs/PRODUCT_CONSTITUTION.md) for
the full mission, customer, and philosophy.

**Status: Local Mode — runs entirely on your own machine.** No cloud
accounts, no signup, no services to run in the background. Your data
lives in a local SQLite file (`data/scout.db`), not a hosted database
— see [`docs/LOCAL_MODE.md`](./docs/LOCAL_MODE.md) for the full
architecture and why. `/app` is a full workstation — Today, Lists,
Accounts, People, Research, Imports, Analytics, and Settings — wired to
your own real accounts, contacts, and notes; `/demo` is the same shell
wired to fictional fixture data instead, safe to click through with
zero setup. The two never share data (see
[`docs/DEMO.md`](./docs/DEMO.md)).

You can get real accounts and contacts into Scout two ways: add them by
hand (`/app/accounts/new`), or import a CSV/XLSX spreadsheet
(`/app/imports`) — a real local parser with deterministic column
mapping, no AI required. Either path automatically runs real research
for each new account — the company's own public website plus public
news search (Google News RSS), free and keyless — and you can re-run
it any time from an account's "Refresh research" button (see
[`src/services/free-web-research-provider.ts`](./src/services/free-web-research-provider.ts)).
**This never touches LinkedIn or any other login-walled platform —
that's a permanent rule, not a missing feature**, matching
[`docs/PRODUCT_CONSTITUTION.md`](./docs/PRODUCT_CONSTITUTION.md) and
[`docs/INTEGRATIONS.md`](./docs/INTEGRATIONS.md).

There's also an optional local AI provider — [Ollama](https://ollama.com),
running entirely on your own machine (no API key, nothing leaves your
computer). If `ollama serve` is running with a model pulled (defaults
to `llama3.2`; see
[`src/ai/providers/ollama-provider.ts`](./src/ai/providers/ollama-provider.ts)),
Scout uses it for two things, both best-effort and both still honest
about certainty:

- **Call-Ready Brief summaries** — after Research fetches a company's
  website/news, Ollama turns that into a "What They Do" description
  and a few "What Matters" bullets, strictly grounded in the fetched
  text (instructed never to invent) and always tagged `SUGGESTED`.
- **Clean call notes** — after you log a call, Ollama rewrites your
  rough dictated note into a clean CRM-style note, keeping every fact
  and adding nothing.

Neither ever blocks the action that triggered it — both run in the
background and the UI just picks up the result once it's ready, since
local inference can take 10-30+ seconds. If Ollama isn't running,
these steps quietly do nothing and Scout works exactly as it does
without them; nothing else in Scout requires it. Settings shows
exactly which providers are Available, Not Configured, or Unavailable
— never a fake connection.
[`docs/PHASE_4_COMPLETION_REPORT.md`](./docs/PHASE_4_COMPLETION_REPORT.md)
and
[`docs/COUNCIL_REVIEW_PHASE4.md`](./docs/COUNCIL_REVIEW_PHASE4.md) are
historical — the UI/UX work they describe is unchanged, but their
Supabase/multi-tenancy framing predates Local Mode.
(Earlier phases: [`PHASE_3_COMPLETION_REPORT.md`](./docs/PHASE_3_COMPLETION_REPORT.md) ·
[`PHASE_2_COMPLETION_REPORT.md`](./docs/PHASE_2_COMPLETION_REPORT.md).)

## Try it

```
npm install && npm run dev
```

Then open **http://localhost:3000/app**. No `.env.local` required. Open
`/` for the marketing homepage, `/demo` for a product tour with
fictional data (see [`docs/DEMO.md`](./docs/DEMO.md)), or `/app` for
your own workspace — everything you add stays in a local SQLite file
at `data/scout.db` on your own machine. See
[`docs/LOCAL_MODE.md`](./docs/LOCAL_MODE.md).

A fresh `/app` shows a first-run screen with three starting points:
**Import a List** (upload a spreadsheet), **Add an Account** (enter one
by hand), or **Explore Demo Data** (jump to `/demo` without touching
your real workspace).

### The `/app` screens

| Screen | What it does |
| --- | --- |
| **Today** | Accounts worth working today, ranked across every active Target List — pins always outrank automatic ordering. |
| **Lists** | Target Lists: progress, suggested calls, all-accounts filters. Progress never resets. |
| **Accounts** | Browse/search every real account; opens into the Call-Ready Brief / Account Brain. |
| **People** | Every real contact, always shown with both a buying-role guess *and* its certainty (`KNOWN` / `INFERRED` / `SUGGESTED`) — never one without the other. |
| **Research** | Resolves a company/domain against your existing accounts, shows everything stored locally, and can pull fresh public web/news evidence on demand (plus an AI summary of it, if Ollama's running). Never LinkedIn. |
| **Imports** | Real CSV/XLSX pipeline: upload → map columns → validate → resolve possible duplicates → import. Creates Accounts, Contacts, and Knowledge Items; can drop everything into a new Target List. |
| **Analytics** | Event-sourced funnel and role-reach numbers, always shown as numerator + denominator (a rate with no attempts renders `—`, never `0%`). |
| **Settings** | Workspace/sales-profile fields (persisted), honest provider status, and real data controls: export a full JSON snapshot, download the raw `data/scout.db` file, or permanently delete everything. |

Logging a call (from any account's **Log Call** button) writes a real
`CallOutcome`, marks that list item worked, and — after you explicitly
approve — adds any notes/observations to that account's memory, always
tagged `INFERRED` until you promote them yourself. If Ollama's
running, a clean rewritten version of your note appears alongside the
raw one a few seconds later.

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
                    demo/     Demo Mode: fictional data, product tour (see DEMO.md)
                    app/      Local Mode: your real data — mirrors demo/ route-for-route (see LOCAL_MODE.md)
                    admin/    Founder Operations Console (unauthenticated stub — see FOUNDER_OPERATIONS.md)
  components/     Shared UI primitives
                    ui/       Button, Card, Input, Tabs, Skeleton, Drawer — DESIGN.md tokens as code
                    marketing/  Nav, hero product composite (CSS-3D, no engine dependency)
                    (badges, priority labels, stat tiles, states, funnel, filters — Scout-specific)
  demo/           Demo Mode fixture data + accessor layer, incl. stress-test fixtures (see DEMO.md)
  data/           Local Mode accessor layer, backed by SQLite (see LOCAL_MODE.md)
                    index.ts       accounts/contacts/lists/people/analytics reads + mutations
                    imports.ts     CSV/XLSX import pipeline (upload/map/validate/resolve/commit)
                    calls.ts       post-call workflow (CallOutcome + approved memory writes)
                    settings.ts    workspace/sales-profile settings
                    export.ts, danger.ts   real data export + delete-all-local-data
  features/       Feature-level UI composition
  domain/         Business logic — target lists, analytics, entity resolution,
                    freshness, source quality, research security/status,
                    brief quality lint (all tested)
  services/       Provider interfaces (CRM incl. writeback, enrichment, research, import).
                    research/enrichment/CRM are unused in Local Mode, kept as future adapter
                    contracts; local-import-provider.ts is a real CSV/XLSX implementation of
                    the import contract (deterministic column mapping, no AI)
  integrations/   Concrete vendor adapters implementing services/ interfaces (empty)
  ai/             AIProvider abstraction, workload-keyed model config — optional, unused in Local Mode
  db/             SQLite connection construction (centralized — nowhere else, see LOCAL_MODE.md)
  auth/           Local single-user auth context, centralized permissions matrix
  lib/            Env validation, branding config
  types/          Shared types (tenancy, evidence, product)
db/               db/schema.sql — the schema actually applied to data/scout.db
supabase/         Historical reference only — see supabase/README.md
tests/            Vitest — highest-risk logic first (see ARCHITECTURE.md)
```

## Environment

Requires **Node ≥22**. Full toolchain (typecheck, lint, build, test) is
verified green on Node 22.23.2. If your `node -v` shows 21.x or lower,
`npm install` will still mostly work but `npm test` will fail outright
(Vitest's bundler needs a Node-22-only `node:util` export) — upgrade
first. `npm run dev`/`npm run build` are more forgiving: local storage
uses `sql.js` (WASM SQLite, no native addon), so those keep working
even on Node 21.

No `.env.local` is required to run Scout. `ANTHROPIC_API_KEY` (see
`.env.example`) is entirely optional and unused by anything in Local
Mode today — see `docs/LOCAL_MODE.md`.

Want AI-generated brief summaries and clean call notes? Install
[Ollama](https://ollama.com), run `ollama pull llama3.2` once, then
keep `ollama serve` running in the background. Nothing to configure —
Scout looks for it at `http://localhost:11434` by default (override
with `OLLAMA_HOST`, or pick a different pulled model per workload via
`AI_MODEL_EXTRACTION`/`AI_MODEL_SUMMARY`/etc. — see `.env.example`).
Skip this entirely and Scout works exactly the same, just without
those two AI touches.

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

CRM writeback/adapters remain unconfigured — the interface exists in
`src/services/crm-provider.ts` as a future extension point, but
nothing is wired up, and Settings says so honestly rather than faking
a connection. The Research Provider and AI Provider are both real now
(see above), but Research is deliberately limited to two free, public,
keyless sources — a company's own website and public news search —
and will never expand to LinkedIn or other login-walled platforms;
that's a permanent product boundary, not a roadmap item. The AI
Provider (Ollama) only rewrites/summarizes text you already have —
Scout doesn't ask it to make prospecting decisions or invent facts.
There's also no in-app
Selling-Situation creation flow yet, and entity resolution during
import only checks against accounts already in the database (not
against other rows in the same file). Multi-user auth and billing are
explicitly out of scope for a local single-user tool; see the
historical `docs/PHASE_4_COMPLETION_REPORT.md` for the earlier
hosted-SaaS framing these superseded.
