'use client';

import { useState, useTransition } from 'react';
import { saveSettingsAction } from '@/app/actions';
import type { Settings } from '@/data/settings';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { parseZips } from '@/domain/territory';

export function SettingsForm({ settings, status }: { settings: Settings; status: { available: boolean; reason?: string; account?: string } }) {
  const [ownerName, setOwnerName] = useState(settings.ownerName);
  const [phoneNumber, setPhoneNumber] = useState(settings.phoneNumber);
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [location, setLocation] = useState(settings.location);
  const [zips, setZips] = useState(settings.territoryZips.join(', '));
  const [claudeModel, setClaudeModel] = useState(settings.claudeModel);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      await saveSettingsAction({ ownerName, companyName, location, territoryZips: parseZips(zips), phoneNumber, claudeModel });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });

  return (
    <div className="flex flex-col gap-5 rounded-[14px] border border-hairline-strong bg-surface-card p-6">
      <div className={`rounded-md px-4 py-3 text-[13px] ${status.available ? 'bg-[#ECFDF3] text-[#166534]' : 'bg-[#FFF8EB] text-ink'}`}>
        {status.available ? `Claude connected${status.account ? ` (${status.account})` : ''}. Runs on your membership, no API key.` : status.reason}
      </div>
      <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink">
        Your first name (openings and sign-offs)
        <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink">
          Company (as you say it on calls)
          <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Acme Office Systems" />
        </label>
        <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink">
          City (for &quot;here in ___&quot;)
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Springfield" />
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink">
        Territory ZIPs (leads and research are checked against these)
        <Input value={zips} onChange={(e) => setZips(e.target.value)} placeholder="e.g. 90010, 90012, 90015" />
      </label>
      <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink">
        Callback number (used in voicemails)
        <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="e.g. 408-555-0100" />
      </label>
      <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-ink">
        Claude model
        <Select value={claudeModel} onChange={(e) => setClaudeModel(e.target.value as Settings['claudeModel'])}>
          <option value="sonnet">Sonnet (faster, lighter on usage limits)</option>
          <option value="opus">Opus (strongest writing, slower)</option>
        </Select>
      </label>
      <div className="flex items-center gap-3">
        <Button type="button" disabled={pending} onClick={save} className="disabled:opacity-60">
          {pending ? 'Saving…' : 'Save'}
        </Button>
        {saved && <span className="text-[13px] text-[#166534]">Saved</span>}
      </div>
    </div>
  );
}
