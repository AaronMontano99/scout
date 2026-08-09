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
import { computeFunnel, computeRoleReach, computeActivityCounts } from '@/domain/analytics';
import { summarizeResearchProgress, isUsable } from '@/domain/research-status';
import { describeFreshness } from '@/domain/freshness';
import * as fx from './fixtures';
import type { AccountIdentityStatus, PriorityLabel } from '@/types/product';

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
  const accountsById = new Map(fx.DEMO_ACCOUNTS.map((a) => [a.id, a]));
  const researchStatuses = items
    .map((i) => accountsById.get(i.accountId)?.researchStatus)
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  const researchProgress = summarizeResearchProgress(researchStatuses);
  return { list, progress, researchProgress };
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
  return relationships
    .map((rel) => {
      const contact = fx.DEMO_CONTACTS.find((c) => c.id === rel.contactId)!;
      return {
        contact,
        relationship: rel,
        freshnessLabel: describeFreshness('contact_employment', contact.lastVerifiedAt),
      };
    })
    .sort((a, b) => Number(b.relationship.isCurrent) - Number(a.relationship.isCurrent)); // current relationships first, historical after
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

export function getActivityCounts() {
  return computeActivityCounts(fx.DEMO_ANALYTICS_EVENTS);
}

/**
 * Per-Target-List rollup — product spec §32. Combines list progress
 * (never-expiring rep memory) with call/meeting/selling-situation
 * counts scoped to that list's accounts, so each list reads as its own
 * operational workspace rather than a filtered view of one global feed.
 */
export function getListPerformance(listId: string) {
  const overview = getTargetListOverview(listId);
  if (!overview) return null;
  const accountIds = new Set(itemsForList(listId).map((i) => i.accountId));
  const outcomes = fx.DEMO_CALL_OUTCOMES.filter((o) => accountIds.has(o.accountId));
  const meetings = outcomes.filter((o) => o.outcomeType === 'meeting_booked').length;
  const sellingSituations = fx.DEMO_SELLING_SITUATIONS.filter((s) => accountIds.has(s.accountId)).length;
  return {
    list: overview.list,
    progress: overview.progress,
    calls: outcomes.length,
    meetings,
    sellingSituations,
  };
}

/**
 * Founder Operations Console research diagnostics — RESEARCH_OPERATIONS.md's
 * requirement that the founder can see queue/failure state without a
 * manual database query. Real computation over every demo account
 * (across all lists, since research state lives on the account, not
 * the list) — not illustrative numbers.
 */
export function getResearchDiagnostics() {
  const statuses = fx.DEMO_ACCOUNTS.map((a) => a.researchStatus);
  const summary = summarizeResearchProgress(statuses);
  const needsAttention = fx.DEMO_ACCOUNTS.filter((a) => !isUsable(a.researchStatus) || a.researchStatus === 'needs_review')
    .map((a) => ({ id: a.id, name: a.name, researchStatus: a.researchStatus }));
  return { summary, totalAccounts: fx.DEMO_ACCOUNTS.length, needsAttention };
}

const IDENTITY_WARNING_LABEL: Partial<Record<AccountIdentityStatus, string>> = {
  review_recommended: 'Company match may be inaccurate. Review recommended.',
  lower_confidence: 'Company match confidence is moderate — quick verification recommended.',
};

/**
 * Identity-match warning driven directly by Account.identityStatus
 * (see DATA_MODEL.md Phase 3 Additions) — replaces the Phase 2
 * single-account DEMO_AMBIGUOUS_MATCH special case with something that
 * actually reads the schema field, so any account can carry this
 * warning, not just one hardcoded example.
 */
export function getIdentityWarning(accountId: string) {
  const account = getAccount(accountId);
  if (!account) return null;
  const label = IDENTITY_WARNING_LABEL[account.identityStatus];
  if (!label) return null;
  const details = fx.DEMO_IDENTITY_MATCH_DETAILS[accountId];
  return { warning: label, ...details };
}

export function describeCompanyFreshness(accountId: string) {
  const account = getAccount(accountId);
  return describeFreshness('company_description', account?.updatedAt ?? null);
}

export function describeNewsFreshness(accountId: string) {
  const findings = getResearchFindingsForAccount(accountId);
  const mostRecent = findings.sort((a, b) => b.retrievedAt.localeCompare(a.retrievedAt))[0];
  return describeFreshness('news', mostRecent?.retrievedAt ?? null);
}

export { DEMO_ORGANIZATION, DEMO_REP } from './fixtures';
