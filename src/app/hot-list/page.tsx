import { getHotList } from '@/data/sdr';
import { ymd } from '@/domain/hot-list';
import { PageHeader } from '@/components/ui/page-header';
import { HotListTable } from '@/components/sdr/hot-list-table';

// Hot List — the Qualified-IN prospect pool: accounts worth continued
// attention that don't have a meeting yet. Sorted so the top is always
// what needs attention today. Rows are added/updated automatically from
// call/email debriefs and pasted notes.

export const dynamic = 'force-dynamic';

export default function HotListPage() {
  const entries = getHotList();
  const today = ymd(new Date());

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-2">
      <PageHeader
        title="Hot List"
        subtitle="Qualified-IN accounts you're earning a meeting with. What did you learn last time, and what do you need to learn next?"
        actions={
          <a href="/hot-list/export" className="rounded-md border border-hairline-strong bg-surface-card px-4 py-2 text-[13px] font-medium text-ink hover:bg-canvas-soft">
            Export to Excel
          </a>
        }
      />
      {entries.length === 0 ? (
        <div className="rounded-lg border border-hairline-strong bg-surface-card px-5 py-4 text-[13.5px] leading-[1.6] text-body">
          Nothing on the Hot List yet. Accounts land here when a call or email touch qualifies them in, or when your pasted notes show they&apos;re qualified in.
        </div>
      ) : (
        <HotListTable entries={entries} today={today} />
      )}
    </div>
  );
}
