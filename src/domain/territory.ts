/**
 * Territory rules, enforced in code. Only offices/facilities in the
 * rep's ZIPs get prospected (HQ may be elsewhere if the local office is
 * in territory). The ZIP list comes from Settings (see identity.ts);
 * with no ZIPs configured, nothing is filtered.
 */

/** First 5-digit ZIP in a string ("Springfield, IL 62704-1234" → "62704"), or null. */
export function extractZip(text: string | null | undefined): string | null {
  const match = (text ?? '').match(/\b(\d{5})(?:-\d{4})?\b/);
  return match ? match[1]! : null;
}

export function isTerritoryZip(zipOrAddress: string | null | undefined, zips: string[]): boolean {
  if (zips.length === 0) return true;
  const zip = extractZip(zipOrAddress);
  return zip !== null && zips.includes(zip);
}

/** 'yes' / 'no' when the ZIP is known, 'unknown' otherwise — computed, never taken on the model's word. */
export function territoryStatus(zip: string | null | undefined, address: string | null | undefined, zips: string[]): 'yes' | 'no' | 'unknown' {
  if (zips.length === 0) return 'unknown';
  const found = extractZip(zip) ?? extractZip(address);
  if (!found) return 'unknown';
  return zips.includes(found) ? 'yes' : 'no';
}

/** "90010, 90012 90015" → ["90010","90012","90015"] */
export function parseZips(text: string): string[] {
  return [...new Set((text.match(/\b\d{5}\b/g) ?? []))];
}
