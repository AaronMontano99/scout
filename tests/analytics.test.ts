import { describe, expect, it } from 'vitest';
import { computeFunnel, computeRoleReach } from '@/domain/analytics';
import type { AnalyticsEvent, AnalyticsEventType, CallOutcome, CallOutcomeType } from '@/types/product';

function ev(eventType: AnalyticsEventType): AnalyticsEvent {
  return {
    id: crypto.randomUUID(),
    organizationId: 'org-1',
    eventType,
    accountId: null,
    targetListId: null,
    contactId: null,
    membershipId: null,
    occurredAt: '2026-08-01T00:00:00Z',
  };
}

describe('computeFunnel', () => {
  it('returns null rate (not 0) when the denominator is zero', () => {
    const funnel = computeFunnel([]);
    expect(funnel.pickupRate.rate).toBeNull();
    expect(funnel.pickupRate.denominator).toBe(0);
  });

  it('computes correct rates with real denominators', () => {
    const events = [
      ...Array(10).fill(0).map(() => ev('call_attempted')),
      ...Array(4).fill(0).map(() => ev('conversation')),
      ...Array(2).fill(0).map(() => ev('target_conversation')),
      ev('meeting_booked'),
      ev('selling_situation_created'),
    ];
    const funnel = computeFunnel(events);
    expect(funnel.callsAttempted).toBe(10);
    expect(funnel.conversations).toBe(4);
    expect(funnel.pickupRate).toEqual({ numerator: 4, denominator: 10, rate: 0.4 });
    expect(funnel.callToMeetingRate).toEqual({ numerator: 1, denominator: 10, rate: 0.1 });
    expect(funnel.conversationToMeetingRate.rate).toBeCloseTo(0.25);
    // 0 opportunities / 1 selling situation
    expect(funnel.sellingSituationToOpportunityRate).toEqual({ numerator: 0, denominator: 1, rate: 0 });
  });
});

function outcome(outcomeType: CallOutcomeType): CallOutcome {
  return {
    id: crypto.randomUUID(),
    organizationId: 'org-1',
    accountId: 'acc-1',
    targetListItemId: null,
    contactId: null,
    membershipId: 'mem-1',
    outcomeType,
    contactRoleObserved: null,
    occurredAt: '2026-08-01T00:00:00Z',
  };
}

describe('computeRoleReach', () => {
  it('every rate denominator equals total calls', () => {
    const outcomes: CallOutcome[] = [
      ...Array(25).fill(0).map(() => outcome('gatekeeper')),
      ...Array(5).fill(0).map(() => outcome('decision_maker')),
      ...Array(5).fill(0).map(() => outcome('champion')),
      ...Array(5).fill(0).map(() => outcome('influencer')),
      ...Array(5).fill(0).map(() => outcome('general_staff')),
      outcome('other_executive'),
      ...Array(4).fill(0).map(() => outcome('no_answer')),
    ];
    const reach = computeRoleReach(outcomes);
    expect(reach.totalCalls).toBe(50);
    expect(reach.gatekeeperRate).toEqual({ numerator: 25, denominator: 50, rate: 0.5 });
    expect(reach.decisionMakerReachRate.numerator).toBe(6); // decision_maker + other_executive
    expect(reach.championOrInfluencerReachRate.numerator).toBe(10);
    expect(reach.noAnswerRate).toEqual({ numerator: 4, denominator: 50, rate: 0.08 });
    for (const rate of Object.values(reach.byOutcome)) {
      expect(rate?.denominator).toBe(50);
    }
  });

  it('handles zero calls without dividing by zero', () => {
    const reach = computeRoleReach([]);
    expect(reach.gatekeeperRate.rate).toBeNull();
  });
});
