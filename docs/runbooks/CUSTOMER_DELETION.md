# Runbook: Customer Deletion

## When this applies

A customer cancels and requests deletion, or an organization needs to
be fully removed (not just a `Membership` — see `USER_ACCESS.md` for
individual user removal, which is different and far more common).

## Before deleting anything

1. Confirm the request is genuine and from an authorized person
   (`OWNER` role, ideally verified out-of-band — email from a known
   domain at minimum).
2. Offer export first — `SECURITY.md`'s data-ownership principle:
   customer data belongs to the customer. Give them a real chance to
   export Accounts/Contacts/KnowledgeItems/Interactions before
   deleting (`SECURITY.md` §Data ownership).
3. Check for an active subscription — cancel billing (`BILLING.md`)
   separately from data deletion; don't conflate the two operations.

## Deletion

Given `organization_id` cascades through nearly every table
(`on delete cascade` throughout `supabase/migrations/`), deleting the
`organizations` row removes essentially everything for that tenant.
**This is destructive and not easily reversible** — per this project's
core safety principles, confirm explicitly with the customer in
writing before running it, and prefer a database backup snapshot
immediately before deletion (see `DATABASE_RECOVERY.md`) even though
recovery from cascade deletion is not guaranteed to be clean.

```sql
-- Illustrative only — verify against the current schema before running.
-- Take a backup/snapshot first.
delete from organizations where id = '<org-id>';
```

## After deletion

Confirm no orphaned data remains (check for any table that doesn't
cascade from `organization_id` — if one is found, that's a schema gap
worth fixing, not just a manual cleanup task). Update the Founder
Operations Console's customer list and billing records to reflect the
closure.

## What NOT to do

Never delete an organization based on inactivity alone without
explicit confirmation — see `FOUNDER_OPERATIONS.md`'s health status;
"At Risk" is a prompt to reach out, not a deletion trigger.
