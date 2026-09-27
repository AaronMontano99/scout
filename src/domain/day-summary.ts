/**
 * "Day finished" — a tracker-ready breakdown of only the activity the
 * rep actually confirmed in Scout that day. Pure and dependency-free
 * (like the rest of src/domain) so it's easy to test. Never guesses:
 * every number is a count of logged rows, and the funnel read only
 * fires once there's enough activity to mean something.
 */

export type ActivityChannel = 'call' | 'email' | 'walk_in' | 'linkedin';

export interface ActivityRecord {
  id: string;
  accountId: string | null;
  accountName: string;
  channel: ActivityChannel;
  category: 'prospecting' | 'admin';
  /** For calls: a CallOutcomeType. For email: 'email_sent' | 'email_reply'. */
  outcome: string | null;
  contactName: string | null;
  rawNotes: string | null;
  crmNotes: string[];
  connected: boolean;
  decisionMaker: boolean;
  relevant: boolean;
  meetingAsked: boolean;
  meetingBooked: boolean;
  occurredAt: string;
}

export interface CallMetrics {
  dials: number;
  connects: number;
  voicemails: number;
  dmConversations: number;
  relevantConversations: number;
  meetingAsks: number;
  meetingsBooked: number;
}

export interface EmailMetrics {
  sent: number;
  replies: number;
  relevantReplies: number;
  meetingAsks: number;
  meetingsBooked: number;
}

export interface TouchMetrics {
  total: number;
  conversations: number;
  meetingAsks: number;
  meetingsBooked: number;
}

export interface BucketSummary {
  calls: CallMetrics;
  emails: EmailMetrics;
  walkIns: TouchMetrics;
  linkedin: TouchMetrics;
  total: number;
}

export interface DaySummary {
  prospecting: BucketSummary;
  admin: BucketSummary;
  accountsTouched: { name: string; channel: ActivityChannel; line: string }[];
  funnelRead: string[];
}

function emptyBucket(): BucketSummary {
  return {
    calls: { dials: 0, connects: 0, voicemails: 0, dmConversations: 0, relevantConversations: 0, meetingAsks: 0, meetingsBooked: 0 },
    emails: { sent: 0, replies: 0, relevantReplies: 0, meetingAsks: 0, meetingsBooked: 0 },
    walkIns: { total: 0, conversations: 0, meetingAsks: 0, meetingsBooked: 0 },
    linkedin: { total: 0, conversations: 0, meetingAsks: 0, meetingsBooked: 0 },
    total: 0,
  };
}

function addTouch(m: TouchMetrics, a: ActivityRecord): void {
  m.total += 1;
  if (a.connected) m.conversations += 1;
  if (a.meetingAsked) m.meetingAsks += 1;
  if (a.meetingBooked) m.meetingsBooked += 1;
}

export function summarizeDay(activities: ActivityRecord[]): DaySummary {
  const prospecting = emptyBucket();
  const admin = emptyBucket();

  for (const a of activities) {
    const b = a.category === 'admin' ? admin : prospecting;
    b.total += 1;
    if (a.channel === 'call') {
      b.calls.dials += 1;
      if (a.connected) b.calls.connects += 1;
      if (a.outcome === 'voicemail') b.calls.voicemails += 1;
      if (a.decisionMaker) b.calls.dmConversations += 1;
      if (a.relevant) b.calls.relevantConversations += 1;
      if (a.meetingAsked) b.calls.meetingAsks += 1;
      if (a.meetingBooked) b.calls.meetingsBooked += 1;
    } else if (a.channel === 'email') {
      if (a.outcome === 'email_reply') {
        b.emails.replies += 1;
        if (a.relevant) b.emails.relevantReplies += 1;
      } else {
        b.emails.sent += 1;
      }
      if (a.meetingAsked) b.emails.meetingAsks += 1;
      if (a.meetingBooked) b.emails.meetingsBooked += 1;
    } else if (a.channel === 'walk_in') {
      addTouch(b.walkIns, a);
    } else {
      addTouch(b.linkedin, a);
    }
  }

  const accountsTouched = activities.map((a) => ({
    name: a.accountName,
    channel: a.channel,
    line: describeActivity(a),
  }));

  return { prospecting, admin, accountsTouched, funnelRead: readFunnel(prospecting.calls) };
}

const OUTCOME_LABEL: Record<string, string> = {
  no_answer: 'No answer',
  voicemail: 'VM left',
  gatekeeper: 'Gatekeeper',
  general_staff: 'Spoke with staff',
  decision_maker: 'DM conversation',
  other_executive: 'Executive conversation',
  meeting_booked: 'Meeting booked',
  follow_up_required: 'Follow-up needed',
  not_interested: 'Not interested',
  wrong_contact: 'Wrong contact',
  connected: 'Connected',
  email_sent: 'Email sent',
  email_reply: 'Reply received',
};

function describeActivity(a: ActivityRecord): string {
  const parts = [OUTCOME_LABEL[a.outcome ?? ''] ?? (a.channel === 'walk_in' ? 'Walk-in' : a.channel === 'linkedin' ? 'LinkedIn touch' : 'Logged')];
  if (a.contactName) parts.push(a.contactName);
  if (a.meetingBooked) parts.push('meeting booked');
  else if (a.meetingAsked) parts.push('asked for meeting');
  return parts.join(', ');
}

/**
 * The playbook's funnel diagnostics, applied to call activity only:
 *   few DMs → targeting/contact issue
 *   few relevant talks → opening/hypothesis issue
 *   few asks → over-discovery/closing issue
 *   many asks/few meetings → meeting value/objection issue
 * Needs a minimum sample before saying anything.
 */
export function readFunnel(c: CallMetrics): string[] {
  const reads: string[] = [];
  if (c.dials < 8 || c.connects < 3) {
    return c.dials === 0 ? [] : ['Not enough connects today to read the funnel. Keep logging and it will show up.'];
  }
  if (c.dmConversations / c.connects < 0.3) {
    reads.push(`Few DM conversations (${c.dmConversations} of ${c.connects} connects). That's a targeting/contact issue: get direct lines and use gatekeepers for routing.`);
  }
  if (c.dmConversations >= 2 && c.relevantConversations / c.dmConversations < 0.5) {
    reads.push(`DMs aren't turning into relevant conversations (${c.relevantConversations} of ${c.dmConversations}). Look at the opening and hypothesis.`);
  }
  if (c.relevantConversations >= 2 && c.meetingAsks / c.relevantConversations < 0.6) {
    reads.push(`Relevant conversations without a meeting ask (${c.meetingAsks} asks on ${c.relevantConversations}). That's over-discovery; ask sooner.`);
  }
  if (c.meetingAsks >= 3 && c.meetingsBooked / c.meetingAsks < 0.2) {
    reads.push(`Asking but not booking (${c.meetingsBooked} of ${c.meetingAsks}). Tighten the meeting value and objection handling.`);
  }
  if (reads.length === 0) reads.push('No obvious leak in the call funnel today.');
  return reads;
}

function callLine(c: CallMetrics): string | null {
  if (c.dials === 0) return null;
  return `Calls: ${c.dials} dials · ${c.connects} connects · ${c.dmConversations} DM conversations · ${c.relevantConversations} relevant conversations · ${c.meetingAsks} meeting asks · ${c.meetingsBooked} meetings booked · ${c.voicemails} VMs left`;
}
function emailLine(e: EmailMetrics): string | null {
  if (e.sent === 0 && e.replies === 0) return null;
  return `Emails: ${e.sent} sent · ${e.replies} replies · ${e.relevantReplies} relevant replies · ${e.meetingsBooked} meetings booked`;
}
function touchLine(label: string, t: TouchMetrics): string | null {
  if (t.total === 0) return null;
  return `${label}: ${t.total} · ${t.conversations} conversations · ${t.meetingAsks} meeting asks · ${t.meetingsBooked} meetings booked`;
}

function bucketLines(b: BucketSummary): string[] {
  return [callLine(b.calls), emailLine(b.emails), touchLine('Walk-ins', b.walkIns), touchLine('LinkedIn', b.linkedin)].filter(
    (l): l is string => l !== null
  );
}

/** Plain-text version, ready to paste into a tracker. */
export function formatDaySummary(summary: DaySummary, dateLabel: string): string {
  const out: string[] = [`DAY FINISHED: ${dateLabel}`, ''];
  const p = bucketLines(summary.prospecting);
  out.push('PROSPECTING / REACTIVATION');
  out.push(...(p.length ? p : ['No prospecting activity logged.']));
  const a = bucketLines(summary.admin);
  if (a.length) {
    out.push('', 'ADMIN / CUSTOMER SERVICE', ...a);
  }
  if (summary.accountsTouched.length) {
    out.push('', 'ACCOUNTS TOUCHED');
    for (const t of summary.accountsTouched) out.push(`- ${t.name} (${t.channel.replace('_', '-')}): ${t.line}`);
  }
  if (summary.funnelRead.length) {
    out.push('', 'FUNNEL READ', ...summary.funnelRead.map((r) => `- ${r}`));
  }
  return out.join('\n');
}

export const WALK_IN_AFTER_NO_PICKUPS = 3;

/**
 * Aaron's no-pickup rule: after repeated no-pickups, stop burning calls
 * and move the account to the walk-in list. Returns the next move and a
 * tracker-ready line ("Company — Contact — Phone — No pickup — Next move — Angle").
 */
export function noPickupNextMove(input: {
  company: string;
  contact: string | null;
  phone: string | null;
  outcome: 'no_answer' | 'voicemail';
  noPickupCount: number;
  cardIfNoAnswer: string | null;
  angle: string | null;
}): { walkIn: boolean; nextMove: string; trackerLine: string } {
  const walkIn = input.noPickupCount >= WALK_IN_AFTER_NO_PICKUPS;
  const nextMove = walkIn
    ? `${input.noPickupCount} no-pickups logged. Stop burning calls here: move to the walk-in list.${input.cardIfNoAnswer ? ` ${input.cardIfNoAnswer}` : ''}`
    : input.cardIfNoAnswer || (input.outcome === 'voicemail' ? 'VM left. Try a different day and time next.' : 'Leave a VM next time, then try a different day and time.');
  const trackerLine = [
    input.company,
    input.contact || 'Unknown contact',
    input.phone || 'No phone on file',
    input.outcome === 'voicemail' ? 'No pickup, VM left' : 'No pickup',
    walkIn ? 'Move to walk-in list' : 'Retry',
    input.angle || '',
  ]
    .filter(Boolean)
    .join(' — ');
  return { walkIn, nextMove, trackerLine };
}
