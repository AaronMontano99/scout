# Runbook: Wrong Company Match

Symptom: a rep reports that an account's research is about the wrong
company — or the identity warning banner (`identity_status =
'review_recommended'`/`'lower_confidence'`) is showing on an account
that's actually correct, or *not* showing on one that's wrong.

## Diagnose

1. Check `accounts.identity_status` and
   `identity_confirmed_at`/`identity_confirmed_by_membership_id` — see
   `ENTITY_RESOLUTION.md`. If `identity_status = 'confirmed'` but the
   match is actually wrong, find out *how* it was confirmed: a real
   user correction (`confirmIdentityByUser()` in
   `src/domain/entity-resolution.ts`) should be trustworthy — if a
   confirmed match is wrong, either the user made a mistake (ask them)
   or a deterministic signal (domain/external ID) was itself wrong at
   the source (check the original import row / CRM record).
2. Check `account_match_candidates` for the account — was there a
   flagged ambiguous match that got auto-resolved incorrectly, or that
   a user resolved incorrectly?
3. Re-run `resolveAccount()`'s logic mentally against the actual
   signals available (name, domain, address, external ID) — per
   ADR-0005, this should never have auto-applied without a real
   deterministic or corroborated signal. If it did auto-apply on weak
   signals, that's a code bug in the resolution logic itself, not a
   one-off data problem — escalate accordingly.

## Fix

- **User can self-correct**: the intended path (`ENTITY_RESOLUTION.md`
  §User corrections always win) — a rep marking "wrong company" should
  immediately re-open the match to review, never require founder
  intervention for the common case.
- **Founder correction needed**: update `identity_status`, clear
  incorrect `identity_confirmed_*` fields, and — critically — treat any
  `KnowledgeItem`/`ResearchFinding` rows created against the wrong
  identity as needing review, not automatic transfer to the correct
  account. Research about Company A should never silently become
  "history" for Company B.

## Prevention

If wrong matches recur for a specific import source or CRM, the
upstream data quality (not Scout's resolution logic) is the likely
root cause — see `IMPORT_FAILURE.md`.
