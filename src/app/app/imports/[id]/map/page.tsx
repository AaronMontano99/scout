import { notFound, redirect } from 'next/navigation';
import { getImport, getImportHeaders, getImportRows } from '@/data/imports';
import { guessFieldForHeader, IMPORT_TARGET_FIELDS } from '@/services/local-import-provider';
import { ImportStepper } from '@/components/import-stepper';
import { Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
    <div className="flex flex-col gap-8">
      <ImportStepper current={2} />

      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Map columns — {importRecord.fileName}</h1>
        <p className="mt-1 text-sm text-body">
          Scout guessed a mapping for obvious column names. Confirm or change each one before continuing — nothing
          is written until you import.
        </p>
      </header>

      <form action={action} className="flex flex-col gap-6">
        <div className="overflow-x-auto rounded-lg border border-hairline-strong bg-surface-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-2 font-medium">Source Column</th>
                <th className="px-4 py-2 font-medium">Sample Value</th>
                <th className="px-4 py-2 font-medium">Maps To</th>
              </tr>
            </thead>
            <tbody>
              {headers.map((header) => {
                const guess = guessFieldForHeader(header) ?? 'ignore';
                return (
                  <tr key={header} className="border-b border-hairline last:border-b-0">
                    <td className="px-4 py-2 font-medium text-ink">{header}</td>
                    <td className="max-w-xs truncate px-4 py-2 text-body">{sampleRow?.data[header] || '—'}</td>
                    <td className="px-4 py-2">
                      <Select name={`field:${header}`} defaultValue={guess}>
                        {IMPORT_TARGET_FIELDS.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.label}
                          </option>
                        ))}
                      </Select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Button type="submit" className="self-start">
          Continue to Validation
        </Button>
      </form>
    </div>
  );
}
