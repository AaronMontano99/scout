import type { JobQueue, EnqueueOptions, JobHandle, ScheduleHandle } from '@/jobs/queue';

/**
 * Trigger.dev implementation of JobQueue — Phase 0 stub. See
 * docs/JOBS_ARCHITECTURE.md and ADR-0003 (runner is a config/adapter
 * choice, not something domain code depends on directly).
 *
 * NOT IMPLEMENTED — no Trigger.dev project is connected yet
 * (TRIGGER_API_KEY unset). Wiring this up is Phase 1/4 work once
 * there are real jobs to run. Job task definitions (one file per job
 * type in JOB_TYPES) will live alongside this client.
 */
export class TriggerDotDevJobQueue implements JobQueue {
  async enqueue<T>(
    jobType: string,
    _payload: T,
    _opts?: EnqueueOptions
  ): Promise<JobHandle> {
    throw new Error(
      `TriggerDotDevJobQueue.enqueue('${jobType}'): not implemented yet — see docs/JOBS_ARCHITECTURE.md.`
    );
  }

  async schedule<T>(
    jobType: string,
    _payload: T,
    _cron: string
  ): Promise<ScheduleHandle> {
    throw new Error(
      `TriggerDotDevJobQueue.schedule('${jobType}'): not implemented yet — see docs/JOBS_ARCHITECTURE.md.`
    );
  }
}
