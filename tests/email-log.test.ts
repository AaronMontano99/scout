import { describe, expect, it } from 'vitest';
import { buildEmailLogRow, type EmailLogInput } from '@/domain/email-log';

const draft = (overrides: Partial<NonNullable<EmailLogInput['latestDraft']>> = {}): NonNullable<EmailLogInput['latestDraft']> => ({
  createdAt: '2026-09-24T16:00:00.000Z',
  subject: 'Jordan, quick question',
  contactName: 'Jordan Hale',
  priority: 'MEDIUM',
  recommendation: 'send',
  skipReason: '',
  recommendationReason: '',
  ...overrides,
});

function row(overrides: Partial<EmailLogInput>) {
  return buildEmailLogRow({
    accountId: 'a1',
    company: 'Acme Test Labs',
    latestDraft: draft(),
    emails: [],
    anyMeetingBooked: false,
    hotList: null,
    lastCheck: null,
    ...overrides,
  });
}

const sent = { outcome: 'email_sent', occurredAt: '2026-09-24T17:00:00.000Z', contactName: 'Jordan Hale', crmNotes: [], meetingBooked: false };
const reply = { outcome: 'email_reply', occurredAt: '2026-09-25T17:00:00.000Z', contactName: 'Jordan Hale', crmNotes: [], meetingBooked: false };

describe('email log', () => {
  it('tracks where the thread stands', () => {
    expect(row({}).status).toBe('drafted');
    expect(row({ emails: [sent] }).status).toBe('awaiting_reply');
    expect(row({ emails: [sent, reply] }).status).toBe('replied');
    expect(row({ emails: [sent, reply], anyMeetingBooked: true }).status).toBe('meeting_booked');
    expect(row({ latestDraft: draft({ recommendation: 'call_first', recommendationReason: 'Contact left; call the main line.' }) })).toMatchObject({
      status: 'call_first',
      nextStep: 'Contact left; call the main line.',
    });
    expect(row({ latestDraft: draft({ priority: 'SKIP', skipReason: 'No reason to engage.' }) }).status).toBe('skipped');
  });

  it('a newer draft after a sent email keeps the thread as awaiting reply', () => {
    const later = draft({ createdAt: '2026-09-26T16:00:00.000Z' });
    expect(row({ emails: [sent], latestDraft: later }).status).toBe('awaiting_reply');
    expect(row({ emails: [sent], latestDraft: later }).lastSentAt).toBe(sent.occurredAt);
  });

  it('shows qualified IN / OUT / not yet with the reason', () => {
    const hot = { stage: 'developing' as const, whyQualified: 'Small IT team, stretched', closeReason: '', nextQuestion: 'Who owns support today?', nextAction: 'call', nextTouchDate: '2026-09-29' };
    expect(row({ hotList: hot })).toMatchObject({ qualification: 'in', reason: 'Small IT team, stretched', nextStep: 'call by 2026-09-29: Who owns support today?' });
    expect(row({ hotList: { ...hot, stage: 'closed', closeReason: 'Centralized at corporate' } })).toMatchObject({ qualification: 'out', reason: 'Centralized at corporate' });
    expect(row({ lastCheck: { decision: 'not_qualified', reason: 'Only a 2024 note, no current trigger' } })).toMatchObject({ qualification: 'not_yet' });
    expect(row({ lastCheck: { decision: 'close', reason: 'Below ICP' } }).qualification).toBe('out');
    expect(row({}).qualification).toBe('unassessed');
  });
});
