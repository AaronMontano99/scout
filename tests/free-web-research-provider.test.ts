import { describe, expect, it } from 'vitest';
import { isDisallowedHost, parseRssItems, decodeEntities, extractTitle } from '@/services/free-web-research-provider';

// Pure parsing/safety logic only — no live network calls in tests.
// See src/services/free-web-research-provider.ts's header comment for
// the hard "never LinkedIn" rule this enforces.

describe('isDisallowedHost', () => {
  it('blocks linkedin.com and subdomains', () => {
    expect(isDisallowedHost('https://linkedin.com/company/acme')).toBe(true);
    expect(isDisallowedHost('https://www.linkedin.com/company/acme')).toBe(true);
    expect(isDisallowedHost('https://m.linkedin.com/company/acme')).toBe(true);
  });

  it('does not block unrelated domains, including ones that merely contain "linkedin" as a substring', () => {
    expect(isDisallowedHost('https://acme.com')).toBe(false);
    expect(isDisallowedHost('https://news.google.com/rss/search')).toBe(false);
    expect(isDisallowedHost('https://notlinkedin.com/page')).toBe(false);
    expect(isDisallowedHost('https://linkedin.com.evil.example/page')).toBe(false); // real host is evil.example, not linkedin.com — still correctly a different (if suspicious) host
  });

  it('treats malformed URLs as disallowed rather than throwing', () => {
    expect(isDisallowedHost('not a url')).toBe(true);
  });
});

describe('decodeEntities', () => {
  it('decodes the common HTML entities RSS feeds use', () => {
    expect(decodeEntities('Acme &amp; Co &lt;division&gt; &quot;R&amp;D&quot;')).toBe('Acme & Co <division> "R&D"');
    expect(decodeEntities('It&#39;s here')).toBe("It's here");
  });
});

describe('extractTitle', () => {
  it('pulls and decodes the page <title>', () => {
    expect(extractTitle('<html><head><title>Acme &amp; Co — Home</title></head></html>')).toBe('Acme & Co — Home');
  });

  it('returns null when there is no title tag', () => {
    expect(extractTitle('<html><body>no title here</body></html>')).toBeNull();
  });
});

describe('parseRssItems', () => {
  const sampleFeed = `<?xml version="1.0"?>
<rss><channel>
  <item>
    <title><![CDATA[Acme Corp announces expansion]]></title>
    <link>https://example.com/news/acme-expansion</link>
    <pubDate>Mon, 01 Jan 2026 12:00:00 GMT</pubDate>
    <description><![CDATA[Acme Corp today announced a new facility.]]></description>
  </item>
  <item>
    <title>Acme Corp on LinkedIn</title>
    <link>https://www.linkedin.com/company/acme</link>
    <pubDate>Tue, 02 Jan 2026 12:00:00 GMT</pubDate>
    <description>A LinkedIn result that must never be used.</description>
  </item>
</channel></rss>`;

  it('extracts title/link/pubDate/description per item, unwrapping CDATA', () => {
    const items = parseRssItems(sampleFeed);
    expect(items).toHaveLength(2);
    expect(items[0]!.title).toBe('Acme Corp announces expansion');
    expect(items[0]!.link).toBe('https://example.com/news/acme-expansion');
    expect(items[0]!.description).toContain('new facility');
  });

  it('never filters at the parse layer — callers (fetchCompanyNews) are responsible for excluding disallowed hosts like LinkedIn', () => {
    const items = parseRssItems(sampleFeed);
    const linkedinItem = items.find((i) => isDisallowedHost(i.link));
    expect(linkedinItem).toBeDefined(); // confirms the LinkedIn item IS present pre-filter
    // and confirms the exported isDisallowedHost is exactly what a caller should use to drop it
    expect(isDisallowedHost(linkedinItem!.link)).toBe(true);
  });

  it('returns an empty array for a feed with no items', () => {
    expect(parseRssItems('<rss><channel></channel></rss>')).toEqual([]);
  });
});
