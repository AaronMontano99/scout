import { notFound, redirect } from 'next/navigation';
import { getImport, getImportHeaders, getImportRows } from '@/data/imports';
import { guessFieldForHeader, IMPORT_TARGET_FIELDS } from '@/services/local-import-provider';
import { ImportStepper } from '@/components/import-stepper';
import { Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { MicroLabel } from '@/components/ui/micro-label';
import { saveMappingAction } from '../../actions';

export default async function MapColumnsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const importRecord = getImport(id);
  if (!importRecord) notFound();
  if (importRecord.status === 'completed' || importRecord.status === 'failed') {
    redirect(`/app/imports/${id}/summary`);
  }

  const headers = getImportHeaders(id);
  const sampleRow = getImportRows(id)[0];
  const action = saveMappingAction.bind(null, id);

  return (
    <div className="flex flex-col gap-5">
      <ImportStepper current={2} />

      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-ink">Map columns — {importRecord.fileName}</h1>
        <p className="mt-1 text-sm text-body">
          Scout guessed a mapping for obvious column names. Confirm or change each one before continuing — nothing
          is written until you import.
        </p>
      </div>

      <form action={action} className="flex flex-col gap-5">
        <Panel className="overflow-hidden">
          <div className="grid grid-cols-[180px_1fr_210px] gap-4 border-b border-hairline bg-canvas-soft px-5 py-2">
            <MicroLabel>Source Column</MicroLabel>
            <MicroLabel>Sample Value</MicroLabel>
            <MicroLabel>Scout Field</MicroLabel>
          </div>
          {headers.map((header) => {
            const guess = guessFieldForHeader(header) ?? 'ignore';
            return (
              <div key={header} className="grid grid-cols-[180px_1fr_210px] items-center gap-4 border-b border-hairline px-5 py-2.5 last:border-b-0">
                <div className="truncate text-[13px] font-medium text-ink">{header}</div>
                <div className="truncate text-[12.5px] text-muted">{sampleRow?.data[header] || '—'}</div>
                <Select name={`field:${header}`} defaultValue={guess}>
                  {IMPORT_TARGET_FIELDS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </Select>
              </div>
            );
          })}
        </Panel>

        <Button type="submit" className="self-start">
          Continue to Validation
        </Button>
      </form>
    </div>
  );
}
