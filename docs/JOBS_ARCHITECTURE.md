# Background Job Architecture

## Why

Research, enrichment, CRM sync, rescoring, daily-plan generation, and
embedding generation must never depend on an HTTP request staying
alive — some of these (a research pipeline hitting multiple external
providers) can take longer than any reasonable request timeout, and
all of them should survive a server restart mid-run.

## Interface, not vendor

```typescript
// src/jobs/queue.ts
export interface JobQueue {
  enqueue<T>(jobType: string, payload: T, opts?: EnqueueOptions): Promise<JobHandle>;
  schedule<T>(jobType: string, payload: T, cron: string): Promise<ScheduleHandle>;
}

export interface EnqueueOptions {
  idempotencyKey?: string;      // duplicate enqueue with same key is a no-op
  retryPolicy?: RetryPolicy;    // max attempts, backoff
  concurrencyKey?: string;      // e.g. organization_id, for per-tenant throttling
}
```

Phase 0 implements this against Trigger.dev (see `DECISIONS.md`
ADR-0003); domain code enqueues jobs through `JobQueue`, never against
a vendor SDK directly.

## Job types (V1-relevant)

| Job | Trigger | Idempotency key | Notes |
|---|---|---|---|
| `processImport` | file upload | `import_id` | Parses, maps columns, creates ImportRows |
| `resolveImportRow` | per-row, fanned out from `processImport` | `import_row_id` | Entity resolution for one row |
| `runResearch` | manual request, scheduled refresh, new account | `research_run_id` | The full pipeline in `RESEARCH_ARCHITECTURE.md` |
| `extractKnowledge` | sub-step of `runResearch` | `research_run_id:extract` | Structured extraction, schema-validated |
| `classifySignals` | sub-step of `runResearch` | `research_run_id:classify` | |
| `computeAccountScore` | after research completes, or on-demand | `account_id:score:{trigger_ts}` | Reads current KnowledgeItems/Findings/Signals |
| `generateDailyPlan` | scheduled (per org, per rep's morning) or manual | `membership_id:plan:{plan_date}` | Reads current scores, does not re-trigger research |
| `generateEmbeddings` | after new KnowledgeItem/ResearchFinding | `{table}:{id}:embed` | Cheap, high-volume, low priority in queue |
| `syncIntegration` | scheduled or manual, Phase 7 | `integration_id:sync:{since}` | Not built in V1 |

## Concurrency and tenant fairness

Every job carries a `concurrencyKey` (typically `organization_id`) so
one tenant's burst (a huge CSV import fanning out hundreds of
`resolveImportRow` jobs) can't starve other tenants' queues. Per-org
concurrency limits are configurable and tie into `COST_MODEL.md`'s
per-org budget concept.

## Idempotency and retries

- Every job type defines its idempotency key up front (see table
  above) — re-enqueueing the same logical work is always safe.
- Retry policy is per job type: transient provider errors (rate limit,
  timeout) retry with backoff; validation failures (schema-invalid AI
  output, malformed file) do not blindly retry — they fail to a
  reviewable state.
- Multi-stage jobs (`runResearch`) persist per-stage completion so a
  retry resumes rather than restarts — see `RESEARCH_ARCHITECTURE.md`.

## Observability

Every job execution logs: job type, org, duration, outcome
(success/failure/retried), and — for cost-relevant jobs — the
resulting `UsageRecord`. Failed jobs are queryable by type and org so
a solo founder can answer "why didn't this customer's research finish"
without spelunking through raw logs. See `ARCHITECTURE.md`'s
Observability principle (kept intentionally lightweight for V1 — no
dedicated observability stack yet, just clean instrumentation
boundaries that a real one can plug into later).

## What's explicitly not built in V1

Cross-organization job prioritization beyond simple fairness, a
job-management admin UI beyond what's needed to debug (a real "job
dashboard" product surface is not a V1 goal), dead-letter-queue
tooling beyond basic failure visibility.
