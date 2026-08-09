import { describe, expect, it } from 'vitest';
import {
  normalizeCompanyName,
  normalizeDomain,
  resolveAccount,
  confirmIdentityByUser,
  shouldSkipResolution,
  toIdentityStatus,
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

  it('a matching CRM external ID auto-applies — the strongest possible signal', () => {
    const withExternalId: ResolutionCandidate[] = [
      { accountId: 'acc-4', name: 'Something Totally Different Inc', externalId: 'crm-12345' },
    ];
    const result = resolveAccount({ name: 'Renamed Co', externalId: 'crm-12345' }, withExternalId);
    expect(result.verdict).toBe('auto_apply');
    expect(result.method).toBe('deterministic_external_id');
    expect(result.accountId).toBe('acc-4');
  });

  it('matching city+postal corroborates a normalized-name match same as domain would', () => {
    const withAddress: ResolutionCandidate[] = [
      { accountId: 'acc-5', name: 'Riverside Plumbing', city: 'San Jose', postalCode: '95112' },
    ];
    const result = resolveAccount(
      { name: 'Riverside Plumbing', city: 'San Jose', postalCode: '95112' },
      withAddress
    );
    expect(result.verdict).toBe('auto_apply');
    expect(result.method).toBe('normalized_name');
  });

  it('a postal-code-only match with no name match at all is not a signal on its own', () => {
    const withAddress: ResolutionCandidate[] = [
      { accountId: 'acc-6', name: 'Completely Unrelated LLC', city: 'San Jose', postalCode: '95112' },
    ];
    const result = resolveAccount({ name: 'Riverside Plumbing', postalCode: '95112' }, withAddress);
    expect(result.verdict).toBe('no_match');
  });
});

describe('confirmIdentityByUser — user correction outranks any inference', () => {
  it('always returns full confidence, auto_apply, regardless of algorithmic signals', () => {
    const result = confirmIdentityByUser('acc-7');
    expect(result).toEqual({ method: 'user_confirmed', verdict: 'auto_apply', accountId: 'acc-7', confidence: 1 });
  });
});

describe('shouldSkipResolution — persistent identity (product spec §9)', () => {
  it('skips only when status is confirmed', () => {
    expect(shouldSkipResolution('confirmed')).toBe(true);
    expect(shouldSkipResolution('likely_match')).toBe(false);
    expect(shouldSkipResolution('lower_confidence')).toBe(false);
    expect(shouldSkipResolution('review_recommended')).toBe(false);
    expect(shouldSkipResolution('unconfirmed')).toBe(false);
  });
});

describe('toIdentityStatus — maps internal match results to user-facing labels', () => {
  it('deterministic full-confidence matches become confirmed', () => {
    expect(toIdentityStatus({ method: 'deterministic_domain', verdict: 'auto_apply', accountId: 'a', confidence: 1 })).toBe(
      'confirmed'
    );
    expect(toIdentityStatus(confirmIdentityByUser('a'))).toBe('confirmed');
  });

  it('a weaker auto_apply (normalized_name + corroboration) becomes likely_match, not confirmed', () => {
    expect(
      toIdentityStatus({ method: 'normalized_name', verdict: 'auto_apply', accountId: 'a', confidence: 0.9 })
    ).toBe('likely_match');
  });

  it('review-verdict results split on confidence between lower_confidence and review_recommended', () => {
    expect(toIdentityStatus({ method: 'normalized_name', verdict: 'review', accountId: 'a', confidence: 0.6 })).toBe(
      'lower_confidence'
    );
    expect(toIdentityStatus({ method: 'fuzzy', verdict: 'review', accountId: 'a', confidence: 0.3 })).toBe(
      'review_recommended'
    );
  });

  it('no_match becomes unconfirmed', () => {
    expect(toIdentityStatus({ method: 'none', verdict: 'no_match', accountId: null, confidence: 0 })).toBe(
      'unconfirmed'
    );
  });
});
