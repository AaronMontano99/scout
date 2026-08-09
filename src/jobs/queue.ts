/**
 * Durable background job interface — see docs/JOBS_ARCHITECTURE.md and
 * ADR-0003. Domain code enqueues through this interface, never against
 * a specific runner SDK (Trigger.dev, Inngest, ...) directly. Phase 0
 * implementation stub lives in trigger/client.ts.
 */

export interface RetryPolicy {
  maxAttempts: number;
  backoffSeconds: number;
}

export interface EnqueueOptions {
  /** Duplicate enqueue with the same key is a no-op. See docs/JOBS_ARCHITECTURE.md. */
  idempotencyKey?: string;
  retryPolicy?: RetryPolicy;
  /** e.g. organization_id, for per-tenant queue fairness. */
  concurrencyKey?: string;
}

export interface JobHandle {
  jobId: string;
}

export interface ScheduleHandle {
  scheduleId: string;
}

export interface JobQueue {
  enqueue<T>(jobType: string, payload: T, opts?: EnqueueOptions): Promise<JobHandle>;
  schedule<T>(jobType: string, payload: T, cron: string): Promise<ScheduleHandle>;
}

/** V1 job type identifiers — see docs/JOBS_ARCHITECTURE.md for the full table. */
export const JOB_TYPES = [
  'processImport',
  'resolveImportRow',
  'runResearch',
  'extractKnowledge',
  'classifySignals',
  'computeAccountScore',
  'generateDailyPlan',
  'generateEmbeddings',
] as const;
export type JobType = (typeof JOB_TYPES)[number];
