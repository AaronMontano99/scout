/**
 * Schedule: dated tasks plus each active Hot List row's next touch, in one
 * list. Pure, like the rest of src/domain. Local YYYY-MM-DD strings
 * throughout, so nothing shifts a day across time zones.
 */
import { NEXT_ACTION_LABEL, isActive, ymd, type HotListEntry, type HotPriority } from './hot-list';

export type TaskKind = 'call' | 'email' | 'walk_in' | 'linkedin' | 'meeting' | 'research' | 'task';

export const TASK_KIND_LABEL: Record<TaskKind, string> = {
  call: 'Call',
  email: 'Email',
  walk_in: 'Walk-in',
  linkedin: 'LinkedIn',
  meeting: 'Meeting',
  research: 'Research',
  task: 'Task',
};

export const TASK_KINDS = Object.keys(TASK_KIND_LABEL) as TaskKind[];

export interface Task {
  id: string;
  accountId: string | null;
  accountName: string | null;
  title: string;
  kind: TaskKind;
  dueDate: string;
  dueTime: string | null;
  notes: string;
  doneAt: string | null;
}

export interface ScheduleItem {
  id: string;
  source: 'task' | 'touch';
  /** The task id, or the account id for a Hot List touch. */
  refId: string;
  title: string;
  kind: TaskKind;
  date: string;
  time: string | null;
  accountId: string | null;
  accountName: string | null;
  priority: HotPriority | null;
  notes: string;
  done: boolean;
}

function fromTask(t: Task): ScheduleItem {
  return {
    id: `task:${t.id}`,
    source: 'task',
    refId: t.id,
    title: t.title,
    kind: t.kind,
    date: t.dueDate,
    time: t.dueTime,
    accountId: t.accountId,
    accountName: t.accountName,
    priority: null,
    notes: t.notes,
    done: Boolean(t.doneAt),
  };
}

function fromHotList(e: HotListEntry): ScheduleItem | null {
  if (!isActive(e.stage) || !e.nextTouchDate) return null;
  return {
    id: `touch:${e.accountId}`,
    source: 'touch',
    refId: e.accountId,
    title: `${NEXT_ACTION_LABEL[e.nextAction]} ${e.accountName}`,
    kind: e.nextAction === 'research' ? 'research' : e.nextAction,
    date: e.nextTouchDate,
    time: null,
    accountId: e.accountId,
    accountName: e.accountName,
    priority: e.priority,
    notes: e.nextQuestion,
    done: false,
  };
}

const PRIORITY_RANK: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

function compareItems(a: ScheduleItem, b: ScheduleItem): number {
  return (
    a.date.localeCompare(b.date) ||
    Number(b.kind === 'meeting') - Number(a.kind === 'meeting') ||
    (a.time ?? '99').localeCompare(b.time ?? '99') ||
    (PRIORITY_RANK[a.priority ?? 'LOW'] ?? 2) - (PRIORITY_RANK[b.priority ?? 'LOW'] ?? 2) ||
    a.title.localeCompare(b.title)
  );
}

export function buildSchedule(tasks: Task[], hotList: HotListEntry[]): ScheduleItem[] {
  return [...tasks.map(fromTask), ...hotList.map(fromHotList).filter((i): i is ScheduleItem => i !== null)].sort(compareItems);
}

export function isOverdue(item: ScheduleItem, today: string): boolean {
  return !item.done && item.date < today;
}

/**
 * What to do next: meetings today first, then everything overdue or due
 * today, strongest accounts first. A stale backlog never pushes today's
 * meeting off the top.
 */
export function nextUp(items: ScheduleItem[], today: string, limit = 6): ScheduleItem[] {
  const open = items.filter((i) => !i.done && i.date <= today);
  const rank = (i: ScheduleItem) => (i.kind === 'meeting' && i.date === today ? 0 : 1);
  return open
    .sort(
      (a, b) =>
        rank(a) - rank(b) ||
        (PRIORITY_RANK[a.priority ?? 'MEDIUM'] ?? 1) - (PRIORITY_RANK[b.priority ?? 'MEDIUM'] ?? 1) ||
        b.date.localeCompare(a.date) ||
        compareItems(a, b)
    )
    .slice(0, limit);
}

export function parseYmd(value: string): Date {
  const [y, m, d] = value.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
}

export function shiftDays(value: string, days: number): string {
  const d = parseYmd(value);
  d.setDate(d.getDate() + days);
  return ymd(d);
}

/** The Monday after the given date. */
export function nextMonday(value: string): string {
  const day = parseYmd(value).getDay();
  return shiftDays(value, day === 0 ? 1 : 8 - day);
}

/** Six Monday-first weeks covering the month, so the grid never changes height. */
export function monthGrid(year: number, month: number): string[][] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  const start = ymd(new Date(year, month, 1 - lead));
  return Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, d) => shiftDays(start, w * 7 + d)));
}

export function weekOf(value: string): string[] {
  const lead = (parseYmd(value).getDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, d) => shiftDays(value, d - lead));
}

export function formatTime(time: string | null): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number) as [number, number];
  const hour = h % 12 || 12;
  return `${hour}${m ? `:${String(m).padStart(2, '0')}` : ''}${h < 12 ? 'am' : 'pm'}`;
}

export function formatDayLabel(value: string, today: string): string {
  if (value === today) return 'Today';
  if (value === shiftDays(today, 1)) return 'Tomorrow';
  if (value === shiftDays(today, -1)) return 'Yesterday';
  return parseYmd(value).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
