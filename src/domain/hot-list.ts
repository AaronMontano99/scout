/**
 * Hot List — the rep's Qualified-IN prospect pool: accounts with enough
 * evidence to keep working, where the meeting is not booked yet.
 *
 *   Qualified IN → keep learning → build relevance → earn meeting → off the list
 *
 * Priority is fluid (evidence moves it up or down). The action flag is
 * computed from the next-touch date so the top of the list is always
 * "what needs me today." Pure and dependency-free, like the rest of
 * src/domain.
 */

export type HotPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type HotStage = 'new_qi' | 'developing' | 'warm' | 'meeting_ask_ready' | 'meeting_booked' | 'closed';
export type NextAction = 'call' | 'email' | 'walk_in' | 'linkedin' | 'research';
export type ActionFlag = 'ACT NOW' | 'DUE' | 'UPCOMING' | 'LATER' | 'SET DATE';

export const ACTIVE_STAGES: HotStage[] = ['new_qi', 'developing', 'warm', 'meeting_ask_ready'];

export const STAGE_LABEL: Record<HotStage, string> = {
  new_qi: 'New QI',
  developing: 'Developing',
  warm: 'Warm',
  meeting_ask_ready: 'Meeting ask ready',
  meeting_booked: 'Meeting booked',
  closed: 'Closed / recycle',
};

export const NEXT_ACTION_LABEL: Record<NextAction, string> = {
  call: 'Call',
  email: 'Email',
  walk_in: 'Walk-in',
  linkedin: 'LinkedIn',
  research: 'Research',
};

export interface HotListEntry {
  accountId: string;
  accountName: string;
  priority: HotPriority;
  stage: HotStage;
  contact: string;
  whyQualified: string;
  lastInteraction: string;
  learned: string;
  hypothesis: string;
  nextQuestion: string;
  nextAction: NextAction;
  nextTouchDate: string | null;
  angle: string;
  meetingHypothesis: string;
  closeReason: string;
  lastTouchAt: string | null;
  addedAt: string;
  updatedAt: string;
}

/** YYYY-MM-DD for a local date. */
export function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysBetween(fromYmd: string, toYmd: string): number {
  const [fy, fm, fd] = fromYmd.split('-').map(Number) as [number, number, number];
  const [ty, tm, td] = toYmd.split('-').map(Number) as [number, number, number];
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

/** ACT NOW = due today or overdue; DUE = next 2 days; UPCOMING = within a week; LATER beyond that. */
export function actionFlag(nextTouchDate: string | null, today: string): ActionFlag {
  if (!nextTouchDate || !/^\d{4}-\d{2}-\d{2}$/.test(nextTouchDate)) return 'SET DATE';
  const days = daysBetween(today, nextTouchDate);
  if (days <= 0) return 'ACT NOW';
  if (days <= 2) return 'DUE';
  if (days <= 7) return 'UPCOMING';
  return 'LATER';
}

const FLAG_ORDER: Record<ActionFlag, number> = { 'ACT NOW': 0, 'SET DATE': 1, DUE: 2, UPCOMING: 3, LATER: 4 };
const PRIORITY_ORDER: Record<HotPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
const STAGE_ORDER: Record<HotStage, number> = { meeting_ask_ready: 0, warm: 1, developing: 2, new_qi: 3, meeting_booked: 4, closed: 5 };

/** What needs attention first: action flag, then priority, then how close to a meeting ask, then soonest date. */
export function sortHotList(entries: HotListEntry[], today: string): HotListEntry[] {
  return [...entries].sort(
    (a, b) =>
      FLAG_ORDER[actionFlag(a.nextTouchDate, today)] - FLAG_ORDER[actionFlag(b.nextTouchDate, today)] ||
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
      STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage] ||
      (a.nextTouchDate ?? '9999').localeCompare(b.nextTouchDate ?? '9999')
  );
}

export function isActive(stage: HotStage): boolean {
  return ACTIVE_STAGES.includes(stage);
}

/** Adds business days (skipping Sat/Sun) to a YYYY-MM-DD date. */
export function addBusinessDays(fromYmd: string, days: number): string {
  const [y, m, d] = fromYmd.split('-').map(Number) as [number, number, number];
  const date = new Date(y, m - 1, d);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) added += 1;
  }
  return ymd(date);
}
