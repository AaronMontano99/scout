/** Dated tasks for the Schedule. See src/domain/schedule.ts. */
import { getDb, type SqlValue } from '@/db/client';
import { touchAccount } from './accounts';
import type { Task, TaskKind } from '@/domain/schedule';

function mapTask(r: Record<string, unknown>): Task {
  return {
    id: r.id as string,
    accountId: (r.account_id as string) ?? null,
    accountName: (r.account_name as string) ?? null,
    title: r.title as string,
    kind: r.kind as TaskKind,
    dueDate: r.due_date as string,
    dueTime: (r.due_time as string) ?? null,
    notes: r.notes as string,
    doneAt: (r.done_at as string) ?? null,
  };
}

const SELECT = 'SELECT t.*, a.name AS account_name FROM sdr_tasks t LEFT JOIN accounts a ON a.id = t.account_id';

export function getTasks(): Task[] {
  return getDb().prepare(`${SELECT} ORDER BY t.due_date, t.due_time`).all().map(mapTask);
}

export function getTask(id: string): Task | null {
  const r = getDb().prepare(`${SELECT} WHERE t.id = ?`).get(id);
  return r ? mapTask(r) : null;
}

export function getTasksForAccount(accountId: string): Task[] {
  return getDb().prepare(`${SELECT} WHERE t.account_id = ? ORDER BY t.due_date, t.due_time`).all(accountId).map(mapTask);
}

export interface TaskInput {
  accountId: string | null;
  title: string;
  kind: TaskKind;
  dueDate: string;
  dueTime: string | null;
  notes: string;
}

export function createTask(input: TaskInput, id: string = crypto.randomUUID()): string {
  const now = new Date().toISOString();
  getDb()
    .prepare('INSERT INTO sdr_tasks (id, account_id, title, kind, due_date, due_time, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, input.accountId, input.title.trim(), input.kind, input.dueDate, input.dueTime, input.notes.trim(), now, now);
  if (input.accountId) touchAccount(input.accountId);
  return id;
}

export type TaskPatch = Partial<Pick<Task, 'title' | 'kind' | 'dueDate' | 'dueTime' | 'notes' | 'doneAt' | 'accountId'>>;

const CLEARABLE = new Set<keyof TaskPatch>(['doneAt', 'dueTime', 'accountId']);

const COLUMNS: Record<keyof TaskPatch, string> = {
  title: 'title',
  kind: 'kind',
  dueDate: 'due_date',
  dueTime: 'due_time',
  notes: 'notes',
  doneAt: 'done_at',
  accountId: 'account_id',
};

export function updateTask(id: string, patch: TaskPatch): void {
  const keys = (Object.keys(patch) as (keyof TaskPatch)[]).filter((k) => patch[k] !== undefined && (patch[k] !== null || CLEARABLE.has(k)));
  if (keys.length === 0) return;
  const sets = keys.map((k) => `${COLUMNS[k]} = ?`).join(', ');
  getDb()
    .prepare(`UPDATE sdr_tasks SET ${sets}, updated_at = ? WHERE id = ?`)
    .run(...keys.map((k) => patch[k] as SqlValue), new Date().toISOString(), id);
}

export function deleteTask(id: string): void {
  getDb().prepare('DELETE FROM sdr_tasks WHERE id = ?').run(id);
}
