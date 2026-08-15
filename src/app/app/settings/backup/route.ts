import fs from 'node:fs';
import path from 'node:path';
import { getDb } from '@/db/client';

// Real backup — streams the actual local SQLite file. See
// docs/LOCAL_MODE.md: sql.js persists to disk after every mutation, so
// this file is always current as of the last write.

const DB_PATH = process.env.SCOUT_DB_PATH ?? path.join(process.cwd(), 'data', 'scout.db');

export async function GET(): Promise<Response> {
  getDb(); // ensures the file exists even on a completely fresh workspace
  const bytes = fs.readFileSync(/* turbopackIgnore: true */ DB_PATH);
  const date = new Date().toISOString().slice(0, 10);
  return new Response(new Uint8Array(bytes), {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="scout-backup-${date}.db"`,
    },
  });
}
