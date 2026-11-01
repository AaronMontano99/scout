import { Download } from 'lucide-react';
import { getHotList } from '@/data/sdr';
import { ymd } from '@/domain/hot-list';
import { PageHeader } from '@/components/ui/page-header';
import { HotListBoard } from '@/components/sdr/hot-list-board';

// Hot List: the Qualified-IN pool. Accounts worth continued attention that
// don't have a meeting yet. Rows are added and updated automatically from
// call and email debriefs and pasted notes; the board just moves them.

export const dynamic = 'force-dynamic';

export default function HotListPage() {
  const entries = getHotList();

  return (
    <div className="rise flex flex-col">
      <PageHeader
        title="Hot List"
        subtitle="Qualified-IN accounts you're earning a meeting with. What did you learn last time, and what do you need to learn next?"
        actions={
          <a href="/hot-list/export" className="inline-flex items-center gap-2 rounded-full border border-hairline-strong px-4 py-2 text-[13.5px] font-medium hover:bg-surface-strong">
            <Download size={15} />
            Export to Excel
          </a>
        }
      />
      {entries.length === 0 ? (
        <div className="glass px-5 py-4 text-[14px] leading-[1.6] text-body">Nothing on the Hot List yet. Accounts land here when a call or email touch qualifies them in, or when your pasted notes show they&apos;re qualified in.</div>
      ) : (
        <HotListBoard entries={entries} today={ymd(new Date())} />
      )}
    </div>
  );
}
