import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getImport, getReviewRows } from '@/data/imports';
import { ImportStepper } from '@/components/import-stepper';
import { Panel } from '@/components/ui/panel';
import { resolveImportRowAction } from '../../actions';

export default async function ResolveMatchesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const importRecord = getImport(id);
  if (!importRecord) notFound();
  if (importRecord.status === 'completed' || importRecord.status === 'failed') redirect(`/app/imports/${id}/summary`);

  const rows = getReviewRows(id);
  if (rows.length === 0) redirect(`/app/imports/${id}/validate`);

  return (
    <div className="flex flex-col gap-5">
      <ImportStepper current={4} />

      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-ink">Resolve matches — {importRecord.fileName}</h1>
        <p className="mt-1 text-sm text-body">
          {rows.length} row{rows.length === 1 ? '' : 's'} may already exist as an account. Decide each one before importing.
        </p>
      </div>

      <Panel>
        {rows.map((r) => {
          const merge = resolveImportRowAction.bind(null, id, r.id, 'merge');
          const createNew = resolveImportRowAction.bind(null, id, r.id, 'create_new');
          const rawName = Object.values(r.data).find((v) => v) ?? `Row ${r.rowNumber}`;
          return (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-4 py-3 last:border-b-0">
              <div>
                <div className="text-sm font-medium text-ink">
                  Row {r.rowNumber}: {rawName}
                </div>
                <div className="text-xs text-muted">May match existing account: {r.candidateAccountName ?? 'Unknown'}</div>
              </div>
              <div className="flex gap-2">
                <form action={merge}>
                  <button type="submit" className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-on-primary">
                    Merge into {r.candidateAccountName ?? 'existing'}
                  </button>
                </form>
                <form action={createNew}>
                  <button
                    type="submit"
                    className="rounded-md border border-hairline-strong bg-surface-card px-3 py-1.5 text-xs font-medium text-ink hover:bg-canvas-soft"
                  >
                    Create as New
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </Panel>

      <Link href={`/app/imports/${id}/validate`} className="text-xs text-text-link hover:underline">
        ← Back to Validation
      </Link>
    </div>
  );
}
