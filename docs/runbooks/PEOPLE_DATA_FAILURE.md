# Runbook: People Data Failure

Symptom: an account's Call-Ready Brief has no people, or the people
listed are clearly wrong/outdated.

## Diagnose

1. Check whether this is a **partial pipeline failure** (website/news
   succeeded, people enrichment specifically failed) — per
   `RESEARCH_ENGINE.md`'s partial-success rule, the rest of the brief
   should still be usable; the UI should say "People data unavailable
   right now," not fail the whole account.
2. Check `AccountContactRelationship.is_current`/`valid_until` — if
   people exist but aren't showing, check whether they were
   incorrectly marked historical (`is_current = false`) rather than a
   genuine absence of data.
3. Check `contacts.last_verified_at` staleness — see `STALE_DATA.md`;
   an old-but-present contact is a different problem (needs refresh)
   than no contact at all (needs a data source).
4. If relying on first-party CRM data specifically: confirm the import/
   sync actually populated contacts for this account — see
   `IMPORT_FAILURE.md`/`CRM_CONNECTION_FAILURE.md`.

## Fix

- Provider-side failure: treat as a `PROVIDER_OUTAGE.md` case if
  systemic, or a transient retry if isolated.
- No data available anywhere (genuinely no people found): this is a
  legitimate, honest outcome — product spec §71's low-data-company
  example explicitly shows "No current executives confidently
  identified" as acceptable output, not a bug to fix by inventing a
  contact.
- Incorrectly historical relationship: correct `is_current`, and check
  whether the correction that caused this was itself wrong (see
  `WRONG_COMPANY_MATCH.md`'s correction-audit approach).

## Never

Never fabricate a plausible-sounding person to fill the People section
— an empty, honestly-labeled section is always correct over an invented
one. This is the people-specific instance of the no-fabrication rule
that runs through the whole product (`PRODUCT_CONSTITUTION.md`).
