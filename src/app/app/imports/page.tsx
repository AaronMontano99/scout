import Link from 'next/link';
import { listImports } from '@/data/imports';
import { uploadImportAction } from './actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/states';
import { PageHeader } from '@/components/ui/page-header';
import { Panel } from '@/components/ui/panel';
import { MicroLabel } from '@/components/ui/micro-label';

const STATUS_LABEL: Record<string, string> = {
  uploaded: 'Uploaded',
  mapping: 'Mapping columns',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
};

function nextStepHref(id: string, status: string): string {
  if (status === 'completed' || status === 'failed') return `/app/imports/${id}/summary`;
  if (status === 'mapping') return `/app/imports/${id}/validate`;
  return `/app/imports/${id}/map`;
}

export default function ImportsPage() {
  const imports = listImports();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Imports" subtitle="Bring in a spreadsheet and turn it into a usable target list." />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Panel className="p-[18px_20px]">
          <div className="text-[15px] font-semibold text-ink">Upload a file</div>
          <form action={uploadImportAction} className="mt-4 flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm text-body">
              File (CSV or XLSX, up to 10MB)
              <input
                type="file"
                name="file"
                accept=".csv,.xlsx"
                required
                className="rounded-md border border-hairline-strong bg-surface-card px-3 py-2 text-sm text-ink file:mr-3 file:rounded-md file:border-0 file:bg-surface-strong file:px-3 file:py-1.5 file:text-xs file:font-medium"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-body">
              Add imported accounts to a new Target List (optional)
              <Input name="listName" placeholder="e.g. Q1 Import — East Region" />
            </label>
            <Button type="submit" className="self-start">
              Upload &amp; Continue
            </Button>
          </form>
        </Panel>

        <aside className="flex flex-col gap-4">
          <Panel className="p-4">
            <MicroLabel>What This Creates</MicroLabel>
            <ul className="mt-2.5 flex flex-col gap-2 text-xs text-body">
              <li>Accounts — one per row, matched against existing accounts when possible.</li>
              <li>Contacts — created if a contact-name column is mapped.</li>
              <li>Knowledge items — created if a notes/history column is mapped.</li>
            </ul>
          </Panel>
          <Panel className="p-4">
            <MicroLabel>Rules</MicroLabel>
            <ul className="mt-2.5 flex flex-col gap-2 text-xs text-body">
              <li>You confirm every column mapping — nothing is guessed silently.</li>
              <li>A possible duplicate is never merged automatically — you decide.</li>
              <li>Your list progress never resets after an import.</li>
            </ul>
          </Panel>
        </aside>
      </div>

      <section>
        <div className="mb-2">
          <MicroLabel>Recent Imports</MicroLabel>
        </div>
        {imports.length === 0 ? (
          <EmptyState title="No imports yet" body="Your uploaded files will show up here once you import your first one." />
        ) : (
          <Panel className="overflow-hidden">
            {imports.map((imp) => (
              <Link
                key={imp.id}
                href={nextStepHref(imp.id, imp.status)}
                className="flex items-center justify-between border-b border-hairline px-4 py-3 last:border-b-0 hover:bg-canvas-soft"
              >
                <div>
                  <div className="text-sm font-medium text-ink">{imp.fileName}</div>
                  <div className="text-xs text-muted">
                    {new Date(imp.createdAt).toLocaleDateString()} · {imp.rowCount} rows
                    {imp.errorCount > 0 && ` · ${imp.errorCount} failed`}
                  </div>
                </div>
                <span className="text-xs text-body">{STATUS_LABEL[imp.status] ?? imp.status}</span>
              </Link>
            ))}
          </Panel>
        )}
      </section>
    </div>
  );
}
