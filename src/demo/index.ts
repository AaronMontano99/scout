/**
 * Demo Mode accessor layer — assembles fixture data into the view
 * models the UI needs (Target List workspace, Call-Ready Brief,
 * Account Brain, post-call flow). This is the boundary a real
 * (database-backed) implementation would replace — UI components
 * should import from here, never from fixtures.ts directly, so
 * swapping demo mode for live data later touches this file, not every
 * component. See docs/DEMO.md.
 */
import { calculateListProgress, rankSuggestedCalls, toPriorityLabel } from '@/domain/target-lists';
import { computeFunnel, computeRoleReach } from '@/domain/analytics';
import * as fx from './fixtures';
import type { PriorityLabel } from '@/types/product';

export function getTargetLists() {
  return fx.DEMO_TARGET_LISTS;
}

export function getTargetList(id: string) {
  return fx.DEMO_TARGET_LISTS.find((l) => l.id === id) ?? null;
}

function itemsForList(listId: string) {
  return fx.DEMO_TARGET_LIST_ITEMS.filter((i) => i.targetListId === listId);
}

function scoreMap() {
  return new Map(fx.DEMO_ACCOUNT_SCORES.map((s) => [s.accountId, s]));
}

export function getTargetListOverview(listId: string) {
  const list = getTargetList(listId);
  if (!list) return null;
  const items = itemsForList(listId);
  const progress = calculateListProgress(items);
  return { list, progress };
}

export interface ListRow {
  account: (typeof fx.DEMO_ACCOUNTS)[number];
  itemId: string;
  status: (typeof fx.DEMO_TARGET_LIST_ITEMS)[number]['status'];
  pinned: boolean;
  priorityLabel: PriorityLabel;
  lastOutcome: (typeof fx.DEMO_CALL_OUTCOMES)[number] | null;
}

export function getListRows(listId: string): ListRow[] {
  const items = itemsForList(listId);
  const scores = scoreMap();
  const accountsById = new Map(fx.DEMO_ACCOUNTS.map((a) => [a.id, a]));

  return items
    .map((item) => {
      const account = accountsById.get(item.accountId);
      if (!account) return null;
      const outcomes = fx.DEMO_CALL_OUTCOMES.filter((o) => o.accountId === item.accountId).sort(
        (a, b) => b.occurredAt.localeCompare(a.occurredAt)
      );
      return {
        account,
        itemId: item.id,
        status: item.status,
        pinned: item.pinned,
        priorityLabel: toPriorityLabel(scores.get(item.accountId)),
        lastOutcome: outcomes[0] ?? null,
      };
    })
    .filter((r): r is ListRow => r !== null);
}

export function getSuggestedCalls(listId: string, limit = 50) {
  const items = itemsForList(listId);
  return rankSuggestedCalls(fx.DEMO_ACCOUNTS, items, scoreMap(), limit);
}

export function getAccount(accountId: string) {
  return fx.DEMO_ACCOUNTS.find((a) => a.id === accountId) ?? null;
}

export function getAccountBrief(accountId: string) {
  return fx.DEMO_ACCOUNT_BRIEFS[accountId] ?? null;
}

export function getContactsForAccount(accountId: string) {
  const relationships = fx.DEMO_ACCOUNT_CONTACT_RELATIONSHIPS.filter((r) => r.accountId === accountId);
  return relationships.map((rel) => {
    const contact = fx.DEMO_CONTACTS.find((c) => c.id === rel.contactId)!;
    return { contact, relationship: rel };
  });
}

export function getKnowledgeItemsForAccount(accountId: string) {
  return fx.DEMO_KNOWLEDGE_ITEMS.filter((k) => k.accountId === accountId).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
}

export function getResearchFindingsForAccount(accountId: string) {
  return fx.DEMO_RESEARCH_FINDINGS.filter((r) => r.accountId === accountId);
}

export function getAccountScore(accountId: string) {
  return fx.DEMO_ACCOUNT_SCORES.find((s) => s.accountId === accountId) ?? null;
}

export function getCallOutcomesForAccount(accountId: string) {
  return fx.DEMO_CALL_OUTCOMES.filter((o) => o.accountId === accountId).sort((a, b) =>
    b.occurredAt.localeCompare(a.occurredAt)
  );
}

export function getPostCallNoteForOutcome(callOutcomeId: string) {
  return fx.DEMO_POST_CALL_NOTE.callOutcomeId === callOutcomeId ? fx.DEMO_POST_CALL_NOTE : null;
}

export function getSellingSituationsForAccount(accountId: string) {
  return fx.DEMO_SELLING_SITUATIONS.filter((s) => s.accountId === accountId);
}

export function getSellerStyle(membershipId: string) {
  return fx.DEMO_SELLER_STYLE.membershipId === membershipId ? fx.DEMO_SELLER_STYLE : null;
}

/**
 * "What has your team learned about this incumbent" — see
 * DATA_MODEL.md's "Competitor memory is a query, not a table."
 * Aggregates KnowledgeItems of type incumbent_vendor across accounts,
 * scoped to this org's fixture data only (in a real implementation:
 * scoped to organization_id, never cross-tenant).
 */
export function getCompetitorMemory() {
  const incumbentItems = fx.DEMO_KNOWLEDGE_ITEMS.filter((k) => k.type === 'incumbent_vendor');
  const byCompetitor = new Map<string, typeof incumbentItems>();
  for (const item of incumbentItems) {
    const name = (item.structuredValue?.competitor_name as string) ?? 'Unknown';
    byCompetitor.set(name, [...(byCompetitor.get(name) ?? []), item]);
  }
  return [...byCompetitor.entries()].map(([competitor, items]) => ({ competitor, items }));
}

export function getFunnel() {
  return computeFunnel(fx.DEMO_ANALYTICS_EVENTS);
}

export function getRoleReach() {
  return computeRoleReach(fx.DEMO_CALL_OUTCOMES);
}

export function getAmbiguousMatchWarning(accountId: string) {
  return fx.DEMO_AMBIGUOUS_MATCH.accountId === accountId ? fx.DEMO_AMBIGUOUS_MATCH : null;
}

export { DEMO_ORGANIZATION, DEMO_REP } from './fixtures';
