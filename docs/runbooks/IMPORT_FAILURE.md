# Runbook: Import Failure

Symptom: a customer's CSV/XLSX upload didn't produce the accounts they
expected.

## Diagnose

1. Check `imports.status` — `uploaded`/`mapping`/`processing`/
   `completed`/`failed`. A stuck `processing` status past a few minutes
   for a normal-sized file (a few thousand rows) indicates a job
   failure — check the background job logs (`JOBS_ARCHITECTURE.md`'s
   `processImport` job).
2. Check `imports.error_count` and the `import_rows` table for rows
   with `resolution_status = 'failed'` or `'needs_review'` — read each
   `error` field. Common causes per `INTEGRATIONS.md`/product spec §48:
   missing company name, ambiguous company, malformed date, duplicate
   contact, invalid email, unrecognized owner name.
3. **A handful of bad rows should never fail the whole import** — if
   it did, that's a real bug (the import pipeline is designed to
   isolate row-level failures, see `DATA_MODEL.md` §Import/ImportRow).
   Escalate to code rather than trying to work around it customer-by-
   customer.

## Fix

- For `needs_review` rows: these need a human decision (usually the
  customer, sometimes you) on which `AccountMatchCandidate` is correct
  — see `RESEARCH_WORKSPACE.md`'s entity-resolution section.
- For malformed data: it's usually faster to ask the customer for a
  corrected export than to hand-patch rows.
- Never silently drop failed rows without telling the customer — the
  whole product promise is not losing their institutional knowledge.

## Prevention

If the same error type recurs across customers, that's a signal the
column-mapping inference (`ImportProvider.inferColumnMapping`,
`RESEARCH_ARCHITECTURE.md`) needs improvement, not that customers keep
making the same mistake.
