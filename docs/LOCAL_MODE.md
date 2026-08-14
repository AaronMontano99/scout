# Local Mode

Scout runs entirely on your own machine: `npm install && npm run dev`,
no cloud accounts, no signup, no services to run in the background.
Your data lives in a local SQLite file (`data/scout.db`), not a hosted
database. This is the current architecture — the doc to read instead
of reverse-engineering intent from the phase completion reports, which
predate this and are now historical (see the notes at the top of
`PHASE_3_5_STATUS.md` and `PHASE_4_COMPLETION_REPORT.md`).

## Why

Scout's earlier phases built a real product UI (Target List workspace,
Call-Ready Brief, Post-Call workflow, Analytics) against Supabase
(Postgres + Auth), Trigger.dev (background jobs), Stripe (billing), and
an AI research engine — but none of it was ever actually connected.
`src/integrations/` was empty, `trigger/client.ts` threw on every call,
`src/auth/index.ts` threw for any real signed-in user, and
`src/lib/env.ts` required Supabase env vars that didn't exist — so the
app could only ever run against fictional Demo Mode fixtures, never
real data. Local mode makes it a tool you can actually use: enter your
own accounts, contacts, and notes, and get real prioritization —
without needing a live research provider or an AI API key to get real
value out of it.

## `/demo` vs `/app`

Two separate, clearly-labeled modes, never mixed — the same principle
as keeping a synthetic demo environment strictly apart from real data
in any tool that has both:

- **`/demo`** — entirely fictional data (`src/demo/fixtures.ts`),
  unchanged from earlier phases. A product tour: safe to click through
  immediately, including hand-written Call-Ready Brief narrative
  content that no local install could honestly generate without an AI
  provider. See `docs/DEMO.md`.
- **`/app`** — your real data, stored in `data/scout.db`. Starts
  empty. `src/app/app/**` mirrors `src/app/demo/**` route-for-route,
  importing from `@/data` instead of `@/demo`.

Both accessor modules (`src/demo/index.ts`, `src/data/index.ts`)
implement the same ~20 function signatures — `getTargetLists()`,
`getAccount(id)`, `getKnowledgeItemsForAccount(id)`, etc. — so the page
components barely differ between the two trees.

## Storage

- **Schema**: [`db/schema.sql`](../db/schema.sql), flattened from
  `supabase/migrations/0002_core_product.sql` +
  `0003_research_engine.sql` (`0001_init_tenancy.sql`'s
  organizations/memberships/RLS scaffolding is dropped entirely — a
  local single-user tool has exactly one implicit workspace). See
  `supabase/README.md` for why those migrations are still in the repo.
- **Driver**: [`sql.js`](https://sql.js.org/) (WASM SQLite, no native
  addon) — not a native driver like `better-sqlite3`, and not Node's
  built-in `node:sqlite` (which requires `--experimental-sqlite`
  before Node 23.4). No native addon means no compiled binary to fail
  to install for a contributor or user on an unusual OS/arch/Node
  combination — a real concern for an open-source tool other people
  will clone. The tradeoff: sql.js keeps the whole database in memory
  and re-serializes + rewrites the whole file on every mutation (see
  `src/db/client.ts`) — fine at the scale this tool is for (one
  person's prospecting list), not a good idea at multi-gigabyte scale.
- **Connection**: `src/db/client.ts`'s `getDb()` — a singleton that
  creates `data/scout.db` and applies `db/schema.sql` on first use.
  Every statement in `schema.sql` is `CREATE TABLE IF NOT EXISTS`, so
  re-running it on every process start is idempotent. No migration
  runner exists yet — a deliberately deferred problem, since there are
  no existing installs to migrate.
- **Auth**: `src/auth/index.ts` returns a hardcoded, synchronous
  `OWNER`-role `AuthContext` — there's exactly one local user, so
  there's nothing to sign in to.

## Manual data entry (V1)

No CSV import, no AI-assisted column mapping yet — real accounts are
entered by hand: `/app/accounts/new`, `/app/accounts/[id]/contacts/new`,
`/app/accounts/[id]/notes/new`, `/app/lists/new`, and "Add Account to
List" from a Target List page. See the mutation functions at the
bottom of `src/data/index.ts`.

Two deliberate honesty choices in `src/data/index.ts`, both following
the product's existing "no fake score / no fabricated content" rules
(see `docs/TARGET_LISTS.md`):

- **`getAccountBrief`** never fabricates AI-authored narrative. It
  assembles "What They Do" from stored industry/size fields (or a
  placeholder if empty) and "What Matters" from your real notes,
  verbatim — no talk track, since there's no AI provider generating
  one.
- **New accounts get `researchStatus: 'limited_data'`**, not
  `'queued'` — there's no research pipeline to be queued in, so
  implying pending work would be dishonest. `toPriorityLabel` already
  falls back correctly to `'limited_data'` when no `account_scores`
  row exists — zero domain-layer changes needed.

CSV import via a manual (non-AI) column-mapper is a reasonable next
step, not abandoned — `src/services/import-provider.ts`'s
`ParsedTable`/`ColumnMappingSuggestion` shapes don't actually require
an AI-generated suggestion, just a user-chosen one.

## What got deleted, and what didn't

**Deleted**: `trigger/`, `src/jobs/queue.ts` (every method threw,
nothing called them), `src/services/billing-provider.ts` (fully
Stripe-shaped, no billing concept in a local single-user tool),
`@supabase/supabase-js` / `@supabase/ssr`.

**Kept, unused, as future extension points**: `src/services/crm-provider.ts`,
`enrichment-provider.ts`, `research-provider.ts`, `import-provider.ts`
— pure interfaces, zero implementations, genuinely harmless, and a
legitimate seam if you want to wire in a personal CRM export or your
own API key later. `supabase/migrations/` — historical reference for
the schema `db/schema.sql` was derived from.

## AI (optional)

Unused today. If you set `ANTHROPIC_API_KEY` (see `.env.example`),
`src/ai/provider.ts`'s `AIProvider` abstraction is there to build on —
but nothing in local mode calls it yet. Local mode's whole point is
that Scout is useful with zero AI dependency: your own notes,
organized and prioritized, not AI-generated research.
