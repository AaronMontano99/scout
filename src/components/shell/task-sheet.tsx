'use client';

import { useState, useTransition } from 'react';
import { createTaskAction, updateTaskAction } from '@/app/actions';
import { TASK_KINDS, TASK_KIND_LABEL, type TaskKind } from '@/domain/schedule';
import { ymd } from '@/domain/hot-list';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { FieldLabel, Sheet } from './sheet';
import { useShell } from './shell';

export interface TaskDraft {
  id?: string;
  accountId?: string | null;
  title?: string;
  kind?: TaskKind;
  dueDate?: string;
  dueTime?: string | null;
  notes?: string;
}

export function TaskSheet({ draft, onClose }: { draft?: TaskDraft; onClose: () => void }) {
  const { accounts, toast } = useShell();
  const [title, setTitle] = useState(draft?.title ?? '');
  const [accountId, setAccountId] = useState(draft?.accountId ?? '');
  const [kind, setKind] = useState<TaskKind>(draft?.kind ?? 'call');
  const [dueDate, setDueDate] = useState(draft?.dueDate ?? ymd(new Date()));
  const [dueTime, setDueTime] = useState(draft?.dueTime ?? '');
  const [notes, setNotes] = useState(draft?.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => {
    if (!title.trim()) {
      setError('What needs doing?');
      return;
    }
    if (!dueDate) {
      setError('Pick a date.');
      return;
    }
    startTransition(async () => {
      const input = { accountId: accountId || null, title, kind, dueDate, dueTime: dueTime || null, notes };
      if (draft?.id) await updateTaskAction(draft.id, input);
      else await createTaskAction(input);
      toast(draft?.id ? 'Task updated' : 'Task added');
      onClose();
    });
  };

  return (
    <Sheet
      title={draft?.id ? 'Edit task' : 'New task'}
      subtitle="Lands on the Schedule and on the account."
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={pending} className="flex-[2] disabled:opacity-60">
            {pending ? 'Saving…' : draft?.id ? 'Save task' : 'Add task'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FieldLabel label="Title">
          <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} placeholder="e.g. Call the GM back about the copier lease" />
        </FieldLabel>
        <FieldLabel label="Account">
          <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">No account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </FieldLabel>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Type">
          {TASK_KINDS.map((k) => (
            <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium ${kind === k ? 'bg-primary text-on-primary' : 'bg-surface-strong text-body hover:text-ink'}`}>
              {TASK_KIND_LABEL[k]}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FieldLabel label="Date">
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </FieldLabel>
          <FieldLabel label="Time (optional)">
            <Input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
          </FieldLabel>
        </div>
        <FieldLabel label="Notes">
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything future you should know" />
        </FieldLabel>
        {error && <p className="text-[13px] text-bad">{error}</p>}
      </div>
    </Sheet>
  );
}
