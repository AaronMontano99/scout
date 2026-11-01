/**
 * One-tap touch logging: what each outcome means for the funnel, so the
 * numbers stay consistent however the touch was logged.
 */
import type { ActivityChannel } from './day-summary';

export type QuickOutcome =
  | 'no_answer'
  | 'voicemail'
  | 'gatekeeper'
  | 'general_staff'
  | 'decision_maker'
  | 'not_interested'
  | 'meeting_booked'
  | 'email_sent'
  | 'email_reply';

export const OUTCOME_LABEL: Record<QuickOutcome, string> = {
  no_answer: 'No answer',
  voicemail: 'Left VM',
  gatekeeper: 'Gatekeeper',
  general_staff: 'Staff',
  decision_maker: 'Decision maker',
  not_interested: 'Not interested',
  meeting_booked: 'Meeting booked',
  email_sent: 'Sent',
  email_reply: 'Reply',
};

export const OUTCOMES_BY_CHANNEL: Record<ActivityChannel, QuickOutcome[]> = {
  call: ['no_answer', 'voicemail', 'gatekeeper', 'general_staff', 'decision_maker', 'not_interested', 'meeting_booked'],
  email: ['email_sent', 'email_reply', 'meeting_booked'],
  walk_in: ['gatekeeper', 'general_staff', 'decision_maker', 'not_interested', 'meeting_booked'],
  linkedin: ['email_sent', 'email_reply', 'meeting_booked'],
};

export interface OutcomeFlags {
  connected: boolean;
  decisionMaker: boolean;
  relevant: boolean;
  meetingAsked: boolean;
  meetingBooked: boolean;
}

const NONE: OutcomeFlags = { connected: false, decisionMaker: false, relevant: false, meetingAsked: false, meetingBooked: false };

export function outcomeFlags(outcome: QuickOutcome): OutcomeFlags {
  switch (outcome) {
    case 'gatekeeper':
    case 'general_staff':
      return { ...NONE, connected: true };
    case 'decision_maker':
    case 'not_interested':
      return { ...NONE, connected: true, decisionMaker: true };
    case 'meeting_booked':
      return { connected: true, decisionMaker: true, relevant: true, meetingAsked: true, meetingBooked: true };
    case 'email_reply':
      return { ...NONE, connected: true };
    default:
      return NONE;
  }
}

const CHANNEL_WORD: Record<ActivityChannel, string> = { call: 'call', email: 'email', walk_in: 'walk-in', linkedin: 'LinkedIn' };

export function touchLine(channel: ActivityChannel, outcome: QuickOutcome): string {
  return `${CHANNEL_WORD[channel]}: ${OUTCOME_LABEL[outcome].toLowerCase()}`;
}
