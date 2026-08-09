# Runbook: Provider Outage

Symptom: a research/enrichment/AI provider is down or erroring broadly
— not one account, many.

## Diagnose

1. Check the provider's own status page first — don't assume the bug
   is on Scout's side.
2. Check `research_runs.provider_calls` across recent runs for a
   consistent error pattern (same provider, same error type) — this
   confirms scope before you start "fixing" something.
3. Classify: is this `RATE_LIMIT` (self-inflicted — check organization/
   global concurrency settings, `JOBS_ARCHITECTURE.md`) or a genuine
   provider-side outage?

## Fix

- **Genuine outage, secondary provider configured**: fail over per
  `INTEGRATIONS.md`'s provider-independence principle — this is exactly
  why `ResearchProvider`/`EnrichmentProvider` are interfaces, not
  concrete vendor calls sprinkled through domain code.
- **No secondary provider / single point of failure**: accounts stay
  at their last-known `research_status` — per `RESEARCH_OPERATIONS.md`,
  existing Account Brain data remains fully usable even while new
  research is blocked. The UI should say so plainly ("Current research
  is temporarily unavailable. Existing account information is still
  available.") — never make the whole account page fail because one
  provider is down.
- **Self-inflicted rate limiting**: back off, don't just retry harder —
  see `RESEARCH_OPERATIONS.md`'s failure classification (`RATE_LIMIT`
  gets backoff, not immediate retry).

## After

Once the provider recovers, queued/failed runs should resume
automatically if the job system's retry policy is configured correctly
(`JOBS_ARCHITECTURE.md`) — verify a backlog actually drains rather than
silently stalling.
