'use client';

import { useState, useTransition } from 'react';
import { generateAndSaveCommunication } from '@/app/app/accounts/[id]/communications/actions';
import type { CommunicationType } from '@/ai/seller-voice/compose-prompt';
import { Button } from './ui/button';
import { Textarea, Input } from './ui/input';

const LABEL: Record<CommunicationType, string> = {
  call_script: 'Call Script',
  voicemail: 'Voicemail',
  email: 'Email',
  post_call_followup: 'Follow-Up Email',
};

const SUPPORTS_MEETING_TIMES: CommunicationType[] = ['email', 'call_script'];

export function CommunicationGenerator({
  accountId,
  communicationType,
  initialText,
}: {
  accountId: string;
  communicationType: CommunicationType;
  initialText: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [text, setText] = useState(initialText);
  const [lintIssues, setLintIssues] = useState<{ rule: string; detail: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [remember, setRemember] = useState(false);
  const [time1, setTime1] = useState('');
  const [time2, setTime2] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = () => {
    startTransition(async () => {
      const result = await generateAndSaveCommunication({
        accountId,
        communicationType,
        explicitInstruction: instruction || undefined,
        rememberInstruction: remember,
        meetingTimes: SUPPORTS_MEETING_TIMES.includes(communicationType) ? [time1, time2].filter(Boolean) : undefined,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setText(result.text);
      setLintIssues(result.lintIssues);
      setCopied(false);
    });
  };

  const copy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="rounded-lg border border-hairline-strong bg-surface-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[13.5px] font-semibold text-ink">{LABEL[communicationType]}</div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowOptions((s) => !s)} className="text-[12px] text-text-link hover:underline">
            {showOptions ? 'Hide options' : 'Options'}
          </button>
          <Button type="button" disabled={isPending} onClick={generate} className="!px-3.5 !py-1.5 !text-[12.5px] disabled:opacity-60">
            {isPending ? 'Writing…' : text ? 'Regenerate' : 'Generate'}
          </Button>
        </div>
      </div>

      {showOptions && (
        <div className="mt-3 flex flex-col gap-2.5 border-t border-hairline pt-3">
          <label className="flex flex-col gap-1 text-[12px] text-body">
            One-time instruction (applies to this generation only, unless you check &ldquo;remember&rdquo;)
            <Textarea value={instruction} onChange={(e) => setInstruction(e.target.value)} rows={2} placeholder="e.g. Make this more formal, it's going to the CEO" />
          </label>
          <label className="flex items-center gap-2 text-[12px] text-body">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Remember this as a permanent style rule
          </label>
          {SUPPORTS_MEETING_TIMES.includes(communicationType) && (
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-[12px] text-body">
                Real meeting time option 1 (optional)
                <Input value={time1} onChange={(e) => setTime1(e.target.value)} placeholder="e.g. Tuesday 2pm" />
              </label>
              <label className="flex flex-col gap-1 text-[12px] text-body">
                Real meeting time option 2 (optional)
                <Input value={time2} onChange={(e) => setTime2(e.target.value)} placeholder="e.g. Wednesday 10am" />
              </label>
            </div>
          )}
        </div>
      )}

      {isPending && <p className="mt-3 text-[12.5px] text-muted">Writing in your saved voice — this runs on your local model and can take a couple of minutes…</p>}

      {!isPending && error && (
        <div className="mt-3 rounded-md border border-semantic-error/40 bg-semantic-error/10 p-3">
          <p className="text-[12.5px] text-semantic-error">{error}</p>
          <button type="button" onClick={generate} className="mt-1.5 text-[12.5px] text-text-link hover:underline">
            Try again
          </button>
        </div>
      )}

      {!isPending && !error && text && (
        <div className="mt-3">
          <pre className="max-h-[400px] overflow-auto rounded-md border border-hairline-strong bg-canvas-soft p-3 text-[13px] leading-[1.55] whitespace-pre-wrap text-ink">{text}</pre>
          <div className="mt-2 flex items-center gap-3">
            <button type="button" onClick={copy} className="text-[12.5px] text-text-link hover:underline">
              {copied ? 'Copied' : 'Copy'}
            </button>
            {lintIssues.length > 0 && (
              <span className="text-[11.5px] text-accent-warning" title={lintIssues.map((i) => i.detail).join('; ')}>
                {lintIssues.length} style check{lintIssues.length === 1 ? '' : 's'} flagged after one retry — review before sending
              </span>
            )}
          </div>
        </div>
      )}

      {!isPending && !error && !text && <p className="mt-3 text-[12.5px] text-muted">Not generated yet.</p>}
    </div>
  );
}
