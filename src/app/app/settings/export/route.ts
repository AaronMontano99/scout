import { exportWorkspaceData } from '@/data/export';

// A real, working download — not a placeholder. See docs/PRODUCT_UX.md's
// Settings "Export Workspace Data" action.

export async function GET(): Promise<Response> {
  const data = exportWorkspaceData();
  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="scout-export-${date}.json"`,
    },
  });
}
