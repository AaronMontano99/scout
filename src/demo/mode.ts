/**
 * The public demo: made-up companies in an in-memory database, seeded at
 * startup, with every write switched off and no AI. It never opens a file in
 * data/ or private/, so nothing real can reach it. Off unless this is set.
 */
export const DEMO = process.env.NEXT_PUBLIC_SCOUT_DEMO === '1';

export const DEMO_SAVE_MESSAGE = 'This is a demo, so saving is turned off.';
export const DEMO_AI_MESSAGE = 'The AI is turned off in this demo. Saved examples are on every account.';
