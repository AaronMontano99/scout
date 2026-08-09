import { describe, expect, it } from 'vitest';
import { isStale, describeFreshness, canReuseCache, FRESHNESS_WINDOWS_DAYS } from '@/domain/freshness';

const NOW = new Date('2026-08-08T12:00:00Z');

describe('isStale', () => {
  it('internal_knowledge never goes stale, regardless of age', () => {
    expect(isStale('internal_knowledge', '2019-01-01T00:00:00Z', NOW)).toBe(false);
  });

  it('news goes stale faster than company_description (product spec §19 decay-rate ordering)', () => {
    const twentyDaysAgo = new Date(NOW.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString();
    expect(isStale('news', twentyDaysAgo, NOW)).toBe(true);
    expect(isStale('company_description', twentyDaysAgo, NOW)).toBe(false);
  });

  it('never-checked data is treated as stale, not fresh-by-default', () => {
    expect(isStale('news', null, NOW)).toBe(true);
  });

  it('freshness window ordering matches the product spec: news < leadership < contact_employment < company_description', () => {
    const news = FRESHNESS_WINDOWS_DAYS.news!;
    const leadership = FRESHNESS_WINDOWS_DAYS.leadership!;
    const contact = FRESHNESS_WINDOWS_DAYS.contact_employment!;
    const company = FRESHNESS_WINDOWS_DAYS.company_description!;
    expect(news).toBeLessThan(leadership);
    expect(leadership).toBeLessThan(contact);
    expect(contact).toBeLessThan(company);
  });
});

describe('describeFreshness', () => {
  it('renders plain, glance-level text — never blunt "STALE" for recent data', () => {
    expect(describeFreshness('news', NOW.toISOString(), NOW)).toBe('checked today');
  });

  it('flags staleness only once the category window has actually passed', () => {
    const fifteenDaysAgo = new Date(NOW.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString();
    expect(describeFreshness('news', fifteenDaysAgo, NOW)).toContain('potentially stale');
    expect(describeFreshness('company_description', fifteenDaysAgo, NOW)).not.toContain('stale');
  });

  it('handles never-checked data', () => {
    expect(describeFreshness('news', null, NOW)).toBe('not yet checked');
  });
});

describe('canReuseCache — smart refresh (product spec §20)', () => {
  it('a Monday research pass is still reusable Friday for slow-changing categories', () => {
    const monday = new Date(NOW.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(); // ~4 days before "Friday"
    expect(canReuseCache('company_description', monday, NOW)).toBe(true);
    expect(canReuseCache('internal_knowledge', monday, NOW)).toBe(true);
  });
});
