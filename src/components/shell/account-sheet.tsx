'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addAccountAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel, Sheet } from './sheet';
import { useShell } from './shell';

export function AccountSheet({ onClose }: { onClose: () => void }) {
  const { toast } = useShell();
  const router = useRouter();
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [phone, setPhone] = useState('');
  const [zip, setZip] = useState('');
  const [industry, setIndustry] = useState('');
  const [addToHotList, setAddToHotList] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      const result = await addAccountAction({ name, domain, phone, zip, industry, addToHotList });
      if ('error' in result) {
        setError(result.error);
        return;
      }
      toast(result.existed ? 'Already in Scout. Opened it for you.' : 'Account added');
      onClose();
      router.push(`/accounts/${result.accountId}`);
    });

  return (
    <Sheet
      title="Add an account"
      subtitle="Only the name is required. Research fills in the rest when you call or email them."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={pending} className="flex-[2] disabled:opacity-60">
            {pending ? 'Saving…' : 'Add account'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FieldLabel label="Company">
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} />
        </FieldLabel>
        <FieldLabel label="Website">
          <Input value={domain} onChange={(e) => setDomain(e.target.value)} />
        </FieldLabel>
        <div className="grid grid-cols-2 gap-3">
          <FieldLabel label="Phone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </FieldLabel>
          <FieldLabel label="ZIP">
            <Input value={zip} onChange={(e) => setZip(e.target.value)} />
          </FieldLabel>
        </div>
        <FieldLabel label="Industry">
          <Input value={industry} onChange={(e) => setIndustry(e.target.value)} />
        </FieldLabel>
        <label className="flex items-center gap-2 text-[13.5px] text-body">
          <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={addToHotList} onChange={(e) => setAddToHotList(e.target.checked)} />
          Add to the Hot List as qualified in
        </label>
        {error && <p className="text-[13px] text-bad">{error}</p>}
      </div>
    </Sheet>
  );
}
