# Runbook: Target List Failure

Symptom: a customer reports a list that "won't load," "is stuck," or
"lost my progress."

## Diagnose

1. **Confirm it's not persistence** — `calculateListProgress`
   (`src/domain/target-lists.ts`) is a pure function over
   `TargetListItem` rows; if progress "reset," check whether the rows
   themselves changed (a bad import re-run creating duplicate items?
   `unique (target_list_id, account_id)` constraint in
   `0002_core_product.sql` should prevent true duplicates — if it
   didn't, that's a real bug, escalate to code, not data).
2. **Check the list's underlying research state.** A list that "won't
   load" is often actually a research pipeline stall on the accounts
   in it — see `RESEARCH_FAILURE.md`.
3. **Check RLS.** If a rep reports a list "disappeared," verify their
   `Membership` still has `status = 'active'` and belongs to the right
   `organization_id` — a role change or accidental removal looks like
   data loss from the customer's side. See `SECURITY.md`.
4. **Check the Founder Operations Console** (`FOUNDER_OPERATIONS.md`)
   Implementation view once built — it should surface list/import/
   research status without a manual query.

## Fix

- Stuck research: see `RESEARCH_FAILURE.md`.
- Wrongly removed membership: restore it, confirm the rep regains
  visibility.
- Suspected data corruption: **stop, don't guess** — snapshot the
  affected rows before any write, then investigate. See
  `DATABASE_RECOVERY.md`.

## What NOT to do

Never manually "fix" a customer's list progress by guessing at what the
correct `worked`/`skipped` state should be — ask the customer, or
reconstruct from `CallOutcome` history (which is a more reliable source
of truth than the list item status alone).
