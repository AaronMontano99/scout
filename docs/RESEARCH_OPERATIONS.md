# Research Operations

Extends `FOUNDER_OPERATIONS.md` with research-specific diagnostics —
what the solo founder needs to answer product spec §112's question
list without querying production tables by hand.

## Per-Research-Run diagnostics (Founder Operations Console)

For any `ResearchRun`: identity result, sources found, provider calls
made (`provider_calls` jsonb), per-stage status (website/news/people/
synthesis), retry count, cost, duration, and — on failure — a specific
failure reason (see Retry Policy below, not a raw stack trace).

## Failure classification (product spec §52)

`TRANSIENT` (retry with backoff) · `RATE_LIMIT` (retry after backoff,
respecting provider-specific limits) · `AUTH` (needs a human to fix
credentials, don't retry blindly) · `INVALID_INPUT` (bad data in, not a
provider problem) · `NOT_FOUND` (legitimate — the source doesn't
exist, not a failure) · `PERMANENT` (don't retry) · `MODEL_SCHEMA`
(AI output failed validation — see `AI_ARCHITECTURE.md`, `AI_EVALUATIONS.md`).
Retry behavior depends on classification — retrying a `PERMANENT` or
`AUTH` failure indefinitely wastes cost and delays the honest "this
needs your attention" signal to the founder.

## Idempotency (product spec §53)

Repeated research jobs must never create duplicate `Source`,
`ResearchFinding`, `KnowledgeItem`, or `Signal` rows. `sources.content_hash`
(`SOURCE_MODEL.md`) is the primary dedup key for fetched content;
`research_runs.id` is the idempotency key for a research attempt
itself — re-running a completed run within the cache window
(`RESEARCH_FRESHNESS.md`) is a no-op, not a fresh set of rows.

## Customer experience during a provider outage (product spec §95)

Existing Account Brain data remains fully accessible — a down research
provider degrades *new* research, never *existing* research. The UI
should say "Current research is temporarily unavailable. Existing
account information is still available," never make the whole account
page fail. This maps directly onto `research_status`: an account
sitting at `ready`/`limited_data` stays there and stays usable even if
a `refreshing` attempt later fails.

## Retry / pause controls

The founder should be able to retry a specific failed `ResearchRun`,
inspect its failure reason, and — for a pathological run (e.g. one
stuck in an infinite retry loop against a misbehaving provider) —
pause or cancel it safely. Not yet built as UI; the underlying
`research_runs.status`/failure classification above is what such a
control would operate on.

## What's NOT built yet

No live research has run, so none of this has been exercised against
real failures yet. The admin console stub
(`src/app/admin/page.tsx`) doesn't yet surface per-run diagnostics —
see `PHASE_3_COMPLETION_REPORT.md`'s next tasks.
