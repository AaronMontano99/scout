import path from 'node:path';
import fs from 'node:fs';
import initSqlJs from 'sql.js';

type SqlStatic = Awaited<ReturnType<typeof initSqlJs>>;
type SqlJsDatabase = InstanceType<SqlStatic['Database']>;
export type SqlValue = number | string | Uint8Array | null;

/**
 * All SQLite connection construction is centralized here — no other
 * file should import sql.js directly (enforced by eslint.config.mjs's
 * no-restricted-imports rule). Local-first mode: a single file on
 * disk, no accounts, no services to run — see docs/LOCAL_MODE.md.
 *
 * sql.js (WASM SQLite, no native addon) rather than a native driver
 * like better-sqlite3: zero compiled binaries to distribute per
 * platform, so this open-source tool has nothing to fail to build for
 * a contributor or user on an unusual OS/arch/Node combination — see
 * docs/LOCAL_MODE.md for the fuller rationale. The tradeoff is that
 * sql.js keeps the whole database in memory and has no incremental
 * on-disk writer, so getDb() below re-serializes and rewrites the
 * whole file after every mutation — entirely fine at the scale this
 * tool is for (one person's prospecting list), not a good idea at
 * multi-gigabyte scale.
 */

// SCOUT_DB_PATH override exists for test isolation (see tests/data-accessor.test.ts)
// so tests don't read/write the real dev database — not a general config knob.
const DB_PATH = process.env.SCOUT_DB_PATH ?? path.join(process.cwd(), 'data', 'scout.db');
const SCHEMA_PATH = path.join(process.cwd(), 'db', 'schema.sql');

const SQL = await initSqlJs();

function persist(db: SqlJsDatabase): void {
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

function openOrCreate(): SqlJsDatabase {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const isNew = !fs.existsSync(/* turbopackIgnore: true */ DB_PATH);
  const db = isNew ? new SQL.Database() : new SQL.Database(fs.readFileSync(/* turbopackIgnore: true */ DB_PATH));
  db.run('PRAGMA foreign_keys = ON;');
  // CREATE TABLE IF NOT EXISTS throughout db/schema.sql, so re-running
  // this on every process start is idempotent and harmless.
  db.run(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
  // Persist immediately on first creation so data/scout.db exists on
  // disk as soon as the app starts, not only after the first write —
  // a read-only session (e.g. a build's static-generation pass) would
  // otherwise never flush the in-memory db to disk at all.
  if (isNew) persist(db);
  return db;
}

/** Minimal better-sqlite3-shaped wrapper over a sql.js in-memory Database. */
class PreparedStatement {
  constructor(
    private readonly db: SqlJsDatabase,
    private readonly sql: string
  ) {}

  get(...params: SqlValue[]): Record<string, unknown> | undefined {
    const stmt = this.db.prepare(this.sql);
    try {
      stmt.bind(params);
      return stmt.step() ? (stmt.getAsObject() as Record<string, unknown>) : undefined;
    } finally {
      stmt.free();
    }
  }

  all(...params: SqlValue[]): Record<string, unknown>[] {
    const stmt = this.db.prepare(this.sql);
    try {
      stmt.bind(params);
      const results: Record<string, unknown>[] = [];
      while (stmt.step()) results.push(stmt.getAsObject() as Record<string, unknown>);
      return results;
    } finally {
      stmt.free();
    }
  }

  run(...params: SqlValue[]): void {
    this.db.run(this.sql, params);
    persist(this.db);
  }
}

export interface ScoutDb {
  prepare(sql: string): PreparedStatement;
}

let instance: ScoutDb | undefined;

/** Singleton local SQLite connection, created (and schema-applied) on first use. */
export function getDb(): ScoutDb {
  if (instance) return instance;

  const db = openOrCreate();
  instance = { prepare: (sql: string) => new PreparedStatement(db, sql) };
  return instance;
}
