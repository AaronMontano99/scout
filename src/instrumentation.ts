/** Builds the demo's in-memory database once, then locks it. Does nothing unless the demo flag is on. */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || process.env.NEXT_PUBLIC_SCOUT_DEMO !== '1') return;
  const { seedDemo } = await import('@/demo/seed');
  const { sealDb } = await import('@/db/client');
  seedDemo();
  sealDb();
}
