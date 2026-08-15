import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getImport, getImportRows } from '@/data/imports';
import { ImportStepper } from '@/components/import-stepper';
import { Panel } from '@/components/ui/panel';
import { MicroLabel } from '@/components/ui/micro-label';

export default async function ValidateRowsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const importRecord = getImport(id);
  if (!importRecord) notFound();
  if (importRecord.status === 'uploaded') redirect(`/app/imports/${id}/map`);
  if (importRecord.status === 'completed' || importRecord.status === 'failed') redirect(`/app/imports/${id}/summary`);

  const rows = getImportRows(id);
  const ready = rows.filter((r) => r.resolutionStatus === 'pending').length;
  const needsReview = rows.filter((r) => r.resolutionStatus === 'needs_review').length;
  const failed = rows.filter((r) => r.resolutionStatus === 'failed').length;

  const tiles = [
    { label: 'Ready to Import', value: ready, of: rows.length, dot: 'bg-semantic-success' },
    { label: 'Needs Review', value: needsReview, of: rows.length, dot: 'bg-accent-warning' },
    { label: 'Ignored / Failed', value: failed, of: rows.length, dot: 'bg-semantic-error' },
  ];

  const failedRows = rows.filter((r) => r.error);

  return (
    <div className="flex flex-col gap-5">
      <ImportStepper current={3} />

      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-ink">Validate rows — {importRecord.fileName}</h1>
        <p className="mt-1 text-sm text-body">{rows.length} rows checked against your mapping and existing accounts.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {tiles.map((t) => (
          <Panel key={t.label} className="p-4">
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
              <span className="text-[12.5px] text-body">{t.label}</span>
            </div>
            <div className="mt-1.5 text-[22px] font-semibold text-ink">{t.value}</div>
            <div className="mt-0.5 text-[11.5px] text-muted">of {t.of} rows</div>
          </Panel>
        ))}
      </div>

      {failedRows.length > 0 && (
        <section>
          <div className="mb-2">
            <MicroLabel>Issues</MicroLabel>
          </div>
          <Panel className="overflow-hidden">
            {failedRows.map((r) => (
              <div key={r.id} className="border-b border-hairline px-4 py-3 text-sm last:border-b-0">
                <span className="font-mono text-xs text-muted">Row {r.rowNumber}</span> — {r.error}
              </div>
            ))}
          </Panel>
        </section>
      )}

      <div>
        {needsReview > 0 ? (
          <Link href={`/app/imports/${id}/resolve`}>
            <span className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary">
              Resolve {needsReview} Match{needsReview === 1 ? '' : 'es'}
            </span>
          </Link>
        ) : (
          <Link href={`/app/imports/${id}/summary`}>
            <span className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary">Continue to Import</span>
          </Link>
        )}
      </div>
    </div>
  );
}
