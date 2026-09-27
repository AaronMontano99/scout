/**
 * Email log — one row per company Aaron has emailed (or drafted for):
 * where the thread stands and whether the account is qualified IN or
 * OUT. Pure: derived from drafts, logged activity, and the Hot List, so
 * it stays current on its own. Nothing here is guessed.
 */
import { isActive, type HotStage } from './hot-list';

export type EmailStatus = 'meeting_booked' | 'replied' | 'awaiting_reply' | 'call_first' | 'skipped' | 'drafted';
export type Qualification = 'in' | 'out' | 'not_yet' | 'unassessed';

export const EMAIL_STATUS_LABEL: Record<EmailStatus, string> = {
  meeting_booked: 'Meeting booked',
  replied: 'Replied',
  awaiting_reply: 'Sent, awaiting reply',
  call_first: 'Call first',
  skipped: 'Skipped',
  drafted: 'Drafted, not sent',
};

export const QUALIFICATION_LABEL: Record<Qualification, string> = {
  in: 'Qualified IN',
  out: 'Qualified OUT',
  not_yet: 'Not qualified yet',
  unassessed: 'Not assessed',
};

export interface EmailLogInput {
  accountId: string;
  company: string;
  latestDraft: {
    createdAt: string;
    subject: string;
    contactName: string;
    priority: string;
    recommendation: 'send' | 'call_first';
    skipReason: string;
    recommendationReason: string;
  } | null;
  /** Email activity for this account (sent + replies), any order. */
  emails: { outcome: string | null; occurredAt: string; contactName: string | null; crmNotes: string[]; meetingBooked: boolean }[];
  anyMeetingBooked: boolean;
  hotList: { stage: HotStage; whyQualified: string; closeReason: string; nextQuestion: string; nextAction: string; nextTouchDate: string | null } | null;
  lastCheck: { decision: string; reason: string } | null;
}

export interface EmailLogRow {
  accountId: string;
  company: string;
  contact: string;
  subject: string;
  lastSentAt: string | null;
  lastReplyAt: string | null;
  lastActivityAt: string;
  status: EmailStatus;
  qualification: Qualification;
  /** Why it's in or out (Hot List reason, close reason, or the last assessment). */
  reason: string;
  nextStep: string;
}

function latest(dates: string[]): string | null {
  return dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : null;
}

export function qualificationOf(input: Pick<EmailLogInput, 'hotList' | 'lastCheck'>): { qualification: Qualification; reason: string } {
  const h = input.hotList;
  if (h && (isActive(h.stage) || h.stage === 'meeting_booked')) return { qualification: 'in', reason: h.whyQualified };
  if (h && h.stage === 'closed') return { qualification: 'out', reason: h.closeReason || input.lastCheck?.reason || '' };
  if (input.lastCheck?.decision === 'close') return { qualification: 'out', reason: input.lastCheck.reason };
  if (input.lastCheck?.decision === 'not_qualified') return { qualification: 'not_yet', reason: input.lastCheck.reason };
  return { qualification: 'unassessed', reason: '' };
}

export function buildEmailLogRow(input: EmailLogInput): EmailLogRow {
  const sent = input.emails.filter((e) => e.outcome === 'email_sent');
  const replies = input.emails.filter((e) => e.outcome === 'email_reply');
  const lastSentAt = latest(sent.map((e) => e.occurredAt));
  const lastReplyAt = latest(replies.map((e) => e.occurredAt));
  const draft = input.latestDraft;
  const draftUnsent = draft && (!lastSentAt || draft.createdAt > lastSentAt);

  let status: EmailStatus;
  if (input.anyMeetingBooked || input.hotList?.stage === 'meeting_booked') status = 'meeting_booked';
  else if (lastReplyAt && (!lastSentAt || lastReplyAt >= lastSentAt)) status = 'replied';
  else if (draftUnsent && draft.recommendation === 'call_first') status = 'call_first';
  else if (draftUnsent && draft.priority === 'SKIP' && !lastSentAt) status = 'skipped';
  else if (lastSentAt) status = 'awaiting_reply';
  else status = 'drafted';

  const { qualification, reason } = qualificationOf(input);

  const h = input.hotList;
  let nextStep = '';
  if (qualification === 'out') nextStep = 'None. Recycle only if something changes.';
  else if (h && isActive(h.stage)) {
    const when = [h.nextAction.replace('_', '-'), h.nextTouchDate && `by ${h.nextTouchDate}`].filter(Boolean).join(' ');
    nextStep = h.nextQuestion ? `${when}: ${h.nextQuestion}` : when;
  }
  else if (status === 'call_first') nextStep = draft?.recommendationReason ?? 'Call first.';
  else if (status === 'skipped') nextStep = draft?.skipReason ?? '';
  else if (status === 'awaiting_reply') nextStep = 'Wait for a reply. Follow up only with new relevance.';
  else if (status === 'replied') nextStep = 'Log the reply read and next step.';
  else if (status === 'drafted') nextStep = 'Send it, or skip it.';

  const lastContact = [...input.emails].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).find((e) => e.contactName)?.contactName;

  return {
    accountId: input.accountId,
    company: input.company,
    contact: draft?.contactName || lastContact || '',
    subject: draft?.subject ?? '',
    lastSentAt,
    lastReplyAt,
    lastActivityAt: latest([lastSentAt, lastReplyAt, draft?.createdAt].filter((d): d is string => Boolean(d))) ?? '',
    status,
    qualification,
    reason,
    nextStep: nextStep.trim(),
  };
}
