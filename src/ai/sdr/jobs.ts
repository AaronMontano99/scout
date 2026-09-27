/**
 * Tiny in-process job registry for long AI runs (30s to several
 * minutes). Lets a page that was closed and reopened mid-run see that
 * work is still going and pick up the result when it lands, and stops
 * a double-click from launching the same research twice.
 *
 * Kept on globalThis so route handlers and server components share
 * one registry even if Next loads this module more than once.
 */

export interface JobState {
  key: string;
  status: 'running' | 'done' | 'failed';
  startedAt: number;
  finishedAt?: number;
  error?: string;
}

interface Registry {
  jobs: Map<string, JobState>;
  promises: Map<string, Promise<unknown>>;
}

const g = globalThis as typeof globalThis & { __scoutSdrJobs?: Registry };
const registry: Registry = (g.__scoutSdrJobs ??= { jobs: new Map(), promises: new Map() });

export function jobKey(kind: string, id: string): string {
  return `${kind}:${id}`;
}

/** Runs fn under `key`, or joins the run already in flight for that key. */
export function runJob<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = registry.promises.get(key);
  if (existing && registry.jobs.get(key)?.status === 'running') return existing as Promise<T>;

  const state: JobState = { key, status: 'running', startedAt: Date.now() };
  registry.jobs.set(key, state);
  const promise = fn().then(
    (value) => {
      registry.jobs.set(key, { ...state, status: 'done', finishedAt: Date.now() });
      return value;
    },
    (err: unknown) => {
      registry.jobs.set(key, { ...state, status: 'failed', finishedAt: Date.now(), error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  );
  registry.promises.set(key, promise);
  return promise;
}

export function getJob(key: string): JobState | null {
  return registry.jobs.get(key) ?? null;
}
