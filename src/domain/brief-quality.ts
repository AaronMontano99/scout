/**
 * Brief quality lint — see docs/AI_EVALUATIONS.md and product spec
 * §100, §57-58. A cheap, repeatable guardrail against the specific
 * failure modes the founder called out by name: hype language,
 * unsupported causality ("correlation dressed up as confident pain"),
 * and generic-corporate verbosity. Not a substitute for real human
 * review of AI output — a lightweight regression net that catches
 * obvious regressions (e.g. a prompt change that starts producing
 * "innovative market leader" copy again) cheaply and repeatably.
 */

// Product spec §100's own "bad" example: "innovative, rapidly evolving
// market leader poised for digital transformation."
const HYPE_WORDS = [
  'innovative', 'revolutionary', 'cutting-edge', 'cutting edge', 'game-changing',
  'game changing', 'industry-leading', 'industry leading', 'world-class', 'world class',
  'unparalleled', 'best-in-class', 'best in class', 'synergy', 'synergies', 'poised',
  'dynamic', 'robust', 'transformative', 'disruptive', 'paradigm',
];

// Product spec §57's disallowed example: "Acme is struggling with its
// MSP" from a fact as thin as "hiring an IT administrator." These
// patterns flag speculative-certainty phrasing, not the underlying
// topic — "may indicate" is fine, "clearly shows they are struggling"
// is not.
const UNSUPPORTED_CAUSALITY_PATTERNS = [
  /\bclearly (shows|indicates|proves|means)\b/i,
  /\bis struggling with\b/i,
  /\bproves that\b/i,
  /\bthis (definitely|certainly) means\b/i,
  /\bwithout (a )?doubt\b/i,
  /\bguaranteed to\b/i,
];

const MAX_WHAT_THEY_DO_WORDS = 40; // product spec §15: 1-2 sentences, not a biography

export interface BriefLintIssue {
  rule: 'hype_language' | 'unsupported_causality' | 'too_verbose';
  detail: string;
}

export function lintHypeLanguage(text: string): BriefLintIssue[] {
  const lower = text.toLowerCase();
  return HYPE_WORDS.filter((word) => lower.includes(word)).map((word) => ({
    rule: 'hype_language' as const,
    detail: `Contains hype word: "${word}"`,
  }));
}

export function lintUnsupportedCausality(text: string): BriefLintIssue[] {
  return UNSUPPORTED_CAUSALITY_PATTERNS.filter((pattern) => pattern.test(text)).map((pattern) => ({
    rule: 'unsupported_causality' as const,
    detail: `Matches unsupported-causality pattern: ${pattern.source}`,
  }));
}

export function lintVerbosity(text: string, maxWords = MAX_WHAT_THEY_DO_WORDS): BriefLintIssue[] {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount > maxWords) {
    return [{ rule: 'too_verbose', detail: `${wordCount} words, exceeds ${maxWords}-word guideline` }];
  }
  return [];
}

/** Full lint pass over a "what they do" style field — see CALL_READY_BRIEF.md. */
export function lintWhatTheyDo(text: string): BriefLintIssue[] {
  return [...lintHypeLanguage(text), ...lintUnsupportedCausality(text), ...lintVerbosity(text)];
}

/** Lint pass for bullet-style fields (What Matters, Talking Points) — no verbosity cap per-bullet, but hype/causality rules still apply. */
export function lintBullets(bullets: string[]): BriefLintIssue[] {
  return bullets.flatMap((b) => [...lintHypeLanguage(b), ...lintUnsupportedCausality(b)]);
}
