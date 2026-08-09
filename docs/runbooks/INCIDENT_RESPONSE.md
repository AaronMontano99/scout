# Runbook: Incident Response

For a solo founder — no incident-response team, so the process has to
be simple enough to actually follow under stress.

## What counts as an incident

Cross-tenant data exposure (any evidence one org saw another's data),
data loss/corruption, extended outage, a security credential
compromise (leaked API key, compromised service-role key), a billing
error affecting multiple customers, or anything a customer would
reasonably call "you lost my data" or "this isn't secure."

A single customer's research job failing is **not** an incident — see
`RESEARCH_FAILURE.md`. Scope matters.

## Immediate steps

1. **Stop the bleeding first, understand it fully second.** If a
   credential is compromised, rotate it immediately
   (`SECURITY.md`/`.env.example`) even before you know the full blast
   radius. If cross-tenant exposure is suspected, that code path gets
   disabled/reverted immediately, not "fixed carefully" while still
   live.
2. **Snapshot state** before making further changes, if data
   integrity is in question (see `DATABASE_RECOVERY.md`).
3. **Determine scope** — which organizations, which data, since when.
   `AuditLog` is the first place to look.

## Communication

Affected customers get told directly, plainly, without minimizing —
`PRODUCT_CONSTITUTION.md`'s transparency-over-flattery principle
applies here more than anywhere. "We found X, here's what we know,
here's what we're doing, here's what we don't know yet" beats silence
or a vague reassurance every time. Do not wait for a "complete"
understanding before the first customer communication if the incident
is serious — an early honest partial update is better than a delayed
complete one.

## After

Write up what happened, why, and what changes (code, process, or both)
prevent a repeat — even a short version. If the same class of incident
could recur elsewhere (e.g. an RLS gap found in one table might exist
in others), audit for that specifically rather than only fixing the
one instance found.

## Severity is not the same as urgency

A low-severity issue (one customer's minor display bug) doesn't need
this runbook. A high-severity issue with no active harm (a
vulnerability found before exploitation) still needs fast, careful
handling — don't wait for evidence of harm to treat something
seriously.
