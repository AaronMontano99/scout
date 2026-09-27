import type { AccountIntel } from '@/ai/sdr/schemas';
import { MicroLabel } from '@/components/ui/micro-label';
import { SourceLinks, StrengthChip } from './shared';

// Live-researched facts about an account, as the call card and email
// were built from them. Server-rendered; refreshes whenever a run with
// research finishes.

export function IntelPanel({ intel, researchedAt }: { intel: AccountIntel | null; researchedAt: string | null }) {
  if (!intel) {
    return (
      <div className="rounded-lg border border-hairline-strong bg-surface-card p-4">
        <MicroLabel>Why now</MicroLabel>
        <p className="mt-1.5 text-[13px] text-muted">Researched live when the call card or email is built.</p>
      </div>
    );
  }
  const office = intel.localOffice;
  const territoryLabel = office.inTerritory === 'yes' ? 'In territory' : office.inTerritory === 'no' ? 'Outside territory' : 'Territory unknown';
  const facts = [
    ['Parent', intel.parentCompany],
    ['HQ', intel.headquarters],
    ['Locations', intel.locations],
    ['Employees', intel.employees],
    ['Revenue', intel.revenue],
  ].filter(([, v]) => v);

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-hairline-strong bg-surface-card p-4">
      <div className="flex items-baseline justify-between">
        <MicroLabel>Why now: live research</MicroLabel>
        {researchedAt && <span className="text-[11px] text-muted">live, {new Date(researchedAt).toLocaleDateString()}</span>}
      </div>

      {intel.summary && <p className="-mt-2 text-[13px] leading-[1.55] text-ink">{intel.summary}</p>}

      {(office.address || office.phone) && (
        <div className="text-[12.5px] leading-[1.6] text-body">
          {office.address && <div>{office.address}</div>}
          <div className="flex flex-wrap items-center gap-2">
            {office.phone && <a href={`tel:${office.phone}`} className="text-text-link hover:underline">{office.phone}</a>}
            <span
              className={`rounded-full px-2 py-px text-[10.5px] font-medium ${
                office.inTerritory === 'yes' ? 'bg-[#DCFCE7] text-[#166534]' : office.inTerritory === 'no' ? 'bg-[#FDECEC] text-[#9B1C1C]' : 'bg-surface-strong text-muted'
              }`}
            >
              {territoryLabel}
            </span>
          </div>
        </div>
      )}

      {facts.length > 0 && (
        <dl className="grid grid-cols-[76px_1fr] gap-x-2 gap-y-1 text-[12.5px]">
          {facts.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted">{k}</dt>
              <dd className="text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      {intel.decisionOwnership && (
        <div>
          <MicroLabel>Who decides</MicroLabel>
          <p className="mt-1 text-[12.5px] leading-[1.55] text-ink">{intel.decisionOwnership}</p>
        </div>
      )}

      {intel.signals.length > 0 && (
        <div>
          <MicroLabel>Signals</MicroLabel>
          <ul className="mt-1.5 flex flex-col gap-2">
            {intel.signals.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-[12.5px] leading-[1.5] text-ink">
                <StrengthChip strength={s.strength} />
                <span>
                  {s.signal}
                  {s.date && <span className="text-muted"> · {s.date}</span>}
                  {s.sourceUrl && (
                    <a href={s.sourceUrl} target="_blank" rel="noreferrer" className="ml-1 text-text-link hover:underline">
                      ↗
                    </a>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {intel.people.length > 0 && (
        <div>
          <MicroLabel>People found</MicroLabel>
          <ul className="mt-1.5 flex flex-col gap-1">
            {intel.people.map((p, i) => (
              <li key={i} className="text-[12.5px] leading-[1.5] text-ink">
                <span className="font-medium">{p.name}</span>
                {p.title && <span className="text-body">, {p.title}</span>}
                {!p.verified && <span className="text-muted"> (unverified)</span>}
                {p.sourceUrl && (
                  <a href={p.sourceUrl} target="_blank" rel="noreferrer" className="ml-1 text-text-link hover:underline">
                    ↗
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {intel.crmCorrections.length > 0 && (
        <div className="rounded-md bg-[#FFF8EB] px-3 py-2.5">
          <MicroLabel color="text-accent-warning">Check your CRM</MicroLabel>
          <ul className="mt-1 flex flex-col gap-1">
            {intel.crmCorrections.map((c, i) => (
              <li key={i} className="text-[12.5px] leading-[1.5] text-ink">
                · {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      <SourceLinks sources={intel.sources} />
    </div>
  );
}
