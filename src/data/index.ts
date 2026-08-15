/**
 * Real (SQLite-backed) accessor layer for local-first mode — the "your
 * own data" counterpart to src/demo/index.ts's fictional fixtures.
 * Deliberately mirrors src/demo/index.ts's function names/shapes so
 * src/app/app/** pages are near-identical copies of src/app/demo/**
 * pages, just importing from here instead. See docs/LOCAL_MODE.md.
 *
 * No AI, no live research provider — accounts are entered manually
 * (see the mutation functions at the bottom) and this layer only ever
 * reflects what was actually entered, never fabricated content.
 */
import { getDb, type SqlValue } from '@/db/client';
import {
  calculateListProgress,
  rankSuggestedCalls,
  toPriorityLabel,
  comparePinnedThenPriority,
  type SuggestedCallEntry,
} from '@/domain/target-lists';
import { computeFunnel, computeRoleReach, computeActivityCounts } from '@/domain/analytics';
import { summarizeResearchProgress, isUsable } from '@/domain/research-status';
import { describeFreshness } from '@/domain/freshness';
import {
  normalizeCompanyName,
  normalizeDomain,
  resolveAccount,
  type ResolutionCandidate,
  type MatchResult,
} from '@/domain/entity-resolution';
import type { CertaintyType } from '@/types/evidence';
import type {
  Account,
  AccountContactRelationship,
  AccountRelationshipStatus,
  AccountScore,
  AnalyticsEventType,
  BuyingRole,
  CallOutcome,
  Contact,
  KnowledgeItem,
  KnowledgeItemType,
  PriorityLabel,
  ResearchFinding,
  TargetList,
  TargetListItem,
} from '@/types/product';
import {
  LOCAL_ORG_ID,
  mapAccount,
  mapAccountContactRelationship,
  mapAccountScore,
  mapAnalyticsEvent,
  mapCallOutcome,
  mapContact,
  mapKnowledgeItem,
  mapPostCallNote,
  mapResearchFinding,
  mapSellingSituation,
  mapTargetList,
  mapTargetListItem,
} from './rows';

function uuid(): string {
  return crypto.randomUUID();
}

function nowIso(): string {
  return new Date().toISOString();
}

function row(sql: string, params: SqlValue[] = []): Record<string, unknown> | undefined {
  return getDb().prepare(sql).get(...params);
}

function rows(sql: string, params: SqlValue[] = []): Record<string, unknown>[] {
  return getDb().prepare(sql).all(...params);
}

// === Target Lists ========================================================

export function getTargetLists(): TargetList[] {
  return rows('SELECT * FROM target_lists ORDER BY created_at ASC').map(mapTargetList);
}

export function getTargetList(id: string): TargetList | null {
  const r = row('SELECT * FROM target_lists WHERE id = ?', [id]);
  return r ? mapTargetList(r) : null;
}

function itemsForList(listId: string): TargetListItem[] {
  return rows('SELECT * FROM target_list_items WHERE target_list_id = ?', [listId]).map(mapTargetListItem);
}

function scoreMap(): Map<string, AccountScore> {
  const scores = rows('SELECT * FROM account_scores').map((r) => {
    const components = rows('SELECT * FROM account_score_components WHERE account_score_id = ?', [r.id as string]);
    return mapAccountScore(r, components);
  });
  return new Map(scores.map((s) => [s.accountId, s]));
}

export function getTargetListOverview(listId: string) {
  const list = getTargetList(listId);
  if (!list) return null;
  const items = itemsForList(listId);
  const progress = calculateListProgress(items);
  const researchStatuses = items
    .map((i) => getAccount(i.accountId)?.researchStatus)
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  const researchProgress = summarizeResearchProgress(researchStatuses);
  return { list, progress, researchProgress };
}

export interface ListRow {
  account: Account;
  itemId: string;
  status: TargetListItem['status'];
  pinned: boolean;
  priorityLabel: PriorityLabel;
  lastOutcome: CallOutcome | null;
  sourcesCount: number;
}

export function getListRows(listId: string): ListRow[] {
  const items = itemsForList(listId);
  const scores = scoreMap();

  return items
    .map((item) => {
      const account = getAccount(item.accountId);
      if (!account) return null;
      const outcomes = getCallOutcomesForAccount(item.accountId);
      return {
        account,
        itemId: item.id,
        status: item.status,
        pinned: item.pinned,
        priorityLabel: toPriorityLabel(scores.get(item.accountId)),
        lastOutcome: outcomes[0] ?? null,
        sourcesCount: getResearchFindingsForAccount(item.accountId).length,
      };
    })
    .filter((r): r is ListRow => r !== null);
}

export function getSuggestedCalls(listId: string, limit = 50) {
  const items = itemsForList(listId);
  const accountIds = items.map((i) => i.accountId);
  const accounts = accountIds.map((id) => getAccount(id)).filter((a): a is Account => a !== null);
  return rankSuggestedCalls(accounts, items, scoreMap(), limit);
}

// === Accounts =============================================================

export function getAccount(accountId: string): Account | null {
  const r = row('SELECT * FROM accounts WHERE id = ?', [accountId]);
  return r ? mapAccount(r) : null;
}

export interface AccountBrief {
  whatTheyDo: string;
  whatMatters: string[];
  talkingPoints: string[];
  talkTrack?: string;
  noStrongTrigger?: boolean;
}

/**
 * Honest, non-fabricated brief for a manually-entered account — no LLM
 * to generate narrative content from, so this only ever reflects what
 * was actually typed in, never a synthesized insight. See
 * docs/LOCAL_MODE.md.
 */
export function getAccountBrief(accountId: string): AccountBrief | null {
  const account = getAccount(accountId);
  if (!account) return null;

  const items = getKnowledgeItemsForAccount(accountId);

  // AI-synthesized summary/matters (see src/app/app/research/actions.ts's
  // synthesizeAccountSummary) take priority when present — they're
  // grounded in real fetched evidence, not fabricated. Always SUGGESTED
  // certainty; never silently upgraded. Only the current (non-superseded)
  // synthesis is used here — history stays intact in the full timeline.
  const current = items.filter((k) => k.verificationStatus === 'current');
  const aiSummary = current.find((k) => (k.structuredValue as { kind?: string } | null)?.kind === 'ai_company_summary');
  const aiMatters = current.filter((k) => (k.structuredValue as { kind?: string } | null)?.kind === 'ai_what_matters');

  const whatTheyDo =
    aiSummary?.content ??
    (account.industry
      ? `${account.industry}${account.employeeCountRange ? `, ${account.employeeCountRange} employees` : ''}.`
      : 'No description added yet — edit this account to add one, or run Research to fetch one.');

  const nonAiItems = current.filter((k) => !(k.structuredValue as { kind?: string } | null)?.kind);
  const whatMatters =
    aiMatters.length > 0
      ? aiMatters.slice(0, 5).map((k) => k.content)
      : nonAiItems.length > 0
        ? nonAiItems.slice(0, 5).map((k) => k.content)
        : ['No notes yet — add one below to start building a record of what matters here.'];

  // The rep's own generated call script IS the talk track — see
  // src/ai/seller-voice/, generated in the rep's saved SellerStyleProfile
  // voice, never independently invented (docs/CALL_READY_BRIEF.md).
  const talkTrack = getGeneratedCommunication(accountId, 'call_script')?.content;

  return {
    whatTheyDo,
    whatMatters,
    talkingPoints: ['Add notes below to build talking points here.'],
    ...(talkTrack ? { talkTrack } : {}),
  };
}

export function getContactsForAccount(accountId: string) {
  const relationships = rows('SELECT * FROM account_contact_relationships WHERE account_id = ?', [accountId]).map(
    mapAccountContactRelationship
  );
  return relationships
    .map((relationship) => {
      const contactRow = row('SELECT * FROM contacts WHERE id = ?', [relationship.contactId]);
      const contact = contactRow ? mapContact(contactRow) : null;
      if (!contact) return null;
      return {
        contact,
        relationship,
        freshnessLabel: describeFreshness('contact_employment', contact.lastVerifiedAt),
      };
    })
    .filter((c): c is { contact: Contact; relationship: AccountContactRelationship; freshnessLabel: string } => c !== null)
    .sort((a, b) => Number(b.relationship.isCurrent) - Number(a.relationship.isCurrent));
}

export function getKnowledgeItemsForAccount(accountId: string): KnowledgeItem[] {
  return rows('SELECT * FROM knowledge_items WHERE account_id = ? ORDER BY created_at DESC', [accountId]).map(
    mapKnowledgeItem
  );
}

export function getResearchFindingsForAccount(accountId: string): ResearchFinding[] {
  return rows('SELECT * FROM research_findings WHERE account_id = ?', [accountId]).map((r) => {
    const sourceRow = r.source_id ? row('SELECT * FROM sources WHERE id = ?', [r.source_id as string]) : undefined;
    return mapResearchFinding(r, (sourceRow?.name as string | undefined) ?? 'Unknown source');
  });
}

export function getCallOutcomesForAccount(accountId: string): CallOutcome[] {
  return rows('SELECT * FROM call_outcomes WHERE account_id = ? ORDER BY occurred_at DESC', [accountId]).map(
    mapCallOutcome
  );
}

export function getPostCallNoteForOutcome(callOutcomeId: string) {
  const r = row('SELECT * FROM post_call_notes WHERE call_outcome_id = ?', [callOutcomeId]);
  return r ? mapPostCallNote(r) : null;
}

export function getSellingSituationsForAccount(accountId: string) {
  return rows('SELECT * FROM selling_situations WHERE account_id = ?', [accountId]).map(mapSellingSituation);
}

/** "What has your team learned about this incumbent" — see src/demo/index.ts's equivalent. */
export function getCompetitorMemory() {
  const incumbentItems = rows("SELECT * FROM knowledge_items WHERE type = 'incumbent_vendor'").map(mapKnowledgeItem);
  const byCompetitor = new Map<string, KnowledgeItem[]>();
  for (const item of incumbentItems) {
    const name = (item.structuredValue?.competitor_name as string) ?? 'Unknown';
    byCompetitor.set(name, [...(byCompetitor.get(name) ?? []), item]);
  }
  return [...byCompetitor.entries()].map(([competitor, items]) => ({ competitor, items }));
}

const IDENTITY_WARNING_LABEL: Partial<Record<Account['identityStatus'], string>> = {
  review_recommended: 'Company match may be inaccurate. Review recommended.',
  lower_confidence: 'Company match confidence is moderate — quick verification recommended.',
};

export function getIdentityWarning(accountId: string) {
  const account = getAccount(accountId);
  if (!account) return null;
  const label = IDENTITY_WARNING_LABEL[account.identityStatus];
  if (!label) return null;
  return { warning: label };
}

export function describeCompanyFreshness(accountId: string) {
  const account = getAccount(accountId);
  return describeFreshness('company_description', account?.updatedAt ?? null);
}

export function describeNewsFreshness(accountId: string) {
  const findings = getResearchFindingsForAccount(accountId);
  const mostRecent = [...findings].sort((a, b) => b.retrievedAt.localeCompare(a.retrievedAt))[0];
  return describeFreshness('news', mostRecent?.retrievedAt ?? null);
}

// === Analytics =============================================================

export function getFunnel(since?: string) {
  const events = since
    ? rows('SELECT * FROM analytics_events WHERE occurred_at >= ?', [since])
    : rows('SELECT * FROM analytics_events');
  return computeFunnel(events.map(mapAnalyticsEvent));
}

export function getRoleReach(since?: string) {
  const outcomes = since
    ? rows('SELECT * FROM call_outcomes WHERE occurred_at >= ?', [since])
    : rows('SELECT * FROM call_outcomes');
  return computeRoleReach(outcomes.map(mapCallOutcome));
}

export function getActivityCounts(since?: string) {
  const events = since
    ? rows('SELECT * FROM analytics_events WHERE occurred_at >= ?', [since])
    : rows('SELECT * FROM analytics_events');
  return computeActivityCounts(events.map(mapAnalyticsEvent));
}

export interface RecentOutcomeRow {
  outcome: CallOutcome;
  accountName: string;
}

export function getRecentOutcomes(limit = 10, since?: string): RecentOutcomeRow[] {
  const sql = since
    ? 'SELECT * FROM call_outcomes WHERE occurred_at >= ? ORDER BY occurred_at DESC LIMIT ?'
    : 'SELECT * FROM call_outcomes ORDER BY occurred_at DESC LIMIT ?';
  const params = since ? [since, limit] : [limit];
  return rows(sql, params)
    .map(mapCallOutcome)
    .map((outcome) => ({ outcome, accountName: getAccount(outcome.accountId)?.name ?? 'Unknown account' }));
}

export function getListPerformance(listId: string) {
  const overview = getTargetListOverview(listId);
  if (!overview) return null;
  const accountIds = new Set(itemsForList(listId).map((i) => i.accountId));
  const outcomes = rows('SELECT * FROM call_outcomes').map(mapCallOutcome).filter((o) => accountIds.has(o.accountId));
  const meetings = outcomes.filter((o) => o.outcomeType === 'meeting_booked').length;
  const sellingSituations = rows('SELECT * FROM selling_situations')
    .map(mapSellingSituation)
    .filter((s) => accountIds.has(s.accountId)).length;
  return {
    list: overview.list,
    progress: overview.progress,
    calls: outcomes.length,
    meetings,
    sellingSituations,
  };
}

// === Mutations (manual data entry — see docs/LOCAL_MODE.md) ==============
// No CSV/AI-assisted import yet; this is the minimal real path to get
// your own accounts, contacts, and notes into Scout.

export function createAccount(input: {
  name: string;
  primaryDomain?: string;
  industry?: string;
  employeeCountRange?: string;
  relationshipStatus?: AccountRelationshipStatus;
}): Account {
  const id = uuid();
  const now = nowIso();
  const primaryDomain = input.primaryDomain ? normalizeDomain(input.primaryDomain) : null;
  getDb()
    .prepare(
      `INSERT INTO accounts
        (id, name, normalized_name, primary_domain, industry, employee_count_range,
         relationship_status, status, research_status, identity_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 'limited_data', 'confirmed', ?, ?)`
    )
    .run(
      id,
      input.name,
      normalizeCompanyName(input.name),
      primaryDomain,
      input.industry ?? null,
      input.employeeCountRange ?? null,
      input.relationshipStatus ?? 'prospect',
      now,
      now
    );
  return getAccount(id)!;
}

export function createContact(
  accountId: string,
  input: {
    firstName?: string;
    lastName?: string;
    title?: string;
    email?: string;
    phone?: string;
    linkedinUrl?: string;
    roleHypothesis?: BuyingRole;
  }
): Contact {
  const id = uuid();
  const now = nowIso();
  getDb()
    .prepare(
      `INSERT INTO contacts
        (id, account_id, first_name, last_name, title, email, phone, linkedin_url, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`
    )
    .run(
      id,
      accountId,
      input.firstName ?? null,
      input.lastName ?? null,
      input.title ?? null,
      input.email ?? null,
      input.phone ?? null,
      input.linkedinUrl ?? null,
      now,
      now
    );
  getDb()
    .prepare(
      `INSERT INTO account_contact_relationships
        (id, account_id, contact_id, role_hypothesis, certainty_type, is_current, valid_from, created_at)
       VALUES (?, ?, ?, ?, 'KNOWN', 1, ?, ?)`
    )
    .run(uuid(), accountId, id, input.roleHypothesis ?? 'unknown', now, now);
  return mapContact(row('SELECT * FROM contacts WHERE id = ?', [id])!);
}

/**
 * Replaces the account's AI-synthesized "what they do"/"what matters"
 * with a fresh version — used after a Research refresh. Never
 * hard-deletes: prior synthesis is marked superseded (still visible in
 * the full knowledge timeline, just no longer used for the brief's
 * headline text) rather than destroyed — see docs/EVIDENCE_MODEL.md.
 */
export function replaceAiSynthesis(accountId: string, whatTheyDo: string, whatMatters: string[]): void {
  const now = nowIso();
  getDb()
    .prepare(
      `UPDATE knowledge_items SET verification_status = 'superseded', valid_until = ?
       WHERE account_id = ? AND verification_status = 'current'
         AND type = 'research_finding' AND origin = 'research_derived'
         AND json_extract(structured_value, '$.kind') IN ('ai_company_summary', 'ai_what_matters')`
    )
    .run(now, accountId);

  addKnowledgeItem(accountId, whatTheyDo, 'research_finding', 'research_derived', {
    certaintyType: 'SUGGESTED',
    structuredValue: { kind: 'ai_company_summary' },
  });
  for (const bullet of whatMatters) {
    addKnowledgeItem(accountId, bullet, 'research_finding', 'research_derived', {
      certaintyType: 'SUGGESTED',
      structuredValue: { kind: 'ai_what_matters' },
    });
  }
}

/** Communication "kinds" generated by src/ai/seller-voice/ — see saveGeneratedCommunication. */
export type GeneratedCommunicationKind = 'call_script' | 'voicemail_script' | 'email_draft';

/** Persists a generated call script/voicemail/email, superseding any prior current version — same supersession pattern as replaceAiSynthesis (never hard-deleted, still visible in the full timeline). */
export function saveGeneratedCommunication(accountId: string, kind: GeneratedCommunicationKind, content: string): void {
  const now = nowIso();
  getDb()
    .prepare(
      `UPDATE knowledge_items SET verification_status = 'superseded', valid_until = ?
       WHERE account_id = ? AND verification_status = 'current'
         AND type = 'generated_communication' AND origin = 'ai_inferred'
         AND json_extract(structured_value, '$.kind') = ?`
    )
    .run(now, accountId, kind);

  addKnowledgeItem(accountId, content, 'generated_communication', 'ai_inferred', {
    certaintyType: 'SUGGESTED',
    structuredValue: { kind },
  });
}

export function getGeneratedCommunication(accountId: string, kind: GeneratedCommunicationKind): KnowledgeItem | null {
  return (
    getKnowledgeItemsForAccount(accountId).find(
      (k) => k.verificationStatus === 'current' && (k.structuredValue as { kind?: string } | null)?.kind === kind
    ) ?? null
  );
}

export function addKnowledgeItem(
  accountId: string,
  content: string,
  type: KnowledgeItemType = 'note',
  origin: KnowledgeItem['origin'] = 'user_entered',
  options: { certaintyType?: CertaintyType; structuredValue?: Record<string, unknown>; contactId?: string } = {}
): KnowledgeItem {
  const id = uuid();
  const now = nowIso();
  const certaintyType = options.certaintyType ?? 'KNOWN';
  const confidence = certaintyType === 'KNOWN' ? 1 : certaintyType === 'INFERRED' ? 0.6 : 0.3;
  getDb()
    .prepare(
      `INSERT INTO knowledge_items
        (id, account_id, contact_id, type, content, structured_value, origin, valid_from, confidence, certainty_type, verification_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'current', ?, ?)`
    )
    .run(
      id,
      accountId,
      options.contactId ?? null,
      type,
      content,
      options.structuredValue ? JSON.stringify(options.structuredValue) : null,
      origin,
      now,
      confidence,
      certaintyType,
      now,
      now
    );
  return mapKnowledgeItem(row('SELECT * FROM knowledge_items WHERE id = ?', [id])!);
}

export function createTargetList(input: { name: string; description?: string }): TargetList {
  const id = uuid();
  getDb()
    .prepare(`INSERT INTO target_lists (id, name, description, status, created_at) VALUES (?, ?, ?, 'active', ?)`)
    .run(id, input.name, input.description ?? null, nowIso());
  return getTargetList(id)!;
}

export function updateTargetList(id: string, input: { name: string; description?: string; researchFocus?: string }): TargetList {
  getDb()
    .prepare(`UPDATE target_lists SET name = ?, description = ?, research_focus = ? WHERE id = ?`)
    .run(input.name, input.description ?? null, input.researchFocus ?? null, id);
  return getTargetList(id)!;
}

export function addAccountToList(listId: string, accountId: string): TargetListItem {
  const id = uuid();
  getDb()
    .prepare(
      `INSERT INTO target_list_items (id, target_list_id, account_id, status, pinned, added_at)
       VALUES (?, ?, ?, 'not_started', 0, ?)`
    )
    .run(id, listId, accountId, nowIso());
  return mapTargetListItem(row('SELECT * FROM target_list_items WHERE id = ?', [id])!);
}

export function listAccounts(): Account[] {
  return rows('SELECT * FROM accounts ORDER BY name ASC').map(mapAccount);
}

export interface AccountOverviewRow {
  account: Account;
  priorityLabel: PriorityLabel;
  listNames: string[];
}

/** Accounts browser view — every real account, regardless of list membership. See docs/PRODUCT_UX.md's Accounts screen. */
export function getAccountsOverview(): AccountOverviewRow[] {
  const accounts = listAccounts();
  const scores = scoreMap();
  const items = rows('SELECT * FROM target_list_items').map(mapTargetListItem);
  const listById = new Map(getTargetLists().map((l) => [l.id, l]));
  const listNamesByAccount = new Map<string, string[]>();
  for (const item of items) {
    const list = listById.get(item.targetListId);
    if (!list) continue;
    listNamesByAccount.set(item.accountId, [...(listNamesByAccount.get(item.accountId) ?? []), list.name]);
  }
  return accounts.map((account) => ({
    account,
    priorityLabel: toPriorityLabel(scores.get(account.id)),
    listNames: listNamesByAccount.get(account.id) ?? [],
  }));
}

export interface PersonRow {
  contact: Contact;
  relationship: AccountContactRelationship;
  account: Account;
  freshnessLabel: string;
  sourceNote: string | null;
}

/** Every real contact across every account — see docs/PEOPLE_INTELLIGENCE.md's role-plus-certainty rule. */
export function getPeopleOverview(): PersonRow[] {
  const relationships = rows('SELECT * FROM account_contact_relationships').map(mapAccountContactRelationship);
  return relationships
    .map((relationship) => {
      const contactRow = row('SELECT * FROM contacts WHERE id = ?', [relationship.contactId]);
      const contact = contactRow ? mapContact(contactRow) : null;
      const account = contact ? getAccount(relationship.accountId) : null;
      if (!contact || !account) return null;
      const sourceItem = relationship.sourceKnowledgeItemId
        ? row('SELECT * FROM knowledge_items WHERE id = ?', [relationship.sourceKnowledgeItemId])
        : undefined;
      return {
        contact,
        relationship,
        account,
        freshnessLabel: describeFreshness('contact_employment', contact.lastVerifiedAt),
        sourceNote: sourceItem ? (mapKnowledgeItem(sourceItem).content) : null,
      };
    })
    .filter((p): p is PersonRow => p !== null)
    .sort((a, b) => Number(b.relationship.isCurrent) - Number(a.relationship.isCurrent));
}

/**
 * Research screen's company/domain resolution — see
 * docs/RESEARCH_ARCHITECTURE.md. Reuses the same conservative
 * entity-resolution logic every import/CRM path uses; never a bespoke
 * "search" implementation.
 */
export function resolveAccountQuery(query: string): { match: MatchResult; account: Account | null } {
  const accounts = listAccounts();
  const candidates: ResolutionCandidate[] = accounts.map((a) => ({
    accountId: a.id,
    name: a.name,
    domain: a.primaryDomain ?? undefined,
  }));
  const looksLikeDomain = query.includes('.') && !query.includes(' ');
  const match = resolveAccount(looksLikeDomain ? { name: query, domain: query } : { name: query }, candidates);
  const account = match.accountId ? getAccount(match.accountId) : null;
  return { match, account };
}

export function getListsForAccount(accountId: string): TargetList[] {
  const items = rows('SELECT * FROM target_list_items WHERE account_id = ?', [accountId]).map(mapTargetListItem);
  return items
    .map((i) => getTargetList(i.targetListId))
    .filter((l): l is TargetList => l !== null);
}

export function recordAnalyticsEvent(input: {
  eventType: AnalyticsEventType;
  accountId?: string;
  targetListId?: string;
  contactId?: string;
}): void {
  const now = nowIso();
  getDb()
    .prepare(
      `INSERT INTO analytics_events (id, event_type, account_id, target_list_id, contact_id, membership_id, occurred_at, created_at)
       VALUES (?, ?, ?, ?, ?, NULL, ?, ?)`
    )
    .run(uuid(), input.eventType, input.accountId ?? null, input.targetListId ?? null, input.contactId ?? null, now, now);
}

/** Pins always outrank automatic ordering — see src/domain/target-lists.ts. Operates on one list item at a time, same semantics as the Lists screen's pin control. */
export function setTargetListItemPinned(itemId: string, pinned: boolean): TargetListItem {
  getDb().prepare('UPDATE target_list_items SET pinned = ? WHERE id = ?').run(pinned ? 1 : 0, itemId);
  return mapTargetListItem(row('SELECT * FROM target_list_items WHERE id = ?', [itemId])!);
}

/** Progress must never reset — see docs/TARGET_LISTS.md. Toggling back to not_started clears worked_at rather than deleting any history (call outcomes/notes stay intact regardless of this status). */
export function setTargetListItemWorked(itemId: string, worked: boolean): TargetListItem {
  const now = nowIso();
  getDb()
    .prepare('UPDATE target_list_items SET status = ?, worked_at = ? WHERE id = ?')
    .run(worked ? 'worked' : 'not_started', worked ? now : null, itemId);
  const item = mapTargetListItem(row('SELECT * FROM target_list_items WHERE id = ?', [itemId])!);
  if (worked) {
    recordAnalyticsEvent({ eventType: 'account_worked', accountId: item.accountId, targetListId: item.targetListId });
    getDb().prepare('UPDATE target_lists SET last_worked_at = ? WHERE id = ?').run(now, item.targetListId);
  }
  return item;
}

export interface TodayEntry extends SuggestedCallEntry {
  listId: string;
  listName: string;
}

/**
 * "Who should I contact today" across every active Target List — see
 * docs/PRODUCT_UX.md's Today screen. Unlike getSuggestedCalls (which
 * excludes worked/skipped items for a single list's "what's left"
 * view), Today includes worked items too so a rep can see and un-mark
 * what they already did today — only truly skipped items drop off.
 * Reuses the shared pin/priority ordering rule rather than
 * re-implementing it. Deduplicates an account on more than one list
 * down to its single best-ranked entry.
 */
export function getTodayEntries(limit = 50): TodayEntry[] {
  const lists = getTargetLists().filter((l) => l.status === 'active');
  const scores = scoreMap();
  const byAccount = new Map<string, TodayEntry>();

  for (const list of lists) {
    const items = itemsForList(list.id).filter((i) => i.status !== 'skipped');
    for (const item of items) {
      if (byAccount.has(item.accountId)) continue;
      const account = getAccount(item.accountId);
      if (!account) continue;
      const score = scores.get(item.accountId);
      byAccount.set(item.accountId, {
        account,
        item,
        priorityLabel: toPriorityLabel(score),
        pinned: item.pinned,
        reasons: [],
        listId: list.id,
        listName: list.name,
      });
    }
  }

  const merged = [...byAccount.values()].sort(comparePinnedThenPriority);
  return merged.slice(0, limit);
}

export interface TodayRow {
  entry: TodayEntry;
  keyPerson: { name: string; title: string | null; certainty: AccountContactRelationship['certaintyType'] } | null;
  whatWeKnow: string | null;
  suggestedAngle: string | null;
  freshnessLabel: string;
  flag: string | null;
}

const GENERIC_TALKING_POINT = 'Add notes below to build talking points here.';

export function getTodayRows(limit = 50): TodayRow[] {
  return getTodayEntries(limit).map((entry) => {
    const contacts = getContactsForAccount(entry.account.id);
    const topContact = contacts[0];
    const items = getKnowledgeItemsForAccount(entry.account.id);
    const warning = getIdentityWarning(entry.account.id);
    const brief = getAccountBrief(entry.account.id);
    const talkingPoint = brief?.talkingPoints.find((t) => t !== GENERIC_TALKING_POINT) ?? null;
    return {
      entry,
      keyPerson: topContact
        ? {
            name: `${topContact.contact.firstName ?? ''} ${topContact.contact.lastName ?? ''}`.trim() || 'Unnamed contact',
            title: topContact.contact.title,
            certainty: topContact.relationship.certaintyType,
          }
        : null,
      whatWeKnow: items[0]?.content ?? null,
      suggestedAngle: talkingPoint,
      freshnessLabel: describeCompanyFreshness(entry.account.id),
      flag:
        warning?.warning ??
        (entry.account.researchStatus === 'limited_data'
          ? 'Limited data on file — add notes or import more context.'
          : null),
    };
  });
}

export const LOCAL_ORGANIZATION_ID = LOCAL_ORG_ID;
