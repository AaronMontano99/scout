# Runbook: Stale Data

Symptom: a rep reports information in an Account Brief that's clearly
out of date (e.g. a contact who's long gone, news that's old).

## Diagnose

1. Check the specific field's freshness category and window
   (`RESEARCH_FRESHNESS.md`'s `FRESHNESS_WINDOWS_DAYS`) against its
   actual last-checked timestamp. If it's within the window but still
   wrong, the window itself may be miscalibrated for that data type —
   a real tuning question, not a bug necessarily.
2. For a person specifically: check `contacts.last_verified_at`
   against the 60-day `contact_employment` window
   (`PEOPLE_DISCOVERY.md`). If verified recently but still wrong, the
   verification itself was faulty — check what set it.
3. Check whether `describeFreshness()`'s "potentially stale" flag was
   actually showing in the UI — if the data *was* correctly flagged as
   stale and the rep used it anyway, that's expected behavior working
   as designed (Scout surfaces staleness, it doesn't hide old
   information — product spec §69), not a bug.

## Fix

- If genuinely overdue for refresh and just hasn't been re-researched:
  trigger a manual refresh (`research_status → refreshing`, per
  `RESEARCH_ENGINE.md`'s state machine).
- If the freshness window itself seems wrong for a category (e.g. news
  staying "fresh" for 14 days is too generous for a fast-moving
  industry): this is a product tuning conversation, not an emergency
  fix — `FRESHNESS_WINDOWS_DAYS` is configuration, adjust deliberately.
- If a user correction should have superseded old data and didn't:
  check `confirmIdentityByUser()`/correction flow actually ran and
  updated the relevant `certainty_type`/`verification_status` fields.

## What NOT to do

Never quietly delete old data to "fix" staleness — per
`DATA_MODEL.md`'s KnowledgeItem supersession model, old information
stays as history with a `superseded` status. The fix for stale-looking
data is refreshing and correctly labeling it, not erasing the record.
