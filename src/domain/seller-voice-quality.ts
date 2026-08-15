/**
 * Seller-voice hard rules — canonical banned-phrase lists PLUS the
 * regex-based lint that checks generated output against them. Same
 * shape/spirit as src/domain/brief-quality.ts's BriefLintIssue
 * pattern. See docs/SELLER_STYLE.md.
 *
 * This is the ONE source of truth for these lists — the domain layer
 * is the right home since it's pure and dependency-free, matching
 * every other file in src/domain/. src/ai/seller-voice/default-style.ts
 * imports these same lists to build the actual prompt text, so the
 * model is told to avoid exactly what the lint checks for; they can
 * never drift apart into two different lists.
 *
 * A cheap, repeatable guardrail — not a substitute for a human reading
 * the output. Catches the exact failure modes the product spec names:
 * cold-call acknowledgment, permission-based openers, corporate
 * jargon, AI-sounding filler, and excessive dash usage.
 */

export const COLD_CALL_ACKNOWLEDGMENT_PHRASES: string[] = [
  'this is a cold call',
  'i know this is a cold call',
  "i know i'm calling you out of the blue",
  "i know you weren't expecting my call",
  'i know this is unsolicited',
  'sorry to call you unexpectedly',
  'sorry to bother you',
  "i know i'm interrupting",
];

export const PERMISSION_OPENER_PHRASES: string[] = [
  'do you have 30 seconds',
  'can i have 30 seconds',
  'can i steal 30 seconds',
  'mind if i take 30 seconds',
  'did i catch you at a bad time',
  'can i quickly tell you why',
  'can i steal a minute',
  'would you hate me if i told you this was a sales call',
  "i know you're busy",
  "i'll be brief",
];

export const CORPORATE_JARGON_WORDS: string[] = [
  'leverage', 'synergy', 'synergies', 'unlock', 'transform', 'revolutionize',
  'supercharge', 'operational excellence', 'best-in-class', 'best in class',
  'cutting-edge', 'cutting edge', 'industry-leading', 'industry leading',
  'comprehensive suite', 'strategic objectives', 'optimize your ecosystem',
  'enhance efficiencies', 'holistic approach', 'robust solution',
];

export const AI_FILLER_PHRASES: string[] = [
  'i hope this email finds you well',
  "given your organization's focus on",
  "in today's rapidly evolving",
  'based on my research',
  'i noticed that your organization',
  "i'd love the opportunity to explore",
  'would you be open to exploring',
  'our comprehensive suite',
];

export interface SellerVoiceLintIssue {
  rule: 'cold_call_acknowledgment' | 'permission_opener' | 'corporate_jargon' | 'ai_filler' | 'excessive_dashes' | 'unfilled_placeholder';
  detail: string;
}

function findPhrases(text: string, phrases: string[], rule: SellerVoiceLintIssue['rule']): SellerVoiceLintIssue[] {
  const lower = text.toLowerCase();
  return phrases.filter((p) => lower.includes(p.toLowerCase())).map((p) => ({ rule, detail: `Contains: "${p}"` }));
}

export function lintColdCallAcknowledgment(text: string): SellerVoiceLintIssue[] {
  return findPhrases(text, COLD_CALL_ACKNOWLEDGMENT_PHRASES, 'cold_call_acknowledgment');
}

export function lintPermissionOpeners(text: string): SellerVoiceLintIssue[] {
  return findPhrases(text, PERMISSION_OPENER_PHRASES, 'permission_opener');
}

export function lintCorporateJargon(text: string): SellerVoiceLintIssue[] {
  return findPhrases(text, CORPORATE_JARGON_WORDS, 'corporate_jargon');
}

export function lintAiFiller(text: string): SellerVoiceLintIssue[] {
  return findPhrases(text, AI_FILLER_PHRASES, 'ai_filler');
}

// A rep's own saved "phrases to avoid" also get checked — passed in
// by the caller since those are per-user, not part of the fixed
// default lists above.
export function lintCustomPhrases(text: string, phrasesToAvoid: string[]): SellerVoiceLintIssue[] {
  return findPhrases(text, phrasesToAvoid, 'ai_filler');
}

const MAX_DASH_COUNT = 1; // one is tolerable (e.g. a phone number range); more reads as "AI wrote this"

export function lintExcessiveDashes(text: string): SellerVoiceLintIssue[] {
  const emDashCount = (text.match(/—/g) ?? []).length;
  const spacedHyphenCount = (text.match(/\s-\s/g) ?? []).length;
  const total = emDashCount + spacedHyphenCount;
  if (total > MAX_DASH_COUNT) {
    return [{ rule: 'excessive_dashes', detail: `${total} dash-separated clauses found, exceeds ${MAX_DASH_COUNT}` }];
  }
  return [];
}

// Matches unfilled template tokens like "[Your Company Name]" or
// "[insert industry]" — a small local model sometimes falls back to
// these when context is sparse (no contact or industry on file)
// instead of writing around the gap. Never acceptable in a real
// message, so this is a hard rule, not a style preference.
const PLACEHOLDER_PATTERN = /\[[A-Za-z][^[\]\n]{0,40}\]/g;

export function lintUnfilledPlaceholders(text: string): SellerVoiceLintIssue[] {
  const matches = [...new Set((text.match(PLACEHOLDER_PATTERN) ?? []).map((m) => m.trim()))];
  return matches.map((m) => ({ rule: 'unfilled_placeholder', detail: `Contains unfilled placeholder: ${m}` }));
}

/**
 * Full hard-rule pass over a generated communication. See
 * src/ai/seller-voice/generate.ts, which retries once (never more)
 * when this returns any issue, then returns the output regardless —
 * never silently fails a generation over a lint miss.
 */
export function lintSellerVoiceOutput(text: string, customPhrasesToAvoid: string[] = []): SellerVoiceLintIssue[] {
  return [
    ...lintColdCallAcknowledgment(text),
    ...lintPermissionOpeners(text),
    ...lintCorporateJargon(text),
    ...lintAiFiller(text),
    ...lintExcessiveDashes(text),
    ...lintUnfilledPlaceholders(text),
    ...lintCustomPhrases(text, customPhrasesToAvoid),
  ];
}
