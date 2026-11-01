/**
 * The bell: what needs attention right now. Computed fresh from the data,
 * so there's nothing to mark as read; an alert clears when the work does.
 */
import type { EmailLogRow } from './email-log';
import { formatDayLabel, isOverdue, type ScheduleItem } from './schedule';
import { addBusinessDays } from './hot-list';

export interface Alert {
  id: string;
  tone: 'urgent' | 'attention' | 'info';
  title: string;
  detail: string;
  href: string;
}

/** A sent email goes quiet after this many business days. */
export const QUIET_THREAD_BUSINESS_DAYS = 5;

function itemHref(i: ScheduleItem): string {
  return i.accountId ? `/accounts/${i.accountId}` : '/schedule';
}

export function buildAlerts(input: { items: ScheduleItem[]; emailRows: EmailLogRow[]; today: string }): Alert[] {
  const { items, emailRows, today } = input;
  const alerts: Alert[] = [];

  for (const i of items.filter((x) => !x.done && x.kind === 'meeting' && x.date === today)) {
    alerts.push({ id: `meeting:${i.id}`, tone: 'urgent', title: `Meeting today: ${i.accountName ?? i.title}`, detail: i.title, href: itemHref(i) });
  }

  const overdue = items.filter((i) => isOverdue(i, today));
  for (const i of overdue.slice(-3).reverse()) {
    alerts.push({ id: `overdue:${i.id}`, tone: 'urgent', title: i.title, detail: `Overdue, was due ${formatDayLabel(i.date, today)}`, href: itemHref(i) });
  }
  if (overdue.length > 3) {
    alerts.push({ id: 'overdue:more', tone: 'urgent', title: `${overdue.length - 3} more overdue`, detail: 'Open the Schedule to clear them', href: '/schedule' });
  }

  for (const r of emailRows.filter((x) => x.status === 'replied').slice(0, 3)) {
    alerts.push({ id: `reply:${r.accountId}`, tone: 'attention', title: `${r.company} replied`, detail: 'Log the reply and the next step', href: `/emails?a=${r.accountId}` });
  }

  const quiet = emailRows.filter((r) => {
    if (r.status !== 'awaiting_reply' || !r.lastSentAt) return false;
    return addBusinessDays(r.lastSentAt.slice(0, 10), QUIET_THREAD_BUSINESS_DAYS) <= today;
  });
  for (const r of quiet.slice(0, 3)) {
    alerts.push({ id: `quiet:${r.accountId}`, tone: 'info', title: `${r.company} has gone quiet`, detail: 'Follow up only if you have something new', href: `/accounts/${r.accountId}` });
  }

  return alerts;
}
