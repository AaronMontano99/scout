import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getImport, getImportRows } from '@/data/imports';
import { ImportStepper } from '@/components/import-stepper';
import { commitImportAction } from '../../actions';
import { Button } from '@/components/ui/button';

export default async function ImportSummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const importRecord = getImport(id);
  if (!importRecord) notFound();

  const rows = getImportRows(id);
  const needsReview = rows.filter((r) => r.resolutionStatus === 'needs_review').length;
  if (needsReview > 0) redirect(`/app/imports/${id}/resolve`);

  if (importRecord.status !== 'completed') {
    const commit = commitImportAction.bind(null, id);
    const failed = rows.filter((r) => r.resolutionStatus === 'failed').length;
    const willImport = rows.length - failed;

    return (
      <div className="flex flex-col gap-8">
        <ImportStepper current={5} />
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Ready to import — {importRecord.fileName}</h1>
          <p className="mt-1 text-sm text-body">
            {willImport} row{willImport === 1 ? '' : 's'} will be imported.
            {failed > 0 && ` ${failed} row${failed === 1 ? '' : 's'} will be skipped due to errors.`}
          </p>
        </header>
        <form action={commit}>
          <Button type="submit">Approve and Save to Scout</Button>
        </form>
      </div>
    );
  }

  const created = rows.filter((r) => r.resolutionStatus === 'imported');
  const failed = rows.filter((r) => r.resolutionStatus === 'failed');

  return (
    <div className="flex flex-col gap-8">
      <ImportStepper current={5} />
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Import complete — {importRecord.fileName}</h1>
        <p className="mt-1 text-sm text-body">
          {created.length} row{created.length === 1 ? '' : 's'} imported.
          {failed.length > 0 && ` ${failed.length} row${failed.length === 1 ? '' : 's'} could not be imported.`}
        </p>
      </header>

      {failed.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Review the {failed.length} failed rows</h2>
          <div className="rounded-lg border border-hairline-strong bg-surface-card">
            {failed.map((r) => (
              <div key={r.id} className="border-b border-hairline px-4 py-3 text-sm last:border-b-0">
                <span className="font-mono text-xs text-muted">Row {r.rowNumber}</span> — {r.error}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex gap-3">
        <Link href="/app/accounts" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary">
          View Accounts
        </Link>
        <Link href="/app/imports" className="rounded-md border border-hairline-strong bg-surface-card px-4 py-2 text-sm font-medium text-ink hover:bg-canvas-soft">
          Back to Imports
        </Link>
      </div>
    </div>
  );
}
