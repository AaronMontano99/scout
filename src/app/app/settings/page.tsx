import Link from 'next/link';
import { getSettings } from '@/data/settings';
import { saveSettingsAction } from './actions';
import { Input, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Settings — the control surface for the local app. Every field here
// persists to workspace_settings; every provider status is honest
// (Available / Not configured / Unavailable), never a fake connection.
// See docs/PRODUCT_UX.md.

const PROVIDERS: { label: string; help: string; status: string; dot: string }[] = [
  { label: 'CSV / XLSX Import', help: 'Local, deterministic column mapping — no AI required.', status: 'Available', dot: 'bg-semantic-success' },
  { label: 'Research Provider', help: 'No live web/news research provider is connected.', status: 'Not configured', dot: 'bg-muted' },
  { label: 'AI Provider', help: 'Optional — not required to use Scout locally.', status: 'Not configured', dot: 'bg-muted' },
  { label: 'CRM Adapter', help: 'Future extension point — no CRM writeback exists yet.', status: 'Unavailable', dot: 'bg-muted' },
];

const PRODUCT_RULES = [
  'Scout never hides a denominator behind a rate.',
  'Scout distinguishes KNOWN, INFERRED, and SUGGESTED everywhere, always.',
  'Your data stays local — nothing is sent to a server you don’t control.',
  'Nothing is invented — every fact traces back to something you entered or imported.',
  'Demo data and your real workspace are never mixed.',
];

export default function SettingsPage() {
  const settings = getSettings();

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Settings</h1>
        <p className="mt-1 text-sm text-body">Workspace profile, provider status, and data controls.</p>
      </header>

      <form action={saveSettingsAction} className="flex flex-col gap-8">
        <section className="rounded-lg border border-hairline-strong bg-surface-card p-6">
          <h2 className="text-sm font-semibold text-ink">Workspace</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm text-body">
              Workspace name
              <Input name="workspaceName" defaultValue={settings.workspaceName} />
            </label>
            <label className="flex flex-col gap-1 text-sm text-body">
              Owner / your name
              <Input name="ownerName" defaultValue={settings.ownerName} />
            </label>
            <label className="flex flex-col gap-1 text-sm text-body">
              Timezone
              <Input name="timezone" defaultValue={settings.timezone} placeholder="e.g. America/Los_Angeles" />
            </label>
            <label className="flex flex-col gap-1 text-sm text-body">
              Territory
              <Input name="territory" defaultValue={settings.territory} placeholder="e.g. West Region" />
            </label>
          </div>
        </section>

        <section className="rounded-lg border border-hairline-strong bg-surface-card p-6">
          <h2 className="text-sm font-semibold text-ink">Sales Profile</h2>
          <div className="mt-4 flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm text-body">
              What you sell
              <Textarea name="whatYouSell" defaultValue={settings.whatYouSell} rows={2} />
            </label>
            <label className="flex flex-col gap-1 text-sm text-body">
              Ideal buyer roles
              <Input name="idealBuyerRoles" defaultValue={settings.idealBuyerRoles} placeholder="e.g. IT Director, VP Operations" />
            </label>
            <label className="flex flex-col gap-1 text-sm text-body">
              Preferred call style
              <Input name="callStyle" defaultValue={settings.callStyle} placeholder="e.g. Direct, consultative" />
            </label>
          </div>
        </section>

        <Button type="submit" className="self-start">
          Save Settings
        </Button>
      </form>

      <section className="rounded-lg border border-hairline-strong bg-surface-card p-6">
        <h2 className="text-sm font-semibold text-ink">Providers</h2>
        <div className="mt-4 flex flex-col gap-3">
          {PROVIDERS.map((p) => (
            <div key={p.label} className="flex items-center justify-between gap-4 border-b border-hairline pb-3 last:border-b-0 last:pb-0">
              <div>
                <div className="text-sm font-medium text-ink">{p.label}</div>
                <div className="text-xs text-body">{p.help}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${p.dot}`} />
                <span className="text-xs text-body">{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-hairline-strong bg-surface-card p-6">
        <h2 className="text-sm font-semibold text-ink">Data</h2>
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-ink">Export Workspace Data</div>
              <div className="text-xs text-body">Download every real record as a single JSON file.</div>
            </div>
            <a href="/app/settings/export" className="rounded-md border border-hairline-strong bg-surface-card px-3 py-1.5 text-xs font-medium text-ink hover:bg-canvas-soft">
              Export
            </a>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-ink">Back Up Database</div>
              <div className="text-xs text-body">Download the actual data/scout.db file.</div>
            </div>
            <a href="/app/settings/backup" className="rounded-md border border-hairline-strong bg-surface-card px-3 py-1.5 text-xs font-medium text-ink hover:bg-canvas-soft">
              Back Up
            </a>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-ink">Delete Local Data</div>
              <div className="text-xs text-body">Permanently erase everything in this workspace.</div>
            </div>
            <Link href="/app/settings/delete-local-data" className="rounded-md border border-hairline-strong bg-surface-card px-3 py-1.5 text-xs font-medium text-semantic-error hover:bg-canvas-soft">
              Delete
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-lg bg-surface-dark p-6 text-on-dark">
        <h2 className="text-sm font-semibold">Product Rules</h2>
        <ul className="mt-3 flex flex-col gap-2 text-xs text-on-dark-soft">
          {PRODUCT_RULES.map((rule) => (
            <li key={rule}>· {rule}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
