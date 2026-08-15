import Link from 'next/link';
import { getSettings } from '@/data/settings';
import { saveSettingsAction } from './actions';
import { Input, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Panel } from '@/components/ui/panel';

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

function SectionCard({ n, title, help, children }: { n: number; title: string; help?: string; children: React.ReactNode }) {
  return (
    <Panel className="p-[18px_20px]">
      <div className="text-[15px] font-semibold text-ink">
        {n}. {title}
      </div>
      {help && <p className="mt-1 text-[12.5px] text-body">{help}</p>}
      {children}
    </Panel>
  );
}

export default function SettingsPage() {
  const settings = getSettings();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Settings" subtitle="Your workspace, what you sell, and how research behaves. Everything stays on this machine." />

      <div className="flex items-start gap-5">
        <form action={saveSettingsAction} className="flex min-w-0 flex-1 flex-col gap-4">
          <SectionCard n={1} title="Workspace profile">
            <div className="mt-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink">
                Workspace name
                <Input name="workspaceName" defaultValue={settings.workspaceName} />
              </label>
              <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink">
                Owner / your name
                <Input name="ownerName" defaultValue={settings.ownerName} />
              </label>
              <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink">
                Timezone
                <Input name="timezone" defaultValue={settings.timezone} placeholder="e.g. America/Los_Angeles" />
              </label>
              <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink">
                Territory
                <Input name="territory" defaultValue={settings.territory} placeholder="e.g. West Region" />
              </label>
            </div>
          </SectionCard>

          <SectionCard n={2} title="Sales profile" help="What you sell shapes every brief Scout assembles.">
            <div className="mt-3.5 flex flex-col gap-3.5">
              <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink">
                What you sell
                <Textarea name="whatYouSell" defaultValue={settings.whatYouSell} rows={2} />
              </label>
              <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink">
                Ideal buyer roles
                <Input name="idealBuyerRoles" defaultValue={settings.idealBuyerRoles} placeholder="e.g. IT Director, VP Operations" />
              </label>
              <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink">
                Preferred call style
                <Input name="callStyle" defaultValue={settings.callStyle} placeholder="e.g. Direct, consultative" />
              </label>
            </div>
          </SectionCard>

          <Button type="submit" className="self-start">
            Save Settings
          </Button>

          <Panel className="flex items-center justify-between gap-4 bg-canvas-soft p-[12px_14px]">
            <div>
              <div className="text-[13.5px] text-ink">Show KNOWN / INFERRED / SUGGESTED labels</div>
              <div className="mt-0.5 text-xs text-muted">Locked on. Certainty is part of the data, not a display preference.</div>
            </div>
            <span className="font-mono text-[9.5px] tracking-[0.08em] text-body">ALWAYS ON</span>
          </Panel>
        </form>

        <aside className="flex w-full flex-col gap-4 lg:w-[380px] lg:shrink-0">
          <Panel className="p-[18px_20px]">
            <div className="text-[15px] font-semibold text-ink">Local data and providers</div>
            <div className="mt-3 flex flex-col gap-3">
              {PROVIDERS.map((p) => (
                <div key={p.label} className="flex items-center justify-between gap-3 border-b border-hairline pb-3 last:border-b-0 last:pb-0">
                  <div>
                    <div className="text-[13px] font-medium text-ink">{p.label}</div>
                    <div className="mt-0.5 text-[11.5px] text-muted">{p.help}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} />
                    <span className="text-[11.5px] text-body">{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-[18px_20px]">
            <div className="text-[15px] font-semibold text-ink">Data</div>
            <div className="mt-3 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[13px] font-medium text-ink">Export Workspace Data</div>
                  <div className="mt-0.5 text-[11.5px] text-body">Download every real record as JSON.</div>
                </div>
                <a href="/app/settings/export" className="shrink-0 rounded-md border border-hairline-strong bg-surface-card px-3 py-1.5 text-xs font-medium text-ink hover:bg-canvas-soft">
                  Export
                </a>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[13px] font-medium text-ink">Back Up Database</div>
                  <div className="mt-0.5 text-[11.5px] text-body">Download data/scout.db directly.</div>
                </div>
                <a href="/app/settings/backup" className="shrink-0 rounded-md border border-hairline-strong bg-surface-card px-3 py-1.5 text-xs font-medium text-ink hover:bg-canvas-soft">
                  Back Up
                </a>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[13px] font-medium text-ink">Delete Local Data</div>
                  <div className="mt-0.5 text-[11.5px] text-body">Permanently erase this workspace.</div>
                </div>
                <Link href="/app/settings/delete-local-data" className="shrink-0 rounded-md border border-hairline-strong bg-surface-card px-3 py-1.5 text-xs font-medium text-semantic-error hover:bg-canvas-soft">
                  Delete
                </Link>
              </div>
            </div>
          </Panel>

          <div className="rounded-lg bg-surface-dark p-[18px_20px] text-on-dark">
            <div className="text-[13.5px] font-semibold">Product Rules</div>
            <ul className="mt-2.5 flex flex-col gap-2 text-xs text-on-dark-soft">
              {PRODUCT_RULES.map((rule) => (
                <li key={rule}>· {rule}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
