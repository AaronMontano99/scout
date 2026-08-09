# Runbook: Database Recovery

## Backups

Supabase provides automatic daily backups on paid plans (verify current
retention window in the Supabase dashboard once a real project exists
— not yet provisioned, see `DEPLOYMENT.md`). For anything beyond
Supabase's default retention, a scheduled `pg_dump` to separate storage
is a reasonable addition once real customer data exists — not built
yet, tracked here so it isn't forgotten.

## Point-in-time recovery

Supabase's paid tiers support point-in-time recovery (PITR) to a
specific timestamp. Use this for: accidental bulk deletion, a bad
migration, a bug that corrupted data across many rows. **PITR restores
the whole database to that point in time** — any legitimate writes
after that timestamp are lost too. This is a last resort, not a
routine tool.

## Before any recovery action

1. **Stop writes if possible** — pause the affected service/job so the
   problem doesn't keep compounding while you investigate.
2. **Identify exact scope** — one table? One organization? Everything?
   Check `AuditLog` for what changed and when.
3. **Snapshot current state** before restoring anything — even a bad
   state is useful forensic data, and PITR is one-directional.

## Migration rollback

Supabase migrations (`supabase/migrations/*.sql`) don't auto-generate a
down-migration. If a migration needs reverting: write an explicit
reverse migration (drop the added table/column, restore the previous
constraint) rather than trying to restore from backup for a schema-only
problem — reserve backup restoration for actual data loss/corruption.

## Accidental deletion recovery

If `on delete cascade` removed more than intended (e.g. a wrong
`organization_id` in a delete — see `CUSTOMER_DELETION.md`'s warning),
PITR to just before the delete is usually the fastest correct fix,
accepting the "any writes after that point are lost" tradeoff for the
affected organization only if isolatable, or globally if not.

## After any recovery

Write down exactly what happened and what recovery action was taken —
this becomes the first entry the *next* incident investigation reads.
See `INCIDENT_RESPONSE.md`.
