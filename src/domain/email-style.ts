/**
 * Aaron's email style, hard-coded. The playbook (.md) guides the
 * model, but this file is what's ENFORCED on every email and post-call
 * email before he sees it:
 *
 *   1. normalizeEmail() fixes the mechanical stuff deterministically
 *      (dashes, greeting, sign-off, spacing) with no AI involved.
 *   2. lintEmail() checks the style rules that need a rewrite to fix
 *      (banned phrases, length, one CTA, no lists, no hype). Any issue
 *      triggers one targeted rewrite in src/ai/sdr/engine.ts.
 *
 * The same constants are rendered into the model's instructions by
 * emailStyleRulesText(), so what the model is told and what gets
 * checked can never drift apart. Pure and dependency-free.
 */
import { CORPORATE_JARGON_WORDS, AI_FILLER_PHRASES } from './phrases';

export const EMAIL_STYLE = {
  greeting: (firstName: string) => (firstName ? `Hi ${firstName},` : 'Hi,'),
  signOff: (repName: string) => (repName ? `Thanks,\n${repName}` : 'Thanks,'),
  minWords: 45,
  maxWords: 110,
  maxSubjectWords: 6,
  /** CTA must ask for a short conversation — these are the approved shapes. */
  preferredCtas: [
    'Is that worth a 15-minute conversation?',
    'Would it make sense to spend 15 minutes comparing how you handle this today?',
    'Is this still something worth revisiting for 15 minutes?',
    'Would Tuesday or Wednesday work for a 15-minute conversation?',
  ],
  /** Hypothesis language — assumptions framed as questions, never facts. */
  hypothesisPhrases: ['I was curious whether', 'Not assuming', 'Has that changed since we last spoke?', 'Did you ever end up'],
} as const;

/** Never in an email. Case-insensitive substring match. */
export const EMAIL_BANNED_PHRASES: string[] = [
  // Playbook: filler openers and lazy follow-ups
  'hope this finds you well',
  'hope you are doing well',
  "hope you're doing well",
  'hope all is well',
  'hope your week',
  'closing off your week',
  'just following up',
  'following up on my',
  'just checking in',
  'checking in',
  'touching base',
  'touch base',
  'circling back',
  'circle back',
  'bumping this',
  'bump this',
  'reaching out to see',
  // Playbook: vague asks
  'worth a quick chat',
  'quick chat',
  'open to connecting',
  'hop on a call',
  'pick your brain',
  // Fake enthusiasm / marketing voice
  "i'd love to",
  'i would love to',
  'excited to',
  'thrilled',
  'game-changer',
  'game changer',
  'look forward to hearing from you',
  'please feel free to reach out',
  'feel free to reach out',
  "don't hesitate to",
  'at your earliest convenience',
  // Promo / service-dump patterns from the email that failed
  'buyout of competitive contracts',
  'many companies are taking advantage',
  'in addition to copiers, we offer',
  'we offer a wide range',
  'full suite of',
  'one-stop shop',
  ...CORPORATE_JARGON_WORDS,
  ...AI_FILLER_PHRASES,
];

export interface EmailStyleIssue {
  rule:
    | 'banned_phrase'
    | 'too_long'
    | 'too_short'
    | 'no_cta_question'
    | 'multiple_ctas'
    | 'cta_not_short_meeting'
    | 'bullet_list'
    | 'exclamation'
    | 'placeholder'
    | 'subject_too_long'
    | 'subject_hype'
    | 'service_list';
  detail: string;
}

const SERVICE_TERMS = ['copier', 'printer', 'managed print', 'managed it', 'cybersecurity', 'phones', 'ucaas', 'verkada', 'brivo', 'cameras', 'access control', 'ramp', 'papercut', 'wide-format', 'postage', 'internet'];

/**
 * Deterministic cleanup — no AI. Fixes dashes, forces Aaron's greeting
 * and sign-off, collapses stray whitespace, and keeps short paragraphs.
 */
export function normalizeEmail(body: string, contactFirstName: string, repName: string, company = ''): string {
  let text = body.replace(/\r\n/g, '\n').trim();

  // Dashes: Aaron never uses them. Em/en dashes and spaced hyphens between clauses become commas.
  text = text
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/ - /g, ', ')
    .replace(/,\s*,/g, ',')
    .replace(/, ([.?!])/g, '$1');

  // Strip any greeting line the model wrote; we add the canonical one.
  const lines = text.split('\n');
  if (/^(hi|hey|hello|dear|good (morning|afternoon))\b[^\n]{0,40},?\s*$/i.test(lines[0]?.trim() ?? '')) lines.shift();

  // Strip any sign-off block at the end; we add the canonical one.
  while (lines.length > 0) {
    const last = lines[lines.length - 1]!.trim();
    if (last === '' || /^(thanks|thank you|best|best regards|regards|cheers|sincerely|talk soon)[,!.]?$/i.test(last) || (repName !== '' && last.toLowerCase().startsWith(repName.toLowerCase())) || (company !== '' && last.toLowerCase() === company.toLowerCase())) {
      lines.pop();
    } else break;
  }

  const bodyText = lines
    .join('\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return `${EMAIL_STYLE.greeting(contactFirstName)}\n\n${bodyText}\n\n${EMAIL_STYLE.signOff(repName)}`;
}

/** Subject cleanup: no trailing punctuation hype, no dashes, sentence-like. */
export function normalizeSubject(subject: string): string {
  return subject
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/[!]+/g, '')
    .replace(/^re:\s*/i, '')
    .trim();
}

/** The body between greeting and sign-off. */
function coreBody(email: string): string {
  const withoutGreeting = email.replace(/^(hi|hey|hello)[^\n]*\n+/i, '');
  return withoutGreeting.replace(/\n+thanks,?\s*(\n[^\n]*)?\s*$/i, '').trim();
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * ctaType 'meeting' (default) must close with one question asking for 15
 * minutes. ctaType 'question' is Aaron's "get the answer first" email:
 * it must ask a business question somewhere and must not be forced into
 * a meeting ask.
 */
export function lintEmail(subject: string, email: string, ctaType: 'meeting' | 'question' = 'meeting'): EmailStyleIssue[] {
  const issues: EmailStyleIssue[] = [];
  const lower = email.toLowerCase();
  const body = coreBody(email);

  for (const phrase of EMAIL_BANNED_PHRASES) {
    if (lower.includes(phrase.toLowerCase())) issues.push({ rule: 'banned_phrase', detail: `Remove "${phrase}"` });
  }

  const words = countWords(body);
  if (words > EMAIL_STYLE.maxWords) issues.push({ rule: 'too_long', detail: `${words} words; cut to ${EMAIL_STYLE.maxWords} or fewer (target 60 to 100)` });
  if (words < EMAIL_STYLE.minWords) issues.push({ rule: 'too_short', detail: `${words} words; needs real context and a reason (target 60 to 100)` });

  const paragraphs = body.split(/\n\s*\n/).filter((p) => p.trim());
  const lastParagraph = paragraphs[paragraphs.length - 1] ?? '';
  const questions = body.match(/\?/g) ?? [];
  if (ctaType === 'question') {
    if (questions.length === 0) issues.push({ rule: 'no_cta_question', detail: 'Ask the one business question you need answered' });
  } else {
    if (!lastParagraph.includes('?')) issues.push({ rule: 'no_cta_question', detail: 'End with one clear question asking for 15 minutes' });
    else if (!/15|fifteen/i.test(lastParagraph)) issues.push({ rule: 'cta_not_short_meeting', detail: 'The ask should be for a 15-minute conversation' });
    if ((lastParagraph.match(/\?/g) ?? []).length > 1) issues.push({ rule: 'multiple_ctas', detail: 'Only one question in the closing ask' });
  }
  if (questions.length > 3) issues.push({ rule: 'multiple_ctas', detail: `${questions.length} questions; keep to one hypothesis question and one ask` });

  if (/^\s*([-*•]|\d+[.)])\s+/m.test(body)) issues.push({ rule: 'bullet_list', detail: 'No bullets or numbered lists; write short paragraphs' });
  if (/!/.test(body)) issues.push({ rule: 'exclamation', detail: 'No exclamation points' });
  if (/\[[A-Za-z][^[\]\n]{0,40}\]/.test(email)) issues.push({ rule: 'placeholder', detail: 'Fill or remove the [placeholder]' });

  const servicesMentioned = SERVICE_TERMS.filter((t) => lower.includes(t));
  if (servicesMentioned.length >= 3) {
    issues.push({ rule: 'service_list', detail: `Mentions ${servicesMentioned.join(', ')}; use ONE angle, never a service list` });
  }

  if (countWords(subject) > EMAIL_STYLE.maxSubjectWords) issues.push({ rule: 'subject_too_long', detail: `Subject is ${countWords(subject)} words; keep it to ${EMAIL_STYLE.maxSubjectWords} or fewer` });
  if (/unlock|transform|opportunit|exclusive|limited time|save \d|%/i.test(subject)) issues.push({ rule: 'subject_hype', detail: 'Subject reads like marketing; make it plain, e.g. "Jordan, quick question"' });

  return issues;
}

/** The same rules, as text for the model's instructions. */
export function emailStyleRulesText(repName: string): string {
  return [
    '# EMAIL STYLE (hard rules, checked automatically after you write)',
    `Greeting is exactly "Hi [First name]," and sign-off is exactly "Thanks," then "${repName || '[your name]'}" on the next line.`,
    `Body (between greeting and sign-off): ${EMAIL_STYLE.minWords} to ${EMAIL_STYLE.maxWords} words, target 60 to 100, usually 3 short paragraphs.`,
    'Paragraph 1: human context and the specific reason (the CRM thread or the real signal).',
    `Paragraph 2: one hypothesis framed as a question, never as fact (${EMAIL_STYLE.hypothesisPhrases.map((p) => `"${p}..."`).join(', ')}), plus one line of relevant proof only if real.`,
    `Paragraph 3 (ctaType "meeting"): exactly one question asking for 15 minutes. Approved shapes: ${EMAIL_STYLE.preferredCtas.map((c) => `"${c}"`).join(' / ')}`,
    'ctaType "question" (more info needed first): ask the one business question, no meeting ask yet.',
    'No em dashes, en dashes, or spaced hyphens. No exclamation points. No bullets. No bracketed placeholders.',
    'ONE angle. Never list services.',
    `Subject: ${EMAIL_STYLE.maxSubjectWords} words max, plain, like "Jordan, quick question".`,
    `Never use: ${EMAIL_BANNED_PHRASES.slice(0, 40).map((p) => `"${p}"`).join(', ')}.`,
  ].join('\n');
}
