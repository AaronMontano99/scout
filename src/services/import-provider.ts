/**
 * CSV/XLSX — the V1 universal integration, treated as a first-class
 * adapter (same pattern as every other provider) rather than a special
 * case. See docs/INTEGRATIONS.md and docs/DATA_MODEL.md §Import/ImportRow.
 *
 * Unused in local-first mode (docs/LOCAL_MODE.md) — CSV import is
 * manual-entry-only for now (no AI-assisted column mapping). This
 * interface doesn't actually require `inferColumnMapping`'s suggestion
 * to be AI-generated, so it's kept as the contract a future manual
 * (checkbox/dropdown) column-mapper UI could satisfy.
 */

export interface ParsedTable {
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
}

export type ImportTargetEntity = 'account' | 'contact' | 'knowledge_item';

export interface ColumnMappingSuggestion {
  mapping: Record<string, string>; // sourceColumn -> target field
  unmappedColumns: string[];
  confidence: number;
}

export interface ImportProvider {
  parse(file: Buffer, fileType: 'csv' | 'xlsx'): Promise<ParsedTable>;
  /** AI-assisted suggestion — always human-confirmed before import runs, never auto-applied silently. */
  inferColumnMapping(
    table: ParsedTable,
    target: ImportTargetEntity
  ): Promise<ColumnMappingSuggestion>;
}
