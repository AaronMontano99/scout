import { isSafeSourceUrl, stripHtml, detectPromptInjectionSignals } from '@/domain/research-security';
import type { ResearchProvider } from './research-provider';
import type { CompanyIdentifier, RawEvidence, EvidenceReference, SalesProfileContext } from '@/types/evidence';

/**
 * Real, free, local-first research provider — the concrete
 * implementation of the ResearchProvider contract in
 * research-provider.ts. Two sources, both public and keyless:
 *
 *  1. The company's own public website (their stated domain).
 *  2. Public news search via Google News' RSS feed — a feed
 *     explicitly designed for external consumption, not scraping.
 *
 * Hard rule, matching docs/PRODUCT_CONSTITUTION.md and
 * docs/INTEGRATIONS.md: this NEVER fetches or scrapes LinkedIn (or
 * any other login-walled platform). That's not a missing feature —
 * it's a permanent non-goal. Any result that happens to point at a
 * linkedin.com URL is filtered out before it's ever stored.
 */

const FETCH_TIMEOUT_MS = 5000;
const MAX_BODY_BYTES = 1_500_000; // 1.5MB — enough for a homepage, small enough to bound memory/latency
const MAX_CONTENT_CHARS = 2500;
const DISALLOWED_HOSTS = ['linkedin.com', 'www.linkedin.com'];

export function isDisallowedHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return DISALLOWED_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`));
  } catch {
    return true; // malformed URL — treat as disallowed, never fetched
  }
}

async function fetchWithLimits(url: string): Promise<string | null> {
  if (isDisallowedHost(url)) return null;
  const safety = isSafeSourceUrl(url);
  if (!safety.safe) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Scout-Local-Research/1.0 (+https://github.com/AaronMontano99/scout)' },
    });
    if (!res.ok) return null;

    const contentLength = res.headers.get('content-length');
    if (contentLength && Number(contentLength) > MAX_BODY_BYTES) return null;

    const reader = res.body?.getReader();
    if (!reader) return await res.text();

    const chunks: Uint8Array[] = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        received += value.byteLength;
        if (received > MAX_BODY_BYTES) {
          await reader.cancel();
          break;
        }
        chunks.push(value);
      }
    }
    return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf-8');
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeEntities(match[1]!.trim()).slice(0, 200) : null;
}

export function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&apos;/gi, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

async function fetchCompanyWebsite(domain: string, companyName: string): Promise<RawEvidence[]> {
  const url = `https://${domain}`;
  const html = await fetchWithLimits(url);
  if (!html) return [];

  const title = extractTitle(html) ?? companyName;
  const text = stripHtml(html).slice(0, MAX_CONTENT_CHARS);
  if (text.length < 40) return []; // too little real content to be useful

  return [
    {
      sourceName: title,
      sourceUrl: url,
      content: text,
      retrievedAt: new Date().toISOString(),
      confidence: 0.5,
    },
  ];
}

export interface RssItem {
  title: string;
  link: string;
  pubDate: string | null;
  description: string;
}

export function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

  for (const block of itemBlocks) {
    const title = extractRssField(block, 'title');
    const link = extractRssField(block, 'link');
    const pubDate = extractRssField(block, 'pubDate');
    const description = extractRssField(block, 'description');
    if (title && link) {
      // Decode entities BEFORE stripping tags — Google News RSS descriptions
      // contain HTML-encoded markup (e.g. "&lt;a href=...&gt;"), so stripping
      // tags first finds nothing and leaves literal HTML after decoding.
      items.push({
        title: stripHtml(decodeEntities(title)),
        link: link.trim(),
        pubDate,
        description: stripHtml(decodeEntities(description ?? '')),
      });
    }
  }
  return items;
}

function extractRssField(block: string, tag: string): string | null {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  if (!match) return null;
  const raw = match[1]!.trim();
  const cdata = raw.match(/^<!\[CDATA\[([\s\S]*)\]\]>$/);
  return cdata ? cdata[1]!.trim() : raw;
}

async function fetchCompanyNews(companyName: string, limit = 6): Promise<RawEvidence[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`"${companyName}"`)}&hl=en-US&gl=US&ceid=US:en`;
  const xml = await fetchWithLimits(url);
  if (!xml) return [];

  return parseRssItems(xml)
    .filter((item) => !isDisallowedHost(item.link))
    .slice(0, limit)
    .map((item) => ({
      sourceName: item.title,
      sourceUrl: item.link,
      content: item.description || item.title,
      retrievedAt: new Date().toISOString(),
      relevantDate: item.pubDate ? new Date(item.pubDate).toISOString() : undefined,
      confidence: 0.4,
    }));
}

export class FreeWebResearchProvider implements ResearchProvider {
  async searchCompany(input: CompanyIdentifier): Promise<RawEvidence[]> {
    if (!input.name && !input.domain) return [];
    const [siteEvidence, newsEvidence] = await Promise.all([
      input.domain ? fetchCompanyWebsite(input.domain, input.name ?? input.domain) : Promise.resolve([]),
      input.name ? fetchCompanyNews(input.name) : Promise.resolve([]),
    ]);
    return [...siteEvidence, ...newsEvidence].filter((e) => !e.sourceUrl || !isDisallowedHost(e.sourceUrl));
  }

  /** No AI provider exists in local mode to score relevance against a sales profile — this returns the same evidence as searchCompany, honestly, rather than fabricating a relevance judgment. */
  async findSignals(input: CompanyIdentifier, _salesProfile: SalesProfileContext): Promise<RawEvidence[]> {
    return this.searchCompany(input);
  }

  async retrieveEvidence(ref: EvidenceReference): Promise<RawEvidence> {
    const html = await fetchWithLimits(ref.externalId);
    if (!html) throw new Error(`Could not retrieve ${ref.externalId}`);
    return {
      sourceName: extractTitle(html) ?? ref.externalId,
      sourceUrl: ref.externalId,
      content: stripHtml(html).slice(0, MAX_CONTENT_CHARS),
      retrievedAt: new Date().toISOString(),
    };
  }
}

export const freeWebResearchProvider = new FreeWebResearchProvider();

/** Best-effort injection-signal flag for stored findings — informational only in local mode (no AI provider ingests this text), kept for when one is wired up. */
export function flagInjectionSignals(content: string): string[] {
  return detectPromptInjectionSignals(content);
}
