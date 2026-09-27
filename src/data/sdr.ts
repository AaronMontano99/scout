/**
 * Persistence for the Lead SDR workflow — live-researched intel,
 * generated call cards/emails, confirmed activity (calls, emails,
 * walk-ins), and lead-finder candidates. Pure DB reads/writes; the AI
 * side lives in src/ai/sdr/.
 */
import { getDb, type SqlValue } from '@/db/client';
import { getAccount, normalizeCompanyName, touchAccount, updateAccountFromResearch } from './accounts';
import type { AccountIntel, CallCard, Debrief, EmailDraft, HotListUpdate, Lead } from '@/ai/sdr/schemas';
import type { ActivityChannel, ActivityRecord } from '@/domain/day-summary';
import { buildEmailLogRow, type EmailLogRow } from '@/domain/email-log';
import { addBusinessDays, isActive, ymd, type HotListEntry, type HotPriority, type HotStage, type NextAction } from '@/domain/hot-list';

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
function parse<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// === Intel ================================================================

export interface StoredIntel {
  intel: AccountIntel;
  researchedAt: string;
  model: string | null;
}

export function saveIntel(accountId: string, intel: AccountIntel, model: string): void {
  getDb()
    .prepare(
      `INSERT INTO sdr_intel (account_id, data, model, researched_at) VALUES (?, ?, ?, ?)
       ON CONFLICT (account_id) DO UPDATE SET data = excluded.data, model = excluded.model, researched_at = excluded.researched_at`
    )
    .run(accountId, JSON.stringify(intel), model, nowIso());

  // Keep the account's own office details in sync so lists can show territory and phone at a glance.
  updateAccountFromResearch(accountId, { address: intel.localOffice.address, zip: intel.localOffice.zip, phone: intel.localOffice.phone });
}

export function getIntel(accountId: string): StoredIntel | null {
  const r = row('SELECT * FROM sdr_intel WHERE account_id = ?', [accountId]);
  if (!r) return null;
  return { intel: parse<AccountIntel>(r.data, null as never), researchedAt: r.researched_at as string, model: (r.model as string) ?? null };
}

export const INTEL_STALE_DAYS = 14;

export function isIntelStale(stored: StoredIntel | null, now = new Date()): boolean {
  if (!stored) return true;
  const ageMs = now.getTime() - new Date(stored.researchedAt).getTime();
  return ageMs > INTEL_STALE_DAYS * 24 * 60 * 60 * 1000;
}

// === Drafts (call cards + emails) =========================================

export type DraftKind = 'call_card' | 'email';
type DraftData<K extends DraftKind> = K extends 'call_card' ? CallCard : EmailDraft;

export interface StoredDraft<K extends DraftKind> {
  id: string;
  data: DraftData<K>;
  instruction: string | null;
  createdAt: string;
}

export function saveDraft<K extends DraftKind>(accountId: string, kind: K, data: DraftData<K>, instruction: string | null, model: string): string {
  const id = uuid();
  touchAccount(accountId);
  getDb()
    .prepare(`INSERT INTO sdr_drafts (id, account_id, kind, data, instruction, model, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .run(id, accountId, kind, JSON.stringify(data), instruction, model, nowIso());
  return id;
}

export function getLatestDraft<K extends DraftKind>(accountId: string, kind: K): StoredDraft<K> | null {
  const r = row('SELECT * FROM sdr_drafts WHERE account_id = ? AND kind = ? ORDER BY created_at DESC LIMIT 1', [accountId, kind]);
  if (!r) return null;
  return { id: r.id as string, data: parse<DraftData<K>>(r.data, null as never), instruction: (r.instruction as string) ?? null, createdAt: r.created_at as string };
}

/** Saves the rep's hand edits to a draft (e.g. tweaking the email body before sending) without a new generation. */
export function updateDraftData<K extends DraftKind>(draftId: string, data: DraftData<K>): void {
  getDb().prepare('UPDATE sdr_drafts SET data = ? WHERE id = ?').run(JSON.stringify(data), draftId);
}

// === CRM history + notes ==================================================

/**
 * Stores notes pasted from Aaron's real CRM, verbatim — the "CRM HISTORY"
 * the playbook reopens threads from. Pasting the same notes twice (e.g.
 * on every "I'm calling X") is a no-op. Returns true if anything new
 * was saved.
 */
export function saveCrmHistory(accountId: string, text: string): boolean {
  const content = text.trim();
  if (!content) return false;
  const existing = rows('SELECT content FROM crm_notes WHERE account_id = ?', [accountId]).map((r) => (r.content as string).trim());
  if (existing.some((e) => e === content || e.includes(content))) return false;
  getDb().prepare('INSERT INTO crm_notes (id, account_id, content, created_at) VALUES (?, ?, ?, ?)').run(uuid(), accountId, content, nowIso());
  touchAccount(accountId);
  return true;
}

export interface CrmNote {
  id: string;
  content: string;
  createdAt: string;
}

/** Everything Aaron pasted from his CRM for this account, newest first. */
export function getCrmNotes(accountId: string): CrmNote[] {
  return rows('SELECT * FROM crm_notes WHERE account_id = ? ORDER BY created_at DESC', [accountId]).map((r) => ({
    id: r.id as string,
    content: r.content as string,
    createdAt: r.created_at as string,
  }));
}

export function deleteCrmNote(id: string): void {
  getDb().prepare('DELETE FROM crm_notes WHERE id = ?').run(id);
}

// === Activities ===========================================================

export interface LogActivityInput {
  accountId: string | null;
  accountName: string;
  channel: ActivityChannel;
  category: 'prospecting' | 'admin';
  outcome: string | null;
  contactName: string | null;
  rawNotes: string | null;
  crmNotes: string[];
  coaching: Debrief | null;
  connected: boolean;
  decisionMaker: boolean;
  relevant: boolean;
  meetingAsked: boolean;
  meetingBooked: boolean;
  occurredAt?: string;
}

export function logActivity(input: LogActivityInput): string {
  const id = uuid();
  if (input.accountId) touchAccount(input.accountId);
  const now = nowIso();
  getDb()
    .prepare(
      `INSERT INTO sdr_activities
        (id, account_id, account_name, channel, category, outcome, contact_name, raw_notes, crm_notes, coaching,
         connected, decision_maker, relevant, meeting_asked, meeting_booked, occurred_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      input.accountId,
      input.accountName,
      input.channel,
      input.category,
      input.outcome,
      input.contactName,
      input.rawNotes,
      JSON.stringify(input.crmNotes),
      input.coaching ? JSON.stringify(input.coaching) : null,
      input.connected ? 1 : 0,
      input.decisionMaker ? 1 : 0,
      input.relevant ? 1 : 0,
      input.meetingAsked ? 1 : 0,
      input.meetingBooked ? 1 : 0,
      input.occurredAt ?? now,
      now
    );
  return id;
}

function mapActivity(r: Record<string, unknown>): ActivityRecord {
  return {
    id: r.id as string,
    accountId: (r.account_id as string) ?? null,
    accountName: r.account_name as string,
    channel: r.channel as ActivityChannel,
    category: r.category as 'prospecting' | 'admin',
    outcome: (r.outcome as string) ?? null,
    contactName: (r.contact_name as string) ?? null,
    rawNotes: (r.raw_notes as string) ?? null,
    crmNotes: parse<string[]>(r.crm_notes, []),
    connected: Boolean(r.connected),
    decisionMaker: Boolean(r.decision_maker),
    relevant: Boolean(r.relevant),
    meetingAsked: Boolean(r.meeting_asked),
    meetingBooked: Boolean(r.meeting_booked),
    occurredAt: r.occurred_at as string,
  };
}

export function getActivitiesForAccount(accountId: string): ActivityRecord[] {
  return rows('SELECT * FROM sdr_activities WHERE account_id = ? ORDER BY occurred_at DESC', [accountId]).map(mapActivity);
}

export function getActivitiesBetween(startIso: string, endIso: string): ActivityRecord[] {
  return rows('SELECT * FROM sdr_activities WHERE occurred_at >= ? AND occurred_at < ? ORDER BY occurred_at ASC', [startIso, endIso]).map(mapActivity);
}

export function deleteActivity(id: string): void {
  getDb().prepare('DELETE FROM sdr_activities WHERE id = ?').run(id);
}

// === Lead finder ==========================================================

export interface LeadCandidate {
  id: string;
  runId: string;
  lead: Lead;
  status: 'new' | 'added' | 'dismissed';
  accountId: string | null;
  createdAt: string;
}

export function saveLeadCandidates(runId: string, leads: Lead[]): number {
  const known = new Set(knownCompanyNames());
  let saved = 0;
  for (const lead of leads) {
    const normalized = normalizeCompanyName(lead.company);
    if (!normalized || known.has(normalized)) continue;
    known.add(normalized);
    getDb()
      .prepare(`INSERT INTO sdr_lead_candidates (id, run_id, company, normalized_name, data, status, created_at) VALUES (?, ?, ?, ?, ?, 'new', ?)`)
      .run(uuid(), runId, lead.company, normalized, JSON.stringify(lead), nowIso());
    saved += 1;
  }
  return saved;
}

export function getLeadCandidates(status?: LeadCandidate['status']): LeadCandidate[] {
  const sql = status
    ? 'SELECT * FROM sdr_lead_candidates WHERE status = ? ORDER BY created_at DESC'
    : 'SELECT * FROM sdr_lead_candidates ORDER BY created_at DESC';
  return rows(sql, status ? [status] : []).map((r) => ({
    id: r.id as string,
    runId: r.run_id as string,
    lead: parse<Lead>(r.data, null as never),
    status: r.status as LeadCandidate['status'],
    accountId: (r.account_id as string) ?? null,
    createdAt: r.created_at as string,
  }));
}

export function getLeadCandidate(id: string): LeadCandidate | null {
  return getLeadCandidates().find((c) => c.id === id) ?? null;
}

export function setLeadCandidateStatus(id: string, status: LeadCandidate['status'], accountId?: string): void {
  getDb().prepare('UPDATE sdr_lead_candidates SET status = ?, account_id = COALESCE(?, account_id) WHERE id = ?').run(status, accountId ?? null, id);
}

/** Every company Scout already knows about — accounts plus every lead ever suggested — so the finder never repeats one. */
export function knownCompanyNames(): string[] {
  const accountNames = rows('SELECT normalized_name FROM accounts').map((r) => r.normalized_name as string);
  const leadNames = rows('SELECT normalized_name FROM sdr_lead_candidates').map((r) => r.normalized_name as string);
  return [...new Set([...accountNames, ...leadNames])];
}

export function knownCompanyDisplayNames(limit = 400): string[] {
  const accountNames = rows('SELECT name FROM accounts ORDER BY updated_at DESC').map((r) => r.name as string);
  const leadNames = rows('SELECT company FROM sdr_lead_candidates ORDER BY created_at DESC').map((r) => r.company as string);
  return [...new Set([...leadNames, ...accountNames])].slice(0, limit);
}

// === Call-first list ======================================================

export interface CallFirstRow {
  accountId: string;
  company: string;
  priority: string;
  contact: string;
  phone: string;
  signal: string;
  hypothesis: string;
  angle: string;
  touchedToday: boolean;
}

const CALL_FIRST_ORDER: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2, SKIP: 3 };

/** The playbook's CALL-FIRST LIST, built from each account's latest call card + research. HIGH/MEDIUM first; LOW/SKIP left off. */
export function getCallFirstList(dayStartIso: string, limit = 30): CallFirstRow[] {
  const latest = rows(
    `SELECT d.account_id, d.data, a.name, a.phone FROM sdr_drafts d
     JOIN accounts a ON a.id = d.account_id
     WHERE d.kind = 'call_card' AND d.created_at = (
       SELECT MAX(created_at) FROM sdr_drafts WHERE account_id = d.account_id AND kind = 'call_card'
     )`
  );
  const touched = new Set(
    rows('SELECT DISTINCT account_id FROM sdr_activities WHERE occurred_at >= ? AND account_id IS NOT NULL', [dayStartIso]).map((r) => r.account_id as string)
  );

  return latest
    .map((r) => {
      const card = parse<CallCard | null>(r.data, null);
      const intel = getIntel(r.account_id as string)?.intel;
      const topSignal = intel?.signals.find((s) => s.strength === 'HARD') ?? intel?.signals[0];
      return {
        accountId: r.account_id as string,
        company: r.name as string,
        priority: card?.priority ?? 'LOW',
        contact: [card?.target.name, card?.target.title].filter(Boolean).join(', '),
        phone: intel?.localOffice.phone || (r.phone as string) || '',
        signal: topSignal ? `${topSignal.signal}${topSignal.date ? ` (${topSignal.date})` : ''}` : '',
        hypothesis: card?.hypothesis ?? '',
        angle: card?.angle ?? '',
        touchedToday: touched.has(r.account_id as string),
      };
    })
    .filter((r) => r.priority === 'HIGH' || r.priority === 'MEDIUM')
    .sort((a, b) => Number(a.touchedToday) - Number(b.touchedToday) || CALL_FIRST_ORDER[a.priority]! - CALL_FIRST_ORDER[b.priority]!)
    .slice(0, limit);
}

// === Hot List (Qualified-IN pool) =========================================

export type HotListPatch = Partial<Omit<HotListEntry, 'accountId' | 'accountName' | 'lastTouchAt' | 'addedAt' | 'updatedAt'>>;

const HOT_COLUMNS: Record<keyof HotListPatch, string> = {
  priority: 'priority',
  stage: 'stage',
  contact: 'contact',
  whyQualified: 'why_qualified',
  lastInteraction: 'last_interaction',
  learned: 'learned',
  hypothesis: 'hypothesis',
  nextQuestion: 'next_question',
  nextAction: 'next_action',
  nextTouchDate: 'next_touch_date',
  angle: 'angle',
  meetingHypothesis: 'meeting_hypothesis',
  closeReason: 'close_reason',
};

/** Adds the account to the Hot List or updates only the given fields. */
export function upsertHotList(accountId: string, patch: HotListPatch): void {
  const now = nowIso();
  if (!row('SELECT 1 FROM sdr_hotlist WHERE account_id = ?', [accountId])) {
    getDb().prepare('INSERT INTO sdr_hotlist (account_id, added_at, updated_at) VALUES (?, ?, ?)').run(accountId, now, now);
  }
  const entries = (Object.keys(patch) as (keyof HotListPatch)[]).filter((k) => patch[k] !== undefined && HOT_COLUMNS[k]);
  if (entries.length === 0) return;
  const sets = entries.map((k) => `${HOT_COLUMNS[k]} = ?`).join(', ');
  const values = entries.map((k) => {
    const v = patch[k];
    return k === 'nextTouchDate' ? ((v as string | null) || null) : (v as string);
  });
  getDb()
    .prepare(`UPDATE sdr_hotlist SET ${sets}, updated_at = ? WHERE account_id = ?`)
    .run(...(values as SqlValue[]), now, accountId);
}

function mapHot(r: Record<string, unknown>): HotListEntry {
  return {
    accountId: r.account_id as string,
    accountName: r.account_name as string,
    priority: r.priority as HotPriority,
    stage: r.stage as HotStage,
    contact: r.contact as string,
    whyQualified: r.why_qualified as string,
    lastInteraction: r.last_interaction as string,
    learned: r.learned as string,
    hypothesis: r.hypothesis as string,
    nextQuestion: r.next_question as string,
    nextAction: r.next_action as NextAction,
    nextTouchDate: (r.next_touch_date as string) ?? null,
    angle: r.angle as string,
    meetingHypothesis: r.meeting_hypothesis as string,
    closeReason: r.close_reason as string,
    lastTouchAt: (r.last_touch_at as string) ?? null,
    addedAt: r.added_at as string,
    updatedAt: r.updated_at as string,
  };
}

const HOT_SELECT = `SELECT h.*, a.name AS account_name,
  (SELECT MAX(occurred_at) FROM sdr_activities s WHERE s.account_id = h.account_id) AS last_touch_at
  FROM sdr_hotlist h JOIN accounts a ON a.id = h.account_id`;

export function getHotList(): HotListEntry[] {
  return rows(HOT_SELECT).map(mapHot);
}

export function getHotListEntry(accountId: string): HotListEntry | null {
  const r = row(`${HOT_SELECT} WHERE h.account_id = ?`, [accountId]);
  return r ? mapHot(r) : null;
}

/**
 * Applies an AI-proposed (and rep-confirmed) Hot List decision:
 * qualify_in/update write the full row, meeting_booked and close take
 * it off the active list (kept for history), not_qualified changes
 * nothing.
 */
export function applyHotListUpdate(accountId: string, update: HotListUpdate): 'added' | 'updated' | 'removed' | 'unchanged' {
  recordHotListCheck(accountId, update.decision, update.reason);
  const existing = getHotListEntry(accountId);
  const row: HotListPatch = {
    priority: update.priority,
    stage: update.stage,
    contact: update.contact,
    whyQualified: update.whyQualified,
    lastInteraction: update.lastInteraction,
    learned: update.learned,
    hypothesis: update.hypothesis,
    nextQuestion: update.nextQuestion,
    nextAction: update.nextAction,
    nextTouchDate: update.nextTouchDate || null,
    angle: update.angle,
    meetingHypothesis: update.meetingHypothesis,
  };
  switch (update.decision) {
    case 'qualify_in':
    case 'update':
      upsertHotList(accountId, { ...row, stage: update.stage === 'meeting_booked' || update.stage === 'closed' ? 'developing' : update.stage });
      return existing ? 'updated' : 'added';
    case 'meeting_booked':
      if (!existing) return 'unchanged';
      upsertHotList(accountId, { stage: 'meeting_booked', lastInteraction: update.lastInteraction, learned: update.learned });
      return 'removed';
    case 'close':
      if (!existing) return 'unchanged';
      upsertHotList(accountId, { stage: 'closed', closeReason: update.reason, lastInteraction: update.lastInteraction, learned: update.learned });
      return 'removed';
    default:
      return 'unchanged';
  }
}

/**
 * Keeps an active Hot List row current after a quick touch (email sent,
 * VM, no answer): records the interaction and, if the next touch was
 * due, rolls it forward so the account doesn't sit at ACT NOW for a
 * touch that already happened. No-op for accounts not on the list.
 */
export function recordHotListTouch(accountId: string, interaction: string, rollForwardBusinessDays: number, today = new Date()): boolean {
  const entry = getHotListEntry(accountId);
  if (!entry || !isActive(entry.stage)) return false;
  const todayYmd = ymd(today);
  const due = !entry.nextTouchDate || entry.nextTouchDate <= todayYmd;
  upsertHotList(accountId, {
    lastInteraction: `${today.getMonth() + 1}/${today.getDate()} ${interaction}`,
    ...(due ? { nextTouchDate: addBusinessDays(todayYmd, rollForwardBusinessDays) } : {}),
  });
  return true;
}

export interface HotListCheck {
  decision: HotListUpdate['decision'];
  reason: string;
  checkedAt: string;
}

export function recordHotListCheck(accountId: string, decision: HotListUpdate['decision'], reason: string): void {
  getDb()
    .prepare(
      `INSERT INTO sdr_hotlist_checks (account_id, decision, reason, checked_at) VALUES (?, ?, ?, ?)
       ON CONFLICT (account_id) DO UPDATE SET decision = excluded.decision, reason = excluded.reason, checked_at = excluded.checked_at`
    )
    .run(accountId, decision, reason, nowIso());
}

export function getLastHotListCheck(accountId: string): HotListCheck | null {
  const r = row('SELECT * FROM sdr_hotlist_checks WHERE account_id = ?', [accountId]);
  return r ? { decision: r.decision as HotListCheck['decision'], reason: r.reason as string, checkedAt: r.checked_at as string } : null;
}

// === Email log ============================================================

/** Every company Aaron has emailed or drafted for, newest activity first. See src/domain/email-log.ts. */
export function getEmailLog(): EmailLogRow[] {
  const ids = rows(
    `SELECT account_id FROM sdr_drafts WHERE kind = 'email'
     UNION SELECT account_id FROM sdr_activities WHERE channel = 'email' AND account_id IS NOT NULL`
  ).map((r) => r.account_id as string);

  return ids
    .map((accountId) => {
      const account = getAccount(accountId);
      if (!account) return null;
      const draft = getLatestDraft(accountId, 'email');
      const activities = getActivitiesForAccount(accountId);
      const hot = getHotListEntry(accountId);
      return buildEmailLogRow({
        accountId,
        company: account.name,
        latestDraft: draft
          ? {
              createdAt: draft.createdAt,
              subject: draft.data.subject,
              contactName: draft.data.contact.name,
              priority: draft.data.priority,
              recommendation: draft.data.recommendation ?? 'send',
              skipReason: draft.data.skipReason,
              recommendationReason: draft.data.recommendationReason ?? '',
            }
          : null,
        emails: activities.filter((a) => a.channel === 'email'),
        anyMeetingBooked: activities.some((a) => a.meetingBooked),
        hotList: hot,
        lastCheck: getLastHotListCheck(accountId),
      });
    })
    .filter((r): r is EmailLogRow => r !== null)
    .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
}

/** Aaron's manual call: this account is out. Closes its Hot List row (or records one) with his reason. */
export function qualifyOut(accountId: string, reason: string): void {
  const text = reason.trim() || 'Qualified out';
  upsertHotList(accountId, { stage: 'closed', closeReason: text, priority: 'LOW' });
  recordHotListCheck(accountId, 'close', text);
}
