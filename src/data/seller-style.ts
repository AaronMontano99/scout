/**
 * Persistent Seller Style Memory — see docs/SELLER_STYLE.md. Per-rep
 * (per membership_id), distinct from Account Memory. In local mode
 * there is exactly one rep (src/auth's LOCAL_AUTH_CONTEXT), so this is
 * effectively "the local user's style" — but it's still keyed by
 * membership_id, not hardcoded, so the shape holds if that ever
 * changes. Never mixed with /demo's fixture profile (src/demo/index.ts).
 */
import { getDb } from '@/db/client';
import { getCurrentAuthContext } from '@/auth';
import type { SellerStyleProfile } from '@/types/product';

function uuid(): string {
  return crypto.randomUUID();
}
function nowIso(): string {
  return new Date().toISOString();
}
function row(sql: string, params: unknown[] = []): Record<string, unknown> | undefined {
  return getDb().prepare(sql).get(...(params as never[]));
}

export interface StyleRules {
  rules: string[];
  phrasesToAvoid: string[];
}

function parseJsonArray(text: string): string[] {
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseStyleRules(text: string | null): StyleRules {
  if (!text) return { rules: [], phrasesToAvoid: [] };
  try {
    const parsed = JSON.parse(text) as Partial<StyleRules>;
    return { rules: parsed.rules ?? [], phrasesToAvoid: parsed.phrasesToAvoid ?? [] };
  } catch {
    return { rules: [], phrasesToAvoid: [] };
  }
}

function mapProfile(r: Record<string, unknown>): SellerStyleProfile & { styleRules: StyleRules } {
  return {
    id: r.id as string,
    organizationId: 'local',
    membershipId: r.membership_id as string,
    sampleScripts: parseJsonArray(r.sample_scripts as string),
    sampleEmails: parseJsonArray(r.sample_emails as string),
    sampleVoicemails: parseJsonArray(r.sample_voicemails as string),
    toneNotes: (r.tone_notes as string | null) ?? null,
    updatedAt: r.updated_at as string,
    styleRules: parseStyleRules(r.style_rules as string | null),
  };
}

function currentMembershipId(): string {
  return getCurrentAuthContext().membership.id;
}

/** Creates an empty profile on first access — a rep always has *a* profile, even an untaught one, so callers never have to null-check before composing a prompt. */
export function getOrCreateSellerStyleProfile(): SellerStyleProfile & { styleRules: StyleRules } {
  const membershipId = currentMembershipId();
  const existing = row('SELECT * FROM seller_style_profiles WHERE membership_id = ?', [membershipId]);
  if (existing) return mapProfile(existing);

  const id = uuid();
  const now = nowIso();
  getDb()
    .prepare(
      `INSERT INTO seller_style_profiles (id, membership_id, sample_scripts, sample_emails, sample_voicemails, tone_notes, style_rules, updated_at)
       VALUES (?, ?, '[]', '[]', '[]', NULL, '{"rules":[],"phrasesToAvoid":[]}', ?)`
    )
    .run(id, membershipId, now);
  return mapProfile(row('SELECT * FROM seller_style_profiles WHERE id = ?', [id])!);
}

export function updateToneNotes(toneNotes: string): void {
  getOrCreateSellerStyleProfile(); // ensures a row exists
  getDb()
    .prepare(`UPDATE seller_style_profiles SET tone_notes = ?, updated_at = ? WHERE membership_id = ?`)
    .run(toneNotes, nowIso(), currentMembershipId());
}

/** Persists an explicit, durable rule — see docs/SELLER_STYLE.md's "explicit rules are stronger than inferred style." Never a one-time instruction; this is the "remember this" / "from now on" action. */
export function addStyleRule(rule: string): void {
  const profile = getOrCreateSellerStyleProfile();
  const next: StyleRules = { ...profile.styleRules, rules: [...profile.styleRules.rules, rule] };
  getDb()
    .prepare(`UPDATE seller_style_profiles SET style_rules = ?, updated_at = ? WHERE membership_id = ?`)
    .run(JSON.stringify(next), nowIso(), currentMembershipId());
}

export function removeStyleRule(rule: string): void {
  const profile = getOrCreateSellerStyleProfile();
  const next: StyleRules = { ...profile.styleRules, rules: profile.styleRules.rules.filter((r) => r !== rule) };
  getDb()
    .prepare(`UPDATE seller_style_profiles SET style_rules = ?, updated_at = ? WHERE membership_id = ?`)
    .run(JSON.stringify(next), nowIso(), currentMembershipId());
}

export function addPhraseToAvoid(phrase: string): void {
  const profile = getOrCreateSellerStyleProfile();
  const next: StyleRules = { ...profile.styleRules, phrasesToAvoid: [...profile.styleRules.phrasesToAvoid, phrase] };
  getDb()
    .prepare(`UPDATE seller_style_profiles SET style_rules = ?, updated_at = ? WHERE membership_id = ?`)
    .run(JSON.stringify(next), nowIso(), currentMembershipId());
}

export function removePhraseToAvoid(phrase: string): void {
  const profile = getOrCreateSellerStyleProfile();
  const next: StyleRules = { ...profile.styleRules, phrasesToAvoid: profile.styleRules.phrasesToAvoid.filter((p) => p !== phrase) };
  getDb()
    .prepare(`UPDATE seller_style_profiles SET style_rules = ?, updated_at = ? WHERE membership_id = ?`)
    .run(JSON.stringify(next), nowIso(), currentMembershipId());
}

export type SampleKind = 'sampleScripts' | 'sampleEmails' | 'sampleVoicemails';
const SAMPLE_COLUMN: Record<SampleKind, string> = {
  sampleScripts: 'sample_scripts',
  sampleEmails: 'sample_emails',
  sampleVoicemails: 'sample_voicemails',
};

/** Adds a rep-approved example — this is how a rep "teaches" Scout their voice (docs/SELLER_STYLE.md). */
export function addStyleExample(kind: SampleKind, example: string): void {
  const profile = getOrCreateSellerStyleProfile();
  const next = [...profile[kind], example];
  getDb()
    .prepare(`UPDATE seller_style_profiles SET ${SAMPLE_COLUMN[kind]} = ?, updated_at = ? WHERE membership_id = ?`)
    .run(JSON.stringify(next), nowIso(), currentMembershipId());
}

export function removeStyleExample(kind: SampleKind, example: string): void {
  const profile = getOrCreateSellerStyleProfile();
  const next = profile[kind].filter((e) => e !== example);
  getDb()
    .prepare(`UPDATE seller_style_profiles SET ${SAMPLE_COLUMN[kind]} = ?, updated_at = ? WHERE membership_id = ?`)
    .run(JSON.stringify(next), nowIso(), currentMembershipId());
}
