'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Lead } from '@/ai/sdr/schemas';
import type { LeadCandidate } from '@/data/sdr';
import { addLeadAction, dismissLeadAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MicroLabel } from '@/components/ui/micro-label';
import { AiProgress, ErrorNote, PriorityChip, SourceLinks, StrengthChip, useSdrRequest } from './shared';


const INDUSTRIES = [
  'Construction/AEC',
  'Law',
  'Accounting/Finance',
  'Property/CRE',
  'Manufacturing',
  'Distribution/Logistics',
  'Healthcare/Dental',
  'Nonprofit',
  'Education',
  'Automotive',
  'Professional services',
  'Technology',
];

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full px-3 py-1 text-[12.5px] font-medium transition-colors ${on ? 'bg-ink text-canvas' : 'bg-surface-strong text-body hover:text-ink'}`}
    >
      {children}
    </button>
  );
}

export function LeadFinder({ territoryZips }: { territoryZips: string[] }) {
  const ZIPS = territoryZips;
  const [zips, setZips] = useState<string[]>(territoryZips);
  const [industries, setIndustries] = useState<string[]>([]);
  const [count, setCount] = useState(10);
  const [focus, setFocus] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const { run, pending, elapsed, error } = useSdrRequest<{ saved: number; returned: number; notes: string }>('find_leads:all');

  const toggle = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const find = async () => {
    setResult(null);
    const r = await run({ action: 'find_leads', zips, industries, count, focus: focus.trim() || undefined });
    if (r) setResult(`${r.saved} new lead${r.saved === 1 ? '' : 's'} added below.${r.notes ? ` ${r.notes}` : ''}`);
  };

  return (
    <div className="flex flex-col gap-4 rounded-[14px] border border-hairline-strong bg-surface-card p-6">
      {ZIPS.length === 0 && <p className="text-[12.5px] text-[#8A5300]">Add your territory ZIPs in Settings first.</p>}
      <div>
        <MicroLabel>ZIPs</MicroLabel>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {ZIPS.map((z) => (
            <Chip key={z} on={zips.includes(z)} onClick={() => toggle(zips, setZips, z)}>
              {z}
            </Chip>
          ))}
        </div>
      </div>
      <div>
        <MicroLabel>Industries (none selected = any ICP industry)</MicroLabel>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {INDUSTRIES.map((i) => (
            <Chip key={i} on={industries.includes(i)} onClick={() => toggle(industries, setIndustries, i)}>
              {i}
            </Chip>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex w-[110px] flex-col gap-1 text-[12px] text-body">
          How many
          <Input type="number" min={1} max={30} value={count} onChange={(e) => setCount(Math.max(1, Math.min(30, Number(e.target.value) || 1)))} className="!py-2.5" />
        </label>
        <label className="flex min-w-[260px] flex-1 flex-col gap-1 text-[12px] text-body">
          Extra focus (optional)
          <Input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. companies hiring IT, new facilities in your ZIPs" className="!py-2.5" />
        </label>
        <Button type="button" disabled={pending || zips.length === 0} onClick={find} className="!py-2.5 disabled:opacity-60">
          Get me today&apos;s leads
        </Button>
      </div>
      {pending && <AiProgress label="Searching the territory for net-new accounts with real signals. Usually 3 to 8 minutes; you can keep working in other tabs." elapsed={elapsed} />}
      {!pending && error && <ErrorNote message={error} onRetry={find} />}
      {!pending && result && <p className="rounded-md bg-[#ECFDF3] px-4 py-2.5 text-[13px] text-[#166534]">{result}</p>}
    </div>
  );
}

export function LeadCard({ candidate }: { candidate: LeadCandidate }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const lead: Lead = candidate.lead;
  const contact = lead.primaryContact;

  const add = () =>
    startTransition(async () => {
      const accountId = await addLeadAction(candidate.id);
      if (accountId) router.push(`/calls?a=${accountId}&go=1`);
    });

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-hairline-strong bg-surface-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-[16px] font-semibold text-ink">{lead.company}</h3>
            <PriorityChip priority={lead.priority} />
          </div>
          <div className="mt-1 flex flex-wrap gap-x-2.5 text-[12.5px] text-body">
            <span className="font-medium text-ink">{lead.zip}</span>
            {lead.industry && <span>{lead.industry}</span>}
            {lead.employees && <span>{lead.employees} employees</span>}
            {lead.revenue && <span>{lead.revenue}</span>}
          </div>
        </div>
        {candidate.status === 'new' ? (
          <div className="flex gap-2">
            <Button type="button" variant="secondary" disabled={pending} onClick={() => startTransition(() => dismissLeadAction(candidate.id))} className="!px-3 !py-1.5 !text-[12.5px]">
              Not a fit
            </Button>
            <Button type="button" disabled={pending} onClick={add} className="!px-3 !py-1.5 !text-[12.5px] disabled:opacity-60">
              {pending ? 'Opening…' : 'Call this one'}
            </Button>
          </div>
        ) : candidate.accountId ? (
          <a href={`/calls?a=${candidate.accountId}`} className="text-[12.5px] text-text-link hover:underline">
            Open →
          </a>
        ) : null}
      </div>

      <p className="text-[13.5px] leading-[1.55] text-ink">{lead.whyCall}</p>

      <div className="flex items-start gap-2 text-[13px] leading-[1.5] text-ink">
        <StrengthChip strength={lead.signal.strength} />
        <span>
          {lead.signal.signal}
          {lead.signal.date && <span className="text-muted"> · {lead.signal.date}</span>}
        </span>
      </div>

      <div className="grid gap-x-5 gap-y-2 text-[13px] sm:grid-cols-2">
        <div>
          <MicroLabel>Hypothesis</MicroLabel>
          <p className="mt-0.5 leading-[1.5] text-ink">{lead.hypothesis}</p>
        </div>
        <div>
          <MicroLabel>Angle</MicroLabel>
          <p className="mt-0.5 leading-[1.5] text-ink">{lead.angle}</p>
        </div>
        <div>
          <MicroLabel>Primary contact</MicroLabel>
          <p className="mt-0.5 leading-[1.5] text-ink">
            {[contact.name, contact.title].filter(Boolean).join(', ') || 'Not found'}
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="ml-2 text-text-link hover:underline">
                {contact.phone}
              </a>
            )}
          </p>
          {lead.whyThisPerson && <p className="text-[12px] text-muted">{lead.whyThisPerson}</p>}
        </div>
        <div>
          <MicroLabel>Primary question</MicroLabel>
          <p className="mt-0.5 leading-[1.5] text-ink">{lead.primaryQuestion}</p>
        </div>
      </div>
      <SourceLinks sources={lead.sources} />
    </div>
  );
}
