import { getDb } from '@/db/client';
import type { RepIdentity } from '@/domain/identity';

/**
 * Single-row settings, stored in the local database (never in git):
 * who's prospecting and where, the callback number for voicemails, and
 * which Claude model runs.
 */
export interface Settings {
  /** First name used on calls and email sign-offs. */
  ownerName: string;
  /** Company as said on calls ("[Name], Aaron with <company> here in <location>"). */
  companyName: string;
  /** Local reference used in openings, e.g. a city. */
  location: string;
  /** Territory ZIPs. Empty = no territory filter. */
  territoryZips: string[];
  /** Callback number used in voicemails. */
  phoneNumber: string;
  /** Claude model alias passed to the CLI: 'sonnet' (faster) or 'opus' (strongest writing). */
  claudeModel: 'sonnet' | 'opus';
}

const DEFAULTS: Settings = { ownerName: '', companyName: '', location: '', territoryZips: [], phoneNumber: '', claudeModel: 'sonnet' };

export function getSettings(): Settings {
  const r = getDb().prepare('SELECT data FROM settings WHERE id = ?').get('local');
  if (!r) return DEFAULTS;
  try {
    return { ...DEFAULTS, ...(JSON.parse(r.data as string) as Partial<Settings>) };
  } catch {
    return DEFAULTS;
  }
}

export function getIdentity(): RepIdentity {
  const s = getSettings();
  return { name: s.ownerName, company: s.companyName, location: s.location, zips: s.territoryZips };
}

export function updateSettings(patch: Partial<Settings>): Settings {
  const next = { ...getSettings(), ...patch };
  getDb()
    .prepare(
      `INSERT INTO settings (id, data, updated_at) VALUES ('local', ?, ?)
       ON CONFLICT (id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
    )
    .run(JSON.stringify(next), new Date().toISOString());
  return next;
}
