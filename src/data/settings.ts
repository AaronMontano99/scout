import { getDb } from '@/db/client';

/**
 * Workspace/Sales-Profile settings — persisted, single local
 * workspace. See docs/PRODUCT_UX.md's Settings screen and
 * db/schema.sql's workspace_settings table.
 */

export interface WorkspaceSettings {
  workspaceName: string;
  ownerName: string;
  timezone: string;
  territory: string;
  whatYouSell: string;
  idealBuyerRoles: string;
  callStyle: string;
  /** Used in generated call scripts/voicemails as the callback number — see src/ai/seller-voice/. */
  phoneNumber: string;
}

const DEFAULTS: WorkspaceSettings = {
  workspaceName: 'My Workspace',
  ownerName: '',
  timezone: '',
  territory: '',
  whatYouSell: '',
  idealBuyerRoles: '',
  callStyle: '',
  phoneNumber: '',
};

export function getSettings(): WorkspaceSettings {
  const r = getDb().prepare('SELECT data FROM workspace_settings WHERE id = ?').get('local');
  if (!r) return DEFAULTS;
  try {
    return { ...DEFAULTS, ...(JSON.parse(r.data as string) as Partial<WorkspaceSettings>) };
  } catch {
    return DEFAULTS;
  }
}

export function updateSettings(patch: Partial<WorkspaceSettings>): WorkspaceSettings {
  const next = { ...getSettings(), ...patch };
  getDb()
    .prepare(
      `INSERT INTO workspace_settings (id, data, updated_at) VALUES ('local', ?, ?)
       ON CONFLICT (id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
    )
    .run(JSON.stringify(next), new Date().toISOString());
  return next;
}
