import Link from 'next/link';
import { listImports } from '@/data/imports';
import { uploadImportAction } from './actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/states';

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
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Imports</h1>
        <p className="mt-1 text-sm text-body">Bring accounts and contacts in from a CSV or XLSX spreadsheet.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-lg border border-hairline-strong bg-surface-card p-6">
          <h2 className="text-sm font-semibold text-ink">Upload a file</h2>
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
        </section>

        <aside className="flex flex-col gap-4">
          <div className="rounded-lg border border-hairline-strong bg-surface-card p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">What this creates</div>
            <ul className="mt-2 flex flex-col gap-2 text-xs text-body">
              <li>Accounts — one per row, matched against existing accounts when possible.</li>
              <li>Contacts — created if a contact-name column is mapped.</li>
              <li>Knowledge items — created if a notes/history column is mapped.</li>
            </ul>
          </div>
          <div className="rounded-lg border border-hairline-strong bg-surface-card p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">Rules</div>
            <ul className="mt-2 flex flex-col gap-2 text-xs text-body">
              <li>You confirm every column mapping — nothing is guessed silently.</li>
              <li>A possible duplicate is never merged automatically — you decide.</li>
              <li>Your list progress never resets after an import.</li>
            </ul>
          </div>
        </aside>
      </div>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Recent Imports</h2>
        {imports.length === 0 ? (
          <EmptyState title="No imports yet" body="Your uploaded files will show up here once you import your first one." />
        ) : (
          <div className="rounded-lg border border-hairline-strong bg-surface-card">
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
          </div>
        )}
      </section>
    </div>
  );
}
