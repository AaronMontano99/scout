import { describe, expect, it } from 'vitest';
import * as fx from '@/demo/fixtures';
import { getFunnel, getListRows, getRoleReach, getCompetitorMemory } from '@/demo';

// Demo mode is what the founder shows in every sales demo (product spec
// §49-50) — a dangling reference here means a broken screen mid-demo.
// Cheap to catch with a referential-integrity sweep.

describe('demo fixture referential integrity', () => {
  const accountIds = new Set(fx.DEMO_ACCOUNTS.map((a) => a.id));
  const contactIds = new Set(fx.DEMO_CONTACTS.map((c) => c.id));
  const listIds = new Set(fx.DEMO_TARGET_LISTS.map((l) => l.id));

  it('every target list item references a real account and list', () => {
    for (const item of fx.DEMO_TARGET_LIST_ITEMS) {
      expect(accountIds.has(item.accountId), `item ${item.id} -> account ${item.accountId}`).toBe(true);
      expect(listIds.has(item.targetListId), `item ${item.id} -> list ${item.targetListId}`).toBe(true);
    }
  });

  it('every contact references a real account', () => {
    for (const c of fx.DEMO_CONTACTS) {
      expect(accountIds.has(c.accountId), `contact ${c.id} -> account ${c.accountId}`).toBe(true);
    }
  });

  it('every account-contact relationship references real account + contact', () => {
    for (const rel of fx.DEMO_ACCOUNT_CONTACT_RELATIONSHIPS) {
      expect(accountIds.has(rel.accountId)).toBe(true);
      expect(contactIds.has(rel.contactId), `relationship ${rel.id} -> contact ${rel.contactId}`).toBe(true);
    }
  });

  it('every knowledge item references a real account', () => {
    for (const k of fx.DEMO_KNOWLEDGE_ITEMS) {
      expect(accountIds.has(k.accountId), `knowledge item ${k.id} -> account ${k.accountId}`).toBe(true);
    }
  });

  it('every call outcome references a real account and (if set) target list item', () => {
    const itemIds = new Set(fx.DEMO_TARGET_LIST_ITEMS.map((i) => i.id));
    for (const o of fx.DEMO_CALL_OUTCOMES) {
      expect(accountIds.has(o.accountId)).toBe(true);
      if (o.targetListItemId) {
        expect(itemIds.has(o.targetListItemId), `outcome ${o.id} -> item ${o.targetListItemId}`).toBe(true);
      }
    }
  });

  it('the post-call note references a real call outcome', () => {
    const outcomeIds = new Set(fx.DEMO_CALL_OUTCOMES.map((o) => o.id));
    expect(outcomeIds.has(fx.DEMO_POST_CALL_NOTE.callOutcomeId)).toBe(true);
  });

  it('every account score references a real account', () => {
    for (const s of fx.DEMO_ACCOUNT_SCORES) {
      expect(accountIds.has(s.accountId), `score ${s.id} -> account ${s.accountId}`).toBe(true);
    }
  });

  it('every analytics event with an account/list reference points to something real', () => {
    for (const e of fx.DEMO_ANALYTICS_EVENTS) {
      if (e.accountId) expect(accountIds.has(e.accountId), `event ${e.id} -> account ${e.accountId}`).toBe(true);
      if (e.targetListId) expect(listIds.has(e.targetListId), `event ${e.id} -> list ${e.targetListId}`).toBe(true);
    }
  });
});

describe('demo accessor layer produces sane view models', () => {
  it('Construction list rows include the pinned, worked, and low-data scenarios', () => {
    const rows = getListRows('demo-list-construction');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((r) => r.pinned)).toBe(true);
    expect(rows.some((r) => r.status === 'worked')).toBe(true);
    expect(rows.some((r) => r.priorityLabel === 'limited_data' || r.priorityLabel === 'lower_confidence')).toBe(
      true
    );
  });

  it('funnel and role-reach compute without throwing and have real denominators', () => {
    const funnel = getFunnel();
    expect(funnel.callsAttempted).toBeGreaterThan(0);
    const reach = getRoleReach();
    expect(reach.totalCalls).toBe(fx.DEMO_CALL_OUTCOMES.length);
  });

  it('competitor memory aggregates across accounts, scoped correctly', () => {
    const memory = getCompetitorMemory();
    const secureGuard = memory.find((m) => m.competitor === 'SecureGuard Systems');
    expect(secureGuard).toBeDefined();
    expect(secureGuard!.items.length).toBeGreaterThanOrEqual(3);
  });
});

// Substitute for the missing Phase 3.5 live-data validation (see
// docs/PHASE_3_5_STATUS.md) — deliberately extreme fixture data
// standing in for messy real research output, locked in as a
// regression test so a future refactor can't quietly regress the UI's
// tolerance for edge cases back to only handling polished demo data.
describe('data stress-test fixtures (product spec §12, §76)', () => {
  it('one account carries 10 sources — tests a long Sources list', () => {
    const findings = fx.DEMO_RESEARCH_FINDINGS.filter((f) => f.accountId === fx.ACC_STRESS_LONG_NAME);
    expect(findings).toHaveLength(10);
  });

  it('one account carries 6 stakeholders across every certainty tier', () => {
    const relationships = fx.DEMO_ACCOUNT_CONTACT_RELATIONSHIPS.filter(
      (r) => r.accountId === fx.ACC_STRESS_MANY_PEOPLE
    );
    expect(relationships).toHaveLength(6);
    const certainties = new Set(relationships.map((r) => r.certaintyType));
    expect(certainties.has('KNOWN')).toBe(true);
    expect(certainties.has('INFERRED')).toBe(true);
    expect(certainties.has('SUGGESTED')).toBe(true);
  });

  it('one contact has a null title — tests missing-data rendering, not just missing rows', () => {
    const contact = fx.DEMO_CONTACTS.find((c) => c.id === 'demo-contact-stress-5');
    expect(contact?.title).toBeNull();
  });

  it('the zero-data account has genuinely zero contacts, findings, and knowledge items', () => {
    expect(fx.DEMO_CONTACTS.filter((c) => c.accountId === fx.ACC_STRESS_ZERO_DATA)).toHaveLength(0);
    expect(fx.DEMO_RESEARCH_FINDINGS.filter((f) => f.accountId === fx.ACC_STRESS_ZERO_DATA)).toHaveLength(0);
    expect(fx.DEMO_KNOWLEDGE_ITEMS.filter((k) => k.accountId === fx.ACC_STRESS_ZERO_DATA)).toHaveLength(0);
    expect(fx.DEMO_ACCOUNT_BRIEFS[fx.ACC_STRESS_ZERO_DATA]).toBeUndefined();
  });

  it('the failed-research account has researchStatus=failed and no brief', () => {
    const account = fx.DEMO_ACCOUNTS.find((a) => a.id === fx.ACC_STRESS_FAILED);
    expect(account?.researchStatus).toBe('failed');
    expect(fx.DEMO_ACCOUNT_BRIEFS[fx.ACC_STRESS_FAILED]).toBeUndefined();
  });

  it('the long-name account genuinely stresses name/title length', () => {
    const account = fx.DEMO_ACCOUNTS.find((a) => a.id === fx.ACC_STRESS_LONG_NAME);
    expect(account?.name.length).toBeGreaterThan(60);
    const contact = fx.DEMO_CONTACTS.find((c) => c.id === 'demo-contact-stress-long-title');
    expect(contact?.title?.length).toBeGreaterThan(50);
  });

  it('the stress-test list is clearly labeled as fixture QA, not a real prospecting list', () => {
    const list = fx.DEMO_TARGET_LISTS.find((l) => l.id === 'demo-list-stress-test');
    expect(list?.description).toMatch(/not a real prospecting list/i);
  });
});
