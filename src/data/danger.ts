import { getDb } from '@/db/client';

/**
 * Destructive, single-user-only operations — see docs/PRODUCT_UX.md's
 * Settings "Delete Local Data" action. Deletes in dependency order
 * (leaf tables first) rather than relying on ON DELETE CASCADE being
 * configured identically everywhere, so this stays correct even where
 * a relation is ON DELETE SET NULL instead of CASCADE.
 */
const TABLES_LEAF_FIRST = [
  'analytics_events',
  'post_call_notes',
  'selling_situations',
  'call_outcomes',
  'seller_style_profiles',
  'target_list_items',
  'target_lists',
  'integrations',
  'import_rows',
  'imports',
  'account_score_components',
  'account_scores',
  'signals',
  'research_findings',
  'research_runs',
  'interactions',
  'contract_info',
  'knowledge_items',
  'sources',
  'account_contact_relationships',
  'contacts',
  'account_match_candidates',
  'accounts',
  'workspace_settings',
];

/** Wipes every real record in the local workspace. Never touches /demo — that's fixture data in a different code path entirely, not a database table. */
export function deleteAllLocalData(): void {
  const db = getDb();
  for (const table of TABLES_LEAF_FIRST) {
    db.prepare(`DELETE FROM ${table}`).run();
  }
}
