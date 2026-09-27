/**
 * Who is prospecting, and where. Comes from Settings (stored in the
 * local database, never in git), so the rules in call-style.ts,
 * email-style.ts, and territory.ts stay generic in the code while
 * enforcing the rep's exact opening, sign-off, and territory.
 */
export interface RepIdentity {
  /** First name as used on calls and email sign-offs, e.g. "Aaron". */
  name: string;
  /** Company as said on calls, e.g. "Acme Office Systems". */
  company: string;
  /** Local reference used in openings, e.g. "Springfield". */
  location: string;
  /** Territory ZIPs. Empty means no territory filter. */
  zips: string[];
}
