import type { AnalyticsEvent, AnalyticsEventType, CallOutcome, CallOutcomeType } from '@/types/product';

/**
 * Prospecting analytics — see docs/PROSPECTING_ANALYTICS.md. Every
 * rate is computed from real events with an explicit, visible
 * denominator (product spec §55: "every displayed rate must have a
 * clear denominator. No fake metrics."). Rates are never pre-aggregated
 * counters that can drift from the underlying events — see
 * DATA_MODEL.md's rationale for AnalyticsEvent being event-sourced.
 */

export interface Rate {
  numerator: number;
  denominator: number;
  /** null, not 0, when the denominator is 0 — a rate with no attempts is undefined, not zero. */
  rate: number | null;
}

function computeRate(numerator: number, denominator: number): Rate {
  return {
    numerator,
    denominator,
    rate: denominator === 0 ? null : numerator / denominator,
  };
}

function countByType(events: AnalyticsEvent[], type: AnalyticsEventType): number {
  return events.filter((e) => e.eventType === type).length;
}

/**
 * Generic per-type tally — powers the rep-facing "what did I do"
 * activity summary (product spec §28) without needing a bespoke
 * function per metric. Every count here traces to real events, same
 * as the funnel above.
 */
export function computeActivityCounts(events: AnalyticsEvent[]): Record<AnalyticsEventType, number> {
  const counts: Partial<Record<AnalyticsEventType, number>> = {};
  for (const e of events) {
    counts[e.eventType] = (counts[e.eventType] ?? 0) + 1;
  }
  const ALL_TYPES: AnalyticsEventType[] = [
    'call_attempted', 'conversation', 'target_conversation', 'meeting_booked',
    'selling_situation_created', 'opportunity_created', 'email_drafted',
    'email_sent', 'crm_note_created', 'contact_added', 'account_worked',
  ];
  return Object.fromEntries(ALL_TYPES.map((t) => [t, counts[t] ?? 0])) as Record<AnalyticsEventType, number>;
}

export interface ProspectingFunnel {
  callsAttempted: number;
  conversations: number;
  targetConversations: number;
  meetingsBooked: number;
  sellingSituationsCreated: number;
  opportunitiesCreated: number;

  pickupRate: Rate; // conversations / calls attempted
  callToMeetingRate: Rate; // meetings / calls attempted
  conversationToMeetingRate: Rate; // meetings / conversations
  targetContactToMeetingRate: Rate; // meetings / target conversations
  meetingToSellingSituationRate: Rate; // selling situations / meetings
  sellingSituationToOpportunityRate: Rate; // opportunities / selling situations
}

export function computeFunnel(events: AnalyticsEvent[]): ProspectingFunnel {
  const callsAttempted = countByType(events, 'call_attempted');
  const conversations = countByType(events, 'conversation');
  const targetConversations = countByType(events, 'target_conversation');
  const meetingsBooked = countByType(events, 'meeting_booked');
  const sellingSituationsCreated = countByType(events, 'selling_situation_created');
  const opportunitiesCreated = countByType(events, 'opportunity_created');

  return {
    callsAttempted,
    conversations,
    targetConversations,
    meetingsBooked,
    sellingSituationsCreated,
    opportunitiesCreated,
    pickupRate: computeRate(conversations, callsAttempted),
    callToMeetingRate: computeRate(meetingsBooked, callsAttempted),
    conversationToMeetingRate: computeRate(meetingsBooked, conversations),
    targetContactToMeetingRate: computeRate(meetingsBooked, targetConversations),
    meetingToSellingSituationRate: computeRate(sellingSituationsCreated, meetingsBooked),
    sellingSituationToOpportunityRate: computeRate(opportunitiesCreated, sellingSituationsCreated),
  };
}

/**
 * Role-reach breakdown — product spec §54: "who am I actually
 * reaching?" Counts observed call outcomes by role, each with the
 * total call count as its denominator so percentages are always
 * interpretable.
 */
export interface RoleReachBreakdown {
  totalCalls: number;
  byOutcome: Partial<Record<CallOutcomeType, Rate>>;
  decisionMakerReachRate: Rate;
  championOrInfluencerReachRate: Rate;
  gatekeeperRate: Rate;
  noAnswerRate: Rate;
}

const DECISION_MAKER_OUTCOMES: CallOutcomeType[] = ['decision_maker', 'other_executive'];
const CHAMPION_INFLUENCER_OUTCOMES: CallOutcomeType[] = ['champion', 'influencer'];

export function computeRoleReach(outcomes: CallOutcome[]): RoleReachBreakdown {
  const totalCalls = outcomes.length;
  const byOutcome: Partial<Record<CallOutcomeType, Rate>> = {};

  const counts = new Map<CallOutcomeType, number>();
  for (const o of outcomes) {
    counts.set(o.outcomeType, (counts.get(o.outcomeType) ?? 0) + 1);
  }
  for (const [type, count] of counts) {
    byOutcome[type] = computeRate(count, totalCalls);
  }

  const sumFor = (types: CallOutcomeType[]) =>
    outcomes.filter((o) => types.includes(o.outcomeType)).length;

  return {
    totalCalls,
    byOutcome,
    decisionMakerReachRate: computeRate(sumFor(DECISION_MAKER_OUTCOMES), totalCalls),
    championOrInfluencerReachRate: computeRate(sumFor(CHAMPION_INFLUENCER_OUTCOMES), totalCalls),
    gatekeeperRate: computeRate(sumFor(['gatekeeper']), totalCalls),
    noAnswerRate: computeRate(sumFor(['no_answer']), totalCalls),
  };
}
