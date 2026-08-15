/**
 * Post-call workflow — see docs/POST_CALL_WORKFLOW.md. No AI provider
 * generates a "clean note" or follow-up draft in local mode; this
 * commits exactly what the rep typed, tagged INFERRED (never
 * auto-promoted to KNOWN — see ProposedAccountUpdate's certainty
 * constraint in src/types/product.ts). Logging a call also closes the
 * loop with Target Lists: if the account is on a list, that item is
 * marked worked in the same transaction, matching the master
 * integration spec's "Log Call is itself a work action."
 */
import { getDb } from '@/db/client';
import { getAccount, addKnowledgeItem, recordAnalyticsEvent, setTargetListItemWorked } from './index';
import type { CallOutcomeType } from '@/types/product';

// Local-first mode has exactly one implicit user — see src/auth/index.ts's LOCAL_AUTH_CONTEXT.
const LOCAL_MEMBERSHIP_ID = 'local-membership';

function uuid(): string {
  return crypto.randomUUID();
}
function nowIso(): string {
  return new Date().toISOString();
}
function row(sql: string, params: unknown[] = []): Record<string, unknown> | undefined {
  return getDb().prepare(sql).get(...(params as never[]));
}

const CONVERSATION_OUTCOMES: CallOutcomeType[] = [
  'gatekeeper',
  'general_staff',
  'influencer',
  'champion',
  'decision_maker',
  'other_executive',
  'connected',
  'meeting_booked',
  'follow_up_required',
  'not_interested',
];
const TARGET_CONVERSATION_OUTCOMES: CallOutcomeType[] = ['decision_maker', 'other_executive', 'champion', 'influencer'];

export interface LogCallInput {
  outcomeType: CallOutcomeType;
  contactId?: string;
  contactRoleObserved?: string;
  currentVendor?: string;
  timingMentioned?: string;
  notes?: string;
  targetListItemId?: string;
}

export interface LogCallResult {
  callOutcomeId: string;
  proposedUpdates: { kind: 'knowledge_item'; summary: string; certaintyType: 'INFERRED' }[];
}

export function logCall(accountId: string, input: LogCallInput): LogCallResult {
  const account = getAccount(accountId);
  if (!account) throw new Error('Account not found');

  const outcomeId = uuid();
  const now = nowIso();
  getDb()
    .prepare(
      `INSERT INTO call_outcomes (id, account_id, target_list_item_id, contact_id, membership_id, outcome_type, contact_role_observed, occurred_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      outcomeId,
      accountId,
      input.targetListItemId ?? null,
      input.contactId ?? null,
      LOCAL_MEMBERSHIP_ID,
      input.outcomeType,
      input.contactRoleObserved ?? null,
      now,
      now
    );

  if (input.targetListItemId) {
    setTargetListItemWorked(input.targetListItemId, true);
  }

  recordAnalyticsEvent({ eventType: 'call_attempted', accountId, contactId: input.contactId });
  if (CONVERSATION_OUTCOMES.includes(input.outcomeType)) {
    recordAnalyticsEvent({ eventType: 'conversation', accountId, contactId: input.contactId });
  }
  if (TARGET_CONVERSATION_OUTCOMES.includes(input.outcomeType)) {
    recordAnalyticsEvent({ eventType: 'target_conversation', accountId, contactId: input.contactId });
  }
  if (input.outcomeType === 'meeting_booked') {
    recordAnalyticsEvent({ eventType: 'meeting_booked', accountId, contactId: input.contactId });
  }

  const proposedUpdates: LogCallResult['proposedUpdates'] = [];

  if (input.contactRoleObserved) {
    addKnowledgeItem(accountId, `Contact role observed: ${input.contactRoleObserved}`, 'relationship', 'user_entered', {
      certaintyType: 'INFERRED',
      contactId: input.contactId,
    });
    proposedUpdates.push({ kind: 'knowledge_item', summary: `Contact role observed: ${input.contactRoleObserved}`, certaintyType: 'INFERRED' });
  }
  if (input.currentVendor) {
    addKnowledgeItem(accountId, `Possible incumbent vendor mentioned: ${input.currentVendor}`, 'incumbent_vendor', 'user_entered', {
      certaintyType: 'INFERRED',
      structuredValue: { competitor_name: input.currentVendor },
    });
    proposedUpdates.push({ kind: 'knowledge_item', summary: `Possible incumbent vendor: ${input.currentVendor}`, certaintyType: 'INFERRED' });
  }
  if (input.timingMentioned) {
    addKnowledgeItem(accountId, `Timing mentioned: ${input.timingMentioned}`, 'contract_timing', 'user_entered', {
      certaintyType: 'INFERRED',
    });
    proposedUpdates.push({ kind: 'knowledge_item', summary: `Timing mentioned: ${input.timingMentioned}`, certaintyType: 'INFERRED' });
  }
  if (input.notes) {
    addKnowledgeItem(accountId, input.notes, 'call_note', 'user_entered', { certaintyType: 'INFERRED', contactId: input.contactId });
    proposedUpdates.push({ kind: 'knowledge_item', summary: `Call note: ${input.notes}`, certaintyType: 'INFERRED' });
  }

  getDb()
    .prepare(
      `INSERT INTO post_call_notes (id, account_id, call_outcome_id, membership_id, raw_input, proposed_account_updates, approved_at, crm_write_status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'not_applicable', ?)`
    )
    .run(uuid(), accountId, outcomeId, LOCAL_MEMBERSHIP_ID, input.notes ?? '', JSON.stringify(proposedUpdates), now, now);

  return { callOutcomeId: outcomeId, proposedUpdates };
}

/** Best-effort AI-generated clean note, applied after logCall — see src/app/app/accounts/[id]/post-call/actions.ts. Never invents facts, just rewrites the rep's own words; if it's unavailable the raw note stands on its own, which was always the honest fallback. */
export function updateCleanNote(callOutcomeId: string, cleanNote: string): void {
  getDb().prepare(`UPDATE post_call_notes SET clean_note = ? WHERE call_outcome_id = ?`).run(cleanNote, callOutcomeId);
}

/** The account's open (not yet worked/skipped) list membership, if any — used to auto-mark-worked when a call is logged. */
export function getPrimaryOpenListItemId(accountId: string): string | null {
  const r = row(
    `SELECT id FROM target_list_items WHERE account_id = ? AND status IN ('not_started', 'in_progress') ORDER BY added_at ASC LIMIT 1`,
    [accountId]
  );
  return (r?.id as string | undefined) ?? null;
}

/** The account's most relevant list-membership row, whatever its status — used by the Account Brief's Mark Worked control so it reflects real current state (including already-worked). Prefers an open item, falls back to the most recently added membership. */
export function getPrimaryListItemForAccount(accountId: string): { id: string; worked: boolean } | null {
  const open = row(
    `SELECT id, status FROM target_list_items WHERE account_id = ? AND status IN ('not_started', 'in_progress') ORDER BY added_at ASC LIMIT 1`,
    [accountId]
  );
  const r = open ?? row(`SELECT id, status FROM target_list_items WHERE account_id = ? ORDER BY added_at DESC LIMIT 1`, [accountId]);
  if (!r) return null;
  return { id: r.id as string, worked: r.status === 'worked' };
}
