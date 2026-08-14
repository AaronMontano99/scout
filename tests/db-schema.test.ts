import { describe, expect, it, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import initSqlJs from 'sql.js';

// Standalone check of db/schema.sql itself — doesn't go through
// src/db/client.ts, so it never touches the real dev database. See
// docs/LOCAL_MODE.md.

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
  it('applies cleanly and creates every expected table', () => {
    db.run(schema);
    const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name");
    const tables: string[] = [];
    while (stmt.step()) tables.push(stmt.getAsObject().name as string);
    stmt.free();

    expect(tables).toEqual(
      [
        'account_contact_relationships',
        'account_match_candidates',
        'account_score_components',
        'account_scores',
        'accounts',
        'analytics_events',
        'call_outcomes',
        'contacts',
        'contract_info',
        'import_rows',
        'imports',
        'integrations',
        'interactions',
        'knowledge_items',
        'post_call_notes',
        'research_findings',
        'research_runs',
        'seller_style_profiles',
        'selling_situation_definitions',
        'selling_situations',
        'signals',
        'sources',
        'target_list_items',
        'target_lists',
      ].sort()
    );
  });

  it('re-applying is idempotent (CREATE TABLE IF NOT EXISTS throughout)', () => {
    expect(() => db.run(schema)).not.toThrow();
  });

  it('accepts a cross-referenced insert with no foreign key violations', () => {
    const now = '2026-01-01T00:00:00.000Z';
    db.run(`INSERT INTO accounts (id, name, normalized_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`, [
      'acc-1',
      'Acme',
      'acme',
      now,
      now,
    ]);
    db.run(`INSERT INTO contacts (id, account_id, first_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`, [
      'con-1',
      'acc-1',
      'Jane',
      now,
      now,
    ]);
    db.run(
      `INSERT INTO account_contact_relationships (id, account_id, contact_id, valid_from, created_at) VALUES (?, ?, ?, ?, ?)`,
      ['acr-1', 'acc-1', 'con-1', now, now]
    );
    db.run(`INSERT INTO target_lists (id, name, created_at) VALUES (?, ?, ?)`, ['tl-1', 'My List', now]);
    db.run(`INSERT INTO target_list_items (id, target_list_id, account_id, added_at) VALUES (?, ?, ?, ?)`, [
      'tli-1',
      'tl-1',
      'acc-1',
      now,
    ]);

    const stmt = db.prepare('PRAGMA foreign_key_check');
    const violations: unknown[] = [];
    while (stmt.step()) violations.push(stmt.getAsObject());
    stmt.free();
    expect(violations).toEqual([]);
  });
});
