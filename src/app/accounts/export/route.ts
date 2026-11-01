import { getAccountDirectory } from '@/data/sdr';
import { STAGE_LABEL } from '@/domain/hot-list';
import { toCsv } from '@/domain/csv';

export const dynamic = 'force-dynamic';

export function GET() {
  const rows = getAccountDirectory().map((r) => [r.name, r.contact, r.stage ? STAGE_LABEL[r.stage] : '', r.priority ?? '', r.signal, r.phone ?? '', r.domain ?? '', r.zip ?? '', r.industry ?? '', r.lastTouchAt?.slice(0, 10) ?? '', r.touches, r.meetings, r.nextTouchDate ?? '']);
  const csv = toCsv(['Company', 'Contact', 'Stage', 'Priority', 'Signal', 'Phone', 'Website', 'ZIP', 'Industry', 'Last touch', 'Touches', 'Meetings', 'Next touch'], rows);
  return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="scout-accounts.csv"' } });
}
