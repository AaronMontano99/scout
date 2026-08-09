import { describe, expect, it } from 'vitest';
import {
  normalizeCompanyName,
  normalizeDomain,
  resolveAccount,
  type ResolutionCandidate,
} from '@/domain/entity-resolution';

describe('normalizeCompanyName', () => {
  it('strips legal suffixes and punctuation, per ADR-0005 examples', () => {
    expect(normalizeCompanyName('ABC Inc.')).toBe('abc');
    expect(normalizeCompanyName('ABC Incorporated')).toBe('abc');
    expect(normalizeCompanyName('ABC, Inc')).toBe('abc');
  });
});

describe('normalizeDomain', () => {
  it('strips protocol, www, and paths', () => {
    expect(normalizeDomain('https://www.abc.com/about')).toBe('abc.com');
    expect(normalizeDomain('abc.com')).toBe('abc.com');
  });
});

describe('resolveAccount — ADR-0005 conservative auto-merge rule', () => {
  const existing: ResolutionCandidate[] = [
    { accountId: 'acc-1', name: 'ABC Inc', domain: 'abc.com' },
    { accountId: 'acc-2', name: 'Acme Construction' },
  ];

  it('auto-applies on deterministic domain match', () => {
    const result = resolveAccount({ name: 'ABC Incorporated', domain: 'abc.com' }, existing);
    expect(result.verdict).toBe('auto_apply');
    expect(result.method).toBe('deterministic_domain');
    expect(result.accountId).toBe('acc-1');
  });

  it('auto-applies on normalized name + corroborating domain (no conflict)', () => {
    const result = resolveAccount({ name: 'Acme Construction', domain: 'acmeconstruction.com' }, existing);
    expect(result.verdict).toBe('auto_apply');
    expect(result.method).toBe('normalized_name');
  });

  it('requires review for a name-only match with no domain signal at all', () => {
    const result = resolveAccount({ name: 'Acme Construction' }, existing);
    expect(result.verdict).toBe('review');
  });

  it('requires review — never auto-applies — when domain conflicts with the name match', () => {
    const result = resolveAccount({ name: 'ABC Inc', domain: 'somethingelse.com' }, existing);
    expect(result.verdict).toBe('review');
    expect(result.method).toBe('normalized_name');
  });

  it('requires review for fuzzy-only matches, never auto-applies', () => {
    // "Electrical" vs "Electric" is the one differing token — 3 of 4
    // tokens overlap (johnson, bay, service), similarity 0.6 — a real
    // near-duplicate, not an exact normalized-name match.
    const fuzzyExisting: ResolutionCandidate[] = [{ accountId: 'acc-3', name: 'Johnson Bay Electrical Service' }];
    const result = resolveAccount({ name: 'Johnson Bay Electric Service' }, fuzzyExisting);
    expect(result.verdict).toBe('review');
    expect(result.method).toBe('fuzzy');
  });

  it('returns no_match for genuinely unrelated names', () => {
    const result = resolveAccount({ name: 'Totally Different Company' }, existing);
    expect(result.verdict).toBe('no_match');
  });

  it('flags ambiguity — never auto-applies — when multiple accounts share a normalized name', () => {
    const ambiguous: ResolutionCandidate[] = [
      { accountId: 'acc-a', name: 'Acme Inc' },
      { accountId: 'acc-b', name: 'Acme LLC' },
    ];
    const result = resolveAccount({ name: 'Acme' }, ambiguous);
    expect(result.verdict).toBe('review');
  });
});
