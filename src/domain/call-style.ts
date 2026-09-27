/**
 * Aaron's cold-call rules, hard-coded and enforced on every call card
 * (the playbook text in src/ai/sdr/playbooks.ts guides the model; this
 * is what gets CHECKED). Same pattern as email-style.ts:
 *
 *   1. normalizeCallCard() fixes mechanical things with no AI (dashes,
 *      the voicemail callback number).
 *   2. lintCallCard() checks the rules that need a rewrite; any issue
 *      triggers one targeted rewrite in src/ai/sdr/engine.ts.
 *
 * callStyleRulesText() renders these same rules into the model's
 * instructions so what it's told and what's checked never drift.
 */
import { COLD_CALL_ACKNOWLEDGMENT_PHRASES, PERMISSION_OPENER_PHRASES } from './phrases';
import type { RepIdentity } from './identity';

/** "[Name], Alex with Acme Office Systems here in Springfield. Reason for my call, ..." */
export function openingShape(id: Pick<RepIdentity, 'name' | 'company' | 'location'>): string {
  return `[Name], ${id.name || '[you]'} with ${id.company || '[your company]'}${id.location ? ` here in ${id.location}` : ''}. Reason for my call, ...`;
}

export const CALL_STYLE = {
  meetingAskShapes: [
    "Let's spend 10 minutes looking at how you handle it today and see if there's anything worth comparing.",
    'If everything looks good, we leave it there.',
  ],
  voicemailMinWords: 40,
  voicemailMaxWords: 115, // 20 to 40 seconds spoken
} as const;

/** Never on a call card. */
export const CALL_BANNED_PHRASES: string[] = [
  ...COLD_CALL_ACKNOWLEDGMENT_PHRASES,
  ...PERMISSION_OPENER_PHRASES,
  'how are you today',
  'how are you doing today',
  'is now a good time',
  'is this a bad time',
  'did i catch you',
  'just wanted to introduce',
  'just calling to introduce',
  'i wanted to introduce myself',
  'touch base',
  'just following up',
  'circling back',
];

/** Words that make the meeting sound like work — playbook MEETING CLOSE. */
export const MEETING_WORK_WORDS = ['assessment', 'full evaluation', 'evaluation', 'audit', 'demo', 'everything we offer', 'all of our services', 'full review'];

/** Playbook VM rule. */
export const VOICEMAIL_BANNED = ['nothing urgent', 'no rush', 'no hurry', 'not urgent', 'whenever you get a chance'];

const SERVICE_TERMS = ['copier', 'printer', 'managed print', 'managed it', 'cybersecurity', 'phone system', 'ucaas', 'verkada', 'brivo', 'camera', 'access control', 'ramp', 'papercut', 'wide-format', 'workflow automation'];

export interface CallStyleIssue {
  field: string;
  detail: string;
}

/** Replaces em/en dashes and spaced hyphens with commas. Aaron never uses them. */
export function stripDashes(text: string): string {
  return text
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/ - /g, ', ')
    .replace(/,\s*,/g, ',')
    .replace(/, ([.?!])/g, '$1')
    .replace(/^,\s*/, '');
}

/** Deep dash cleanup over every string in an object, leaving URLs alone. */
export function stripDashesDeep<T>(value: T): T {
  if (typeof value === 'string') return (/^https?:\/\//.test(value) ? value : stripDashes(value)) as T;
  if (Array.isArray(value)) return value.map((v) => stripDashesDeep(v)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, k === 'url' || k === 'sourceUrl' ? v : stripDashesDeep(v)])) as T;
  }
  return value;
}

export interface CallCardShape {
  opening: string;
  primaryQuestion: string;
  followUp: string;
  angle: string;
  meetingBridge: string;
  meetingAsk: string;
  voicemail: string;
  gatekeeper: string;
  reason: string;
  hypothesis: string;
}

export function normalizeCallCard<T extends CallCardShape>(card: T, repPhone: string): T {
  const clean = stripDashesDeep(card);
  if (repPhone) clean.voicemail = clean.voicemail.replace(/\[(phone|your number|number|callback number)\]/gi, repPhone);
  return clean;
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function has(text: string, phrase: string): boolean {
  return text.toLowerCase().includes(phrase.toLowerCase());
}

export function lintCallCard(card: CallCardShape, id: Pick<RepIdentity, 'name' | 'company' | 'location'>): CallStyleIssue[] {
  const issues: CallStyleIssue[] = [];
  const spoken: [string, string][] = [
    ['opening', card.opening],
    ['primaryQuestion', card.primaryQuestion],
    ['followUp', card.followUp],
    ['meetingBridge', card.meetingBridge],
    ['meetingAsk', card.meetingAsk],
    ['voicemail', card.voicemail],
    ['gatekeeper', card.gatekeeper],
  ];

  for (const [field, text] of spoken) {
    for (const p of CALL_BANNED_PHRASES) if (has(text, p)) issues.push({ field, detail: `${field}: remove "${p}"` });
  }

  const introduction = [id.name, id.company].filter(Boolean).join(' with ');
  if (introduction && !has(card.opening, introduction.includes(' with ') ? introduction : `${introduction} with`)) {
    issues.push({ field: 'opening', detail: `opening must use the shape "${openingShape(id)}"` });
  } else if (!/reason for my call/i.test(card.opening)) {
    issues.push({ field: 'opening', detail: 'opening must say "Reason for my call" right after the intro' });
  }

  if ((card.primaryQuestion.match(/\?/g) ?? []).length !== 1) issues.push({ field: 'primaryQuestion', detail: 'primaryQuestion must be exactly one question' });
  if ((card.followUp.match(/\?/g) ?? []).length > 1) issues.push({ field: 'followUp', detail: 'followUp is max one question' });

  if (!/\b10\b|\bten\b/i.test(card.meetingAsk) || !/minute/i.test(card.meetingAsk)) {
    issues.push({ field: 'meetingAsk', detail: `meetingAsk must ask for 10 minutes, low-risk, e.g. "${CALL_STYLE.meetingAskShapes.join(' ')}"` });
  }
  for (const field of ['meetingAsk', 'meetingBridge'] as const) {
    for (const w of MEETING_WORK_WORDS) if (has(card[field], w)) issues.push({ field, detail: `${field}: "${w}" makes the meeting sound like work` });
  }

  if (card.voicemail) {
    const words = wordCount(card.voicemail);
    if (words > CALL_STYLE.voicemailMaxWords) issues.push({ field: 'voicemail', detail: `voicemail is ${words} words; keep it 20 to 40 seconds (under ${CALL_STYLE.voicemailMaxWords} words)` });
    if (words < CALL_STYLE.voicemailMinWords) issues.push({ field: 'voicemail', detail: `voicemail is ${words} words; needs name, local context, reason, relevance, callback` });
    for (const p of VOICEMAIL_BANNED) if (has(card.voicemail, p)) issues.push({ field: 'voicemail', detail: `voicemail: never say "${p}"` });
  }

  if (/copier|printer/i.test(card.gatekeeper)) issues.push({ field: 'gatekeeper', detail: 'gatekeeper ask routes to who owns IT/ops/facilities/finance, never "who handles copiers"' });

  const services = SERVICE_TERMS.filter((t) => has(card.angle, t) && !new RegExp(`(don't|do not|skip|not)[^.]*${t}`, 'i').test(card.angle));
  if (services.length >= 3) issues.push({ field: 'angle', detail: `angle lists ${services.join(', ')}; ONE entry point only` });

  const allText = [card.reason, card.hypothesis, ...spoken.map(([, t]) => t)].join(' ');
  if (/\[[A-Za-z][^[\]\n]{0,40}\]/.test(allText)) issues.push({ field: 'card', detail: 'fill or remove [placeholders]' });

  return issues;
}

export function callStyleRulesText(id: Pick<RepIdentity, 'name' | 'company' | 'location'>): string {
  return [
    '# CALL RULES (hard rules, checked automatically after you write)',
    `Opening shape, always: "${openingShape(id)}"`,
    'primaryQuestion: exactly one question that tests the hypothesis. followUp: max one question, or empty.',
    `meetingAsk: 10 minutes, low risk: "${CALL_STYLE.meetingAskShapes.join(' ')}"`,
    `Never make the meeting sound like work: ${MEETING_WORK_WORDS.map((w) => `"${w}"`).join(', ')}.`,
    `Voicemail: 20 to 40 seconds (${CALL_STYLE.voicemailMinWords} to ${CALL_STYLE.voicemailMaxWords} words). Name, local context, reason, relevance, callback. Never ${VOICEMAIL_BANNED.map((p) => `"${p}"`).join(', ')}.`,
    'Gatekeeper: ask who owns IT, operations, facilities/access, or finance/AP. Never "who handles copiers".',
    'angle: ONE entry point. Never pitch everything.',
    `No em dashes, en dashes, or spaced hyphens anywhere. Never: ${CALL_BANNED_PHRASES.slice(0, 20).map((p) => `"${p}"`).join(', ')}.`,
  ].join('\n');
}
