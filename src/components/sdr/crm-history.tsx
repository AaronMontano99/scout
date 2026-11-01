'use client';

import { useState, useTransition } from 'react';
import { saveCrmHistoryAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { MicroLabel } from '@/components/ui/micro-label';

/** Aaron's notes from his real CRM, pasted verbatim — the history every card and email reopens threads from. */
export function CrmHistory({ accountId, notes }: { accountId: string; notes: { content: string; createdAt: string }[] }) {
  const [open, setOpen] = useState(notes.length === 0);
  const [text, setText] = useState('');
  const [saving, startSaving] = useTransition();

  const save = () => {
    if (!text.trim()) return;
    startSaving(async () => {
      await saveCrmHistoryAction(accountId, text);
      setText('');
      setOpen(false);
    });
  };

  return (
    <div className="flex flex-col gap-3 glass p-4">
      <div className="flex items-baseline justify-between">
        <MicroLabel>Your notes</MicroLabel>
        {!open && (
          <button type="button" onClick={() => setOpen(true)} className="text-[12px] text-text-link hover:underline">
            + Paste notes
          </button>
        )}
      </div>

      {open && (
        <div className="flex flex-col gap-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder={'Paste straight from your CRM, dates and all:\n8/16/2024 4:42 PM: TT - Sam at the front desk\n> IT is outsourced to an MSP out of the Fremont office'}
            className="!text-[12.5px]"
          />
          <div className="flex gap-2">
            <Button type="button" disabled={saving || !text.trim()} onClick={save} className="!px-3.5 !py-1.5 !text-[12.5px] disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </Button>
            {notes.length > 0 && (
              <Button type="button" variant="secondary" onClick={() => setOpen(false)} className="!px-3.5 !py-1.5 !text-[12.5px]">
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}

      {notes.length === 0 && !open && <p className="text-[12.5px] text-muted">None pasted. Ferret treats this as net-new.</p>}
      {notes.map((n, i) => (
        <pre key={i} className="max-h-[260px] overflow-auto border-t border-hairline pt-2.5 font-sans text-[12.5px] leading-[1.55] whitespace-pre-wrap text-ink">
          {n.content}
        </pre>
      ))}
    </div>
  );
}
