import ExcelJS from 'exceljs';
import type { ImportProvider, ParsedTable, ImportTargetEntity, ColumnMappingSuggestion } from './import-provider';

/**
 * Real, local-first implementation of ImportProvider — see
 * docs/LOCAL_MODE.md and src/services/import-provider.ts's contract.
 * Deliberately no AI: inferColumnMapping is pure deterministic header
 * matching (that interface's own comment explicitly allows this).
 */

// --- CSV -------------------------------------------------------------
// Hand-rolled RFC-4180-ish parser: quoted fields (with embedded commas,
// newlines, and "" escaped quotes), CRLF/LF, trailing blank lines,
// UTF-8 BOM. No dependency needed for something this small — see
// AGENTS.md/CLAUDE.md's "don't overbuild" principle.

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  // Strip a UTF-8 BOM if present.
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === ',') {
      row.push(field);
      field = '';
      i += 1;
      continue;
    }
    if (char === '\r') {
      i += 1;
      continue;
    }
    if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i += 1;
      continue;
    }
    field += char;
    i += 1;
  }

  // Flush the final field/row (files don't always end with a newline).
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Drop fully-blank trailing rows a trailing newline can produce.
  return rows.filter((r) => !(r.length === 1 && r[0] === ''));
}

function rowsToTable(headers: string[], dataRows: string[][]): ParsedTable {
  const cleanHeaders = headers.map((h, i) => h.trim() || `Column ${i + 1}`);
  const rows = dataRows.map((r) => {
    const record: Record<string, string> = {};
    cleanHeaders.forEach((h, i) => {
      record[h] = (r[i] ?? '').trim();
    });
    return record;
  });
  return { headers: cleanHeaders, rows, rowCount: rows.length };
}

async function parseCsvBuffer(file: Buffer): Promise<ParsedTable> {
  const text = file.toString('utf-8');
  const grid = parseCsv(text);
  if (grid.length === 0) return { headers: [], rows: [], rowCount: 0 };
  const [headers, ...dataRows] = grid;
  return rowsToTable(headers ?? [], dataRows);
}

async function parseXlsxBuffer(file: Buffer): Promise<ParsedTable> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file as unknown as ExcelJS.Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return { headers: [], rows: [], rowCount: 0 };

  const grid: string[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const cells: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cells[colNumber - 1] = cell.text?.trim() ?? '';
    });
    grid.push(cells);
  });
  if (grid.length === 0) return { headers: [], rows: [], rowCount: 0 };
  const [headers, ...dataRows] = grid;
  return rowsToTable(headers ?? [], dataRows);
}

// --- Deterministic column mapping ------------------------------------
// Product spec's worked examples, matched case-insensitively against
// normalized (alphanumeric-only) header text.

const FIELD_SYNONYMS: Record<ImportTargetEntity extends never ? never : string, string[]> = {
  account_name: ['company', 'companyname', 'account', 'accountname', 'organization', 'organisation', 'business'],
  domain: ['website', 'domain', 'url', 'companywebsite', 'webaddress'],
  contact_name: ['contact', 'contactname', 'primarycontact', 'name', 'fullname'],
  contact_title: ['title', 'jobtitle', 'role', 'position'],
  contact_email: ['email', 'emailaddress', 'contactemail'],
  contact_phone: ['phone', 'phonenumber', 'telephone', 'contactphone'],
  knowledge_note: ['notes', 'crmnotes', 'history', 'note', 'comments', 'description'],
};

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Target-field guess for one column header — exported so validate/map UI can reuse it without duplicating the synonym table. */
export function guessFieldForHeader(header: string): string | null {
  const normalized = normalizeHeader(header);
  for (const [field, synonyms] of Object.entries(FIELD_SYNONYMS)) {
    if (synonyms.includes(normalized)) return field;
  }
  return null;
}

export const IMPORT_TARGET_FIELDS = [
  { id: 'account_name', label: 'Account Name' },
  { id: 'domain', label: 'Domain' },
  { id: 'contact_name', label: 'Contact Name' },
  { id: 'contact_title', label: 'Contact Title' },
  { id: 'contact_email', label: 'Contact Email' },
  { id: 'contact_phone', label: 'Contact Phone' },
  { id: 'knowledge_note', label: 'Note / History' },
  { id: 'ignore', label: 'Ignore this column' },
] as const;

export class LocalImportProvider implements ImportProvider {
  async parse(file: Buffer, fileType: 'csv' | 'xlsx'): Promise<ParsedTable> {
    return fileType === 'csv' ? parseCsvBuffer(file) : parseXlsxBuffer(file);
  }

  async inferColumnMapping(table: ParsedTable, _target: ImportTargetEntity): Promise<ColumnMappingSuggestion> {
    const mapping: Record<string, string> = {};
    const unmappedColumns: string[] = [];
    for (const header of table.headers) {
      const guess = guessFieldForHeader(header);
      if (guess) mapping[header] = guess;
      else unmappedColumns.push(header);
    }
    const confidence = table.headers.length === 0 ? 0 : 1 - unmappedColumns.length / table.headers.length;
    return { mapping, unmappedColumns, confidence };
  }
}

export const localImportProvider = new LocalImportProvider();
