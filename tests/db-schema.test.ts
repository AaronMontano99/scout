import { describe, expect, it, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';

// Standalone check of db/schema.sql itself — doesn't go through
// src/db/client.ts, so it never touches the real database.

const schemaPath = path.join(import.meta.dirname, '..', 'db', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');

type SqlStatic = Awaited<ReturnType<typeof initSqlJs>>;
type SqlJsDatabase = InstanceType<SqlStatic['Database']>;

let db: SqlJsDatabase;

beforeAll(async () => {
  const SQL = await initSqlJs();
  db = new SQL.Database();
  db.run('PRAGMA foreign_keys = ON;');
});

describe('db/schema.sql', () => {
  it('applies cleanly and creates exactly the tables Scout uses', () => {
    db.run(schema);
    const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name");
    const tables: string[] = [];
    while (stmt.step()) tables.push(stmt.getAsObject().name as string);
    stmt.free();

    expect(tables).toEqual(
      ['accounts', 'crm_notes', 'sdr_activities', 'sdr_drafts', 'sdr_favorites', 'sdr_hotlist', 'sdr_hotlist_checks', 'sdr_intel', 'sdr_lead_candidates', 'sdr_tasks', 'settings'].sort()
    );
  });

  it('re-applying is idempotent', () => {
    expect(() => db.run(schema)).not.toThrow();
  });

  it('cascades an account delete to its notes, research, drafts, and Hot List row', () => {
    const now = new Date().toISOString();
    db.run(`INSERT INTO accounts (id, name, normalized_name, created_at, updated_at) VALUES ('a1', 'Northgate Fabrication', 'northgate fabrication', ?, ?)`, [now, now]);
    db.run(`INSERT INTO crm_notes (id, account_id, content, created_at) VALUES ('n1', 'a1', 'Front desk routes calls', ?)`, [now]);
    db.run(`INSERT INTO sdr_intel (account_id, data, researched_at) VALUES ('a1', '{}', ?)`, [now]);
    db.run(`INSERT INTO sdr_drafts (id, account_id, kind, data, created_at) VALUES ('d1', 'a1', 'call_card', '{}', ?)`, [now]);
    db.run(`INSERT INTO sdr_hotlist (account_id, added_at, updated_at) VALUES ('a1', ?, ?)`, [now, now]);
    db.run(
      `INSERT INTO sdr_activities (id, account_id, account_name, channel, occurred_at, created_at) VALUES ('x1', 'a1', 'Northgate Fabrication', 'call', ?, ?)`,
      [now, now]
    );

    db.run(`DELETE FROM accounts WHERE id = 'a1'`);
    const count = (table: string) => db.exec(`SELECT COUNT(*) FROM ${table}`)[0]!.values[0]![0];
    expect(count('crm_notes')).toBe(0);
    expect(count('sdr_intel')).toBe(0);
    expect(count('sdr_drafts')).toBe(0);
    expect(count('sdr_hotlist')).toBe(0);
    // Logged activity survives (Day finished history), just unlinked.
    expect(count('sdr_activities')).toBe(1);
  });
});
