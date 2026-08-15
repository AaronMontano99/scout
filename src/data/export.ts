import { getDb } from '@/db/client';

const EXPORT_TABLES = [
  'accounts',
  'contacts',
  'account_contact_relationships',
  'knowledge_items',
  'sources',
  'research_findings',
  'target_lists',
  'target_list_items',
  'call_outcomes',
  'selling_situations',
  'post_call_notes',
  'analytics_events',
] as const;

/** Full raw export of every real table — see docs/PRODUCT_UX.md's Settings "Export Workspace Data" action. Raw snake_case rows (not the camelCase domain shapes) so the export is a faithful, complete copy of what's actually stored. */
export function exportWorkspaceData(): Record<string, unknown> {
  const db = getDb();
  const data: Record<string, unknown> = { exportedAt: new Date().toISOString() };
  for (const table of EXPORT_TABLES) {
    data[table] = db.prepare(`SELECT * FROM ${table}`).all();
  }
  return data;
}
