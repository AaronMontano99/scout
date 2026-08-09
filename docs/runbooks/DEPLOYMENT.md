# Runbook: Deployment

For a founder who has never run production SaaS before. Written for
the current stack: Next.js on Vercel (recommended — zero-config for
this framework), Supabase (Postgres/Auth/Storage), Trigger.dev
(background jobs).

## Current status

**Not deployed anywhere yet.** No Vercel project, no live Supabase
project, no production domain. This runbook is the procedure for when
that changes, kept ready rather than written under pressure during a
first launch.

## First deployment (one-time setup)

1. Create a Supabase project (`supabase.com`). Note the project URL,
   anon key, and service role key.
2. Run migrations: `supabase link --project-ref <ref>` then
   `supabase db push` — applies `supabase/migrations/*.sql` in order.
   Verify tables exist in the Supabase dashboard's Table Editor before
   proceeding.
3. Generate real DB types: `supabase gen types typescript --linked >
   src/db/types.ts`, replacing the placeholder.
4. Create a Vercel project, connect this GitHub repo.
5. Set environment variables in Vercel (Production + Preview) matching
   `.env.example` — never paste real values into `.env.local` and
   commit it; use Vercel's env var UI or CLI.
6. Deploy. Vercel builds on push to `main` by default — confirm this
   matches intent before the first real customer exists (accidental
   deploys of half-finished work are low-stakes pre-launch, high-stakes
   post-launch).
7. Set up Trigger.dev project, connect `TRIGGER_API_KEY`.

## Every subsequent deployment

Push to `main` (or the configured production branch) → Vercel builds
automatically. Watch the Vercel deployment log for build failures
before assuming it's live.

## Rollback

Vercel keeps every previous deployment — use "Promote to Production" on
a prior deployment in the Vercel dashboard for an instant rollback.
This does **not** roll back database migrations — see
`DATABASE_RECOVERY.md` if a bad deploy included a schema change that
needs reverting.

## Pre-deploy checklist (until CI enforces this automatically)

`npm run typecheck && npm run lint && npm run test && npm run build` —
all four must pass locally before pushing. See `ARCHITECTURE.md`'s CI
foundation note — a GitHub Actions workflow enforcing this
automatically is a reasonable near-term addition, not yet built.
