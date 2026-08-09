# Runbook: Research Failure

Symptom: an account isn't getting a Call-Ready Brief, or research
seems stuck. See also the more specific runbooks: `WRONG_COMPANY_MATCH.md`,
`PROVIDER_OUTAGE.md`, `RESEARCH_COST_SPIKE.md`, `STALE_DATA.md`,
`BAD_AI_OUTPUT.md`, `PEOPLE_DATA_FAILURE.md` — this one is the general
entry point.

## Diagnose

0. Check `accounts.research_status` first (Phase 3 addition — see
   `RESEARCH_ENGINE.md`) — it's the coarse, user-facing state
   (`queued/identifying/researching/processing/ready/limited_data/
   needs_review/failed/refreshing`). Only `failed` is an actual
   problem; `limited_data`/`needs_review` are legitimate, non-broken
   outcomes (`src/domain/research-status.ts`'s `isUsable()`).
1. Check `research_runs.status` for the account — `queued`/`running`/
   `completed`/`failed`. Check `provider_calls` (jsonb log) for which
   external call actually failed.
2. **Common failure modes** (`RESEARCH_ARCHITECTURE.md`): provider rate
   limit, provider outage, no evidence found (this is a *success* case
   with an honest "limited information" result, not a failure — see
   `RESEARCH_WORKSPACE.md`'s minimum-research-floor section), schema
   validation failure on AI-extracted output (`AI_ARCHITECTURE.md` —
   the system should fail the job loudly rather than save malformed
   data; check for a validation error in the job log).
3. Check whether this is one account or the whole queue — a single
   stuck account is usually a provider-specific issue; a stalled queue
   across many accounts/customers is a systemic issue (provider outage,
   queue concurrency misconfiguration — see `JOBS_ARCHITECTURE.md`).

## Fix

- Single account, transient provider error: retry (the pipeline is
  designed to be retryable per-stage, `RESEARCH_ARCHITECTURE.md`).
- Provider outage: wait it out, or fail over if a second
  `ResearchProvider` is configured (`INTEGRATIONS.md`'s provider-
  independence principle exists exactly for this).
- Schema validation failures recurring: this is a prompt/schema bug,
  not an infra issue — fix the extraction code, don't just retry
  indefinitely.

## Cost check

A sudden spike in `UsageRecord` research cost (`COST_MODEL.md`) often
correlates with a caching bug (re-researching accounts that shouldn't
have re-triggered) rather than legitimate new research — check
`ResearchRun` creation rate against actual new/changed accounts before
assuming the cost increase is organic.
