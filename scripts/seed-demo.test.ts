/**
 * Fills data/demo.db with the made-up companies in src/demo/seed.ts so the
 * dashboards can be seen full locally. Never touches data/scout.db.
 *   npm run demo            then open http://localhost:3001
 */
import fs from 'node:fs';
import path from 'node:path';
import { it } from 'vitest';

const DEMO = path.join(process.cwd(), 'data', 'demo.db');
fs.rmSync(DEMO, { force: true });
process.env.SCOUT_DB_PATH = DEMO;

const { seedDemo } = await import('@/demo/seed');

it('seeds', () => seedDemo(), 120_000);
