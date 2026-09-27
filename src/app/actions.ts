'use server';

import { revalidatePath } from 'next/cache';
import { createAccount, findOrCreateAccount, getAccount } from '@/data/accounts';
import {
  applyHotListUpdate,
  deleteActivity,
  getActivitiesForAccount,
  getHotListEntry,
  getIntel,
  getLatestDraft,
  getLeadCandidate,
  logActivity,
  recordHotListTouch,
  saveCrmHistory,
  saveIntel,
  setLeadCandidateStatus,
  updateDraftData,
  upsertHotList,
  qualifyOut,
  type HotListPatch,
} from '@/data/sdr';
import { updateSettings, type Settings } from '@/data/settings';
import { noPickupNextMove, type ActivityChannel } from '@/domain/day-summary';
import type { AccountIntel, Debrief, EmailDraft, HotListUpdate } from '@/ai/sdr/schemas';
import { assessHotList } from '@/ai/sdr/engine';
import { jobKey, runJob } from '@/ai/sdr/jobs';

/**
 * Quick, synchronous mutations (no AI wait). The slow AI work — research,
 * call cards, emails, coaching, leads — lives in src/app/api/sdr/route.ts.
 */

function refresh() {
  revalidatePath('/', 'layout');
}

/**
 * "I'm calling / emailing X": finds the company Scout already knows (or
 * starts one) and keeps any notes Aaron pasted. Returns the account id
 * so the page can build the call card or email for it.
 */
export async function startOutreachAction(input: { company: string; website?: string; notes?: string }): Promise<{ accountId: string } | { error: string }> {
  const company = input.company.trim();
  if (!company) return { error: 'Who are you reaching out to?' };
  const { account } = findOrCreateAccount(company, input.website?.trim() || null);
  const addedNotes = input.notes ? saveCrmHistory(account.id, input.notes) : false;
  if (addedNotes) autoAssessHotList(account.id);
  refresh();
  return { accountId: account.id };
}

export async function saveCrmHistoryAction(accountId: string, text: string): Promise<void> {
  if (saveCrmHistory(accountId, text)) autoAssessHotList(accountId);
  refresh();
}

/**
 * Background Hot List check after new CRM notes land — a qualified-in
 * account goes onto the Hot List (or a dead one gets closed) without
 * Aaron having to ask. Not awaited; the page watches the job.
 */
function autoAssessHotList(accountId: string): void {
  runJob(jobKey('hotlist', accountId), async () => {
    const update = await assessHotList(accountId);
    applyHotListUpdate(accountId, update);
    return update;
  }).catch(() => undefined);
}

/**
 * One-tap logging for dials that don't need coaching: no answer, VM left.
 * Applies Aaron's no-pickup rule and returns the next move and tracker line.
 */
export async function quickLogCallAction(
  accountId: string,
  outcome: 'no_answer' | 'voicemail',
  contactName?: string
): Promise<{ nextMove: string; trackerLine: string } | null> {
  const account = getAccount(accountId);
  if (!account) return null;
  logActivity({
    accountId,
    accountName: account.name,
    channel: 'call',
    category: 'prospecting',
    outcome,
    contactName: contactName || null,
    rawNotes: null,
    crmNotes: [outcome === 'voicemail' ? `Left VM${contactName ? ` for ${contactName}` : ''}` : 'No answer'],
    coaching: null,
    connected: false,
    decisionMaker: false,
    relevant: false,
    meetingAsked: false,
    meetingBooked: false,
  });

  const noPickupCount = getActivitiesForAccount(accountId).filter((a) => a.channel === 'call' && (a.outcome === 'no_answer' || a.outcome === 'voicemail')).length;
  const card = getLatestDraft(accountId, 'call_card')?.data ?? null;
  const intel = getIntel(accountId)?.intel ?? null;
  const result = noPickupNextMove({
    company: account.name,
    contact: contactName || card?.target.name || null,
    phone: intel?.localOffice.phone || account.phone,
    outcome,
    noPickupCount,
    cardIfNoAnswer: card?.ifNoAnswer || null,
    angle: card?.angle || null,
  });

  recordHotListTouch(accountId, outcome === 'voicemail' ? `call: left VM${contactName ? ` for ${contactName}` : ''}` : 'call: no answer', 2);
  if (result.walkIn && getHotListEntry(accountId)) upsertHotList(accountId, { nextAction: 'walk_in' });
  refresh();
  return { nextMove: result.nextMove, trackerLine: result.trackerLine };
}

export interface SaveDebriefInput {
  channel: ActivityChannel;
  rawNotes: string;
  debrief: Debrief;
  /** Aaron's confirmed funnel flags — may differ from what the AI proposed. */
  funnel: Debrief['funnel'];
  category: 'prospecting' | 'admin';
  /** The confirmed Hot List change, or null to leave the Hot List alone. */
  hotList: HotListUpdate | null;
}

export async function saveDebriefAction(accountId: string, input: SaveDebriefInput): Promise<void> {
  const account = getAccount(accountId);
  if (!account) return;
  const { debrief, funnel } = input;
  const outcome = input.channel === 'email' ? 'email_reply' : funnel.meetingBooked ? 'meeting_booked' : debrief.outcome;

  logActivity({
    accountId,
    accountName: account.name,
    channel: input.channel,
    category: input.category,
    outcome,
    contactName: debrief.contactName || null,
    rawNotes: input.rawNotes,
    crmNotes: [...debrief.crmNotes, ...(debrief.status ? [`Status: ${debrief.status}`] : []), ...(debrief.crmNextStep ? [`Next step: ${debrief.crmNextStep}`] : [])],
    coaching: debrief,
    connected: funnel.connected,
    decisionMaker: funnel.decisionMaker,
    relevant: funnel.relevantConversation,
    meetingAsked: funnel.meetingAsked,
    meetingBooked: funnel.meetingBooked,
  });
  if (input.hotList) applyHotListUpdate(accountId, funnel.meetingBooked ? { ...input.hotList, decision: 'meeting_booked' } : input.hotList);
  refresh();
}

/** Logs a sent email (with any hand edits) and its CRM bullets. */
export async function markEmailSentAction(accountId: string, draftId: string, edited: Pick<EmailDraft, 'subject' | 'body' | 'crmNotes'>): Promise<void> {
  const account = getAccount(accountId);
  const latest = getLatestDraft(accountId, 'email');
  if (!account || !latest) return;
  if (latest.id === draftId) updateDraftData(draftId, { ...latest.data, ...edited });

  logActivity({
    accountId,
    accountName: account.name,
    channel: 'email',
    category: 'prospecting',
    outcome: 'email_sent',
    contactName: latest.data.contact.name || null,
    rawNotes: `Subject: ${edited.subject}\n\n${edited.body}`,
    crmNotes: edited.crmNotes,
    coaching: null,
    connected: false,
    decisionMaker: false,
    relevant: false,
    meetingAsked: true,
    meetingBooked: false,
  });
  recordHotListTouch(accountId, `email sent: "${edited.subject}"`, 3);
  refresh();
}

export async function saveEmailEditsAction(accountId: string, draftId: string, edited: Pick<EmailDraft, 'subject' | 'body'>): Promise<void> {
  const latest = getLatestDraft(accountId, 'email');
  if (!latest || latest.id !== draftId) return;
  updateDraftData(draftId, { ...latest.data, ...edited });
}

export async function deleteActivityAction(id: string): Promise<void> {
  deleteActivity(id);
  refresh();
}

export async function applyHotListUpdateAction(accountId: string, update: HotListUpdate): Promise<void> {
  applyHotListUpdate(accountId, update);
  refresh();
}

/** Inline edits from the Hot List (priority, stage, next touch, ...). */
export async function updateHotListAction(accountId: string, patch: HotListPatch): Promise<void> {
  upsertHotList(accountId, patch);
  refresh();
}

/** Turns a lead-finder suggestion into a company Scout knows, with its research attached so the call card is fast. */
export async function addLeadAction(candidateId: string): Promise<string | null> {
  const candidate = getLeadCandidate(candidateId);
  if (!candidate) return null;
  if (candidate.status === 'added' && candidate.accountId) return candidate.accountId;
  const lead = candidate.lead;

  const account = createAccount({ name: lead.company, domain: lead.domain || null, industry: lead.industry || null, address: lead.address || null, zip: lead.zip || null });
  const contact = lead.primaryContact;
  const intel: AccountIntel = {
    summary: lead.whyCall,
    localOffice: { address: lead.address, zip: lead.zip, inTerritory: 'yes', phone: contact.phone },
    parentCompany: '',
    headquarters: '',
    locations: '',
    employees: lead.employees,
    revenue: lead.revenue,
    signals: [lead.signal],
    people: contact.name ? [{ name: contact.name, title: contact.title, verified: false, sourceUrl: contact.linkedin }] : [],
    crmCorrections: [],
    decisionOwnership: '',
    sources: lead.sources,
  };
  saveIntel(account.id, intel, 'lead-finder');
  setLeadCandidateStatus(candidateId, 'added', account.id);
  refresh();
  return account.id;
}

export async function dismissLeadAction(candidateId: string): Promise<void> {
  setLeadCandidateStatus(candidateId, 'dismissed');
  refresh();
}

export async function saveSettingsAction(patch: Partial<Settings>): Promise<void> {
  updateSettings({
    ...(patch.ownerName !== undefined ? { ownerName: patch.ownerName.trim() } : {}),
    ...(patch.companyName !== undefined ? { companyName: patch.companyName.trim() } : {}),
    ...(patch.location !== undefined ? { location: patch.location.trim() } : {}),
    ...(patch.territoryZips !== undefined ? { territoryZips: patch.territoryZips } : {}),
    ...(patch.phoneNumber !== undefined ? { phoneNumber: patch.phoneNumber.trim() } : {}),
    ...(patch.claudeModel ? { claudeModel: patch.claudeModel === 'opus' ? 'opus' : 'sonnet' } : {}),
  });
  refresh();
}

/** Manual "qualified out" from the email log, with Aaron's reason. */
export async function qualifyOutAction(accountId: string, reason: string): Promise<void> {
  qualifyOut(accountId, reason);
  refresh();
}

/**
 * Manual "qualified in" from the email log: Scout fills the Hot List row
 * from the notes and history (same assessment as everywhere else), but
 * Aaron's call wins, so it always lands on the list.
 */
export async function qualifyInAction(accountId: string, reason: string): Promise<{ error: string } | null> {
  try {
    const update = await runJob(jobKey('hotlist', accountId), () => assessHotList(accountId));
    const stage = update.stage === 'meeting_booked' || update.stage === 'closed' ? 'new_qi' : update.stage;
    applyHotListUpdate(accountId, {
      ...update,
      decision: 'qualify_in',
      stage,
      reason: reason.trim() || update.reason,
      whyQualified: reason.trim() ? `${reason.trim()}${update.whyQualified ? `. ${update.whyQualified}` : ''}` : update.whyQualified,
    });
    refresh();
    return null;
  } catch (err) {
    // Scout couldn't fill the row; still honor Aaron's call with what he said.
    upsertHotList(accountId, { stage: 'new_qi', whyQualified: reason.trim() || 'Qualified in manually' });
    refresh();
    return { error: err instanceof Error ? err.message : 'Added without the full row; Claude was unavailable.' };
  }
}
