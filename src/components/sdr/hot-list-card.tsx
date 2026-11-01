'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { HotListUpdate } from '@/ai/sdr/schemas';
import type { HotListCheck } from '@/data/sdr';
import { applyHotListUpdateAction, updateHotListAction } from '@/app/actions';
import { STAGE_LABEL, actionFlag, isActive, type HotListEntry } from '@/domain/hot-list';
import { Button } from '@/components/ui/button';
import { MicroLabel } from '@/components/ui/micro-label';
import { AiProgress, ErrorNote, PriorityChip, useSdrRequest } from './shared';
import { FlagBadge } from './hot-list-table';
import { HotListProposal } from './hot-list-proposal';

/** Account sidebar: where this account stands on the Hot List, kept current automatically, with a manual re-check. */
export function HotListCard({
  accountId,
  entry,
  today,
  lastCheck,
}: {
  accountId: string;
  entry: HotListEntry | null;
  today: string;
  lastCheck: HotListCheck | null;
}) {
  const { run, pending, elapsed, error } = useSdrRequest<HotListUpdate>(`hotlist:${accountId}`);
  const [proposal, setProposal] = useState<HotListUpdate | null>(null);
  const [apply, setApply] = useState(true);
  const [saving, startSaving] = useTransition();

  const check = async () => {
    const result = await run({ action: 'hotlist_assess', accountId });
    if (result) {
      setProposal(result);
      setApply(result.decision !== 'not_qualified');
    }
  };

  const confirm = () => {
    if (!proposal) return;
    startSaving(async () => {
      if (apply) await applyHotListUpdateAction(accountId, proposal);
      setProposal(null);
    });
  };

  const onList = entry && isActive(entry.stage);

  return (
    <div className={`flex flex-col gap-3 rounded-lg border p-4 ${onList ? 'border-warn bg-warn-soft' : 'border-hairline-strong bg-surface-card'}`}>
      <div className="flex items-baseline justify-between">
        <MicroLabel color={onList ? 'text-accent-warning' : undefined}>Hot List</MicroLabel>
        <Link href="/hot-list" className="text-[12px] text-text-link hover:underline">
          Open list →
        </Link>
      </div>

      {pending && <AiProgress label="Checking if it's qualified in…" elapsed={elapsed} />}
      {!pending && error && <ErrorNote message={error} onRetry={check} />}

      {!pending && proposal && (
        <>
          <HotListProposal update={proposal} onChange={setProposal} apply={apply} onApplyChange={setApply} />
          <div className="flex gap-2">
            <Button type="button" disabled={saving} onClick={confirm} className="!px-3.5 !py-1.5 !text-[12.5px] disabled:opacity-60">
              {apply ? 'Save' : 'Done'}
            </Button>
          </div>
        </>
      )}

      {!pending && !proposal && entry && (
        <div className="flex flex-col gap-2 text-[12.5px] leading-[1.5]">
          <div className="flex flex-wrap items-center gap-2">
            {onList ? <FlagBadge flag={actionFlag(entry.nextTouchDate, today)} /> : null}
            {onList && <PriorityChip priority={entry.priority} />}
            <span className="font-medium text-ink">{STAGE_LABEL[entry.stage]}</span>
          </div>
          {onList ? (
            <>
              {entry.nextQuestion && (
                <p className="text-ink">
                  <span className="text-muted">Next question: </span>
                  {entry.nextQuestion}
                </p>
              )}
              <div className="flex items-center gap-2 text-body">
                <span className="text-muted">Next touch</span>
                <input
                  type="date"
                  value={entry.nextTouchDate ?? ''}
                  onChange={(e) => startSaving(() => updateHotListAction(accountId, { nextTouchDate: e.target.value || null }))}
                  className="rounded-md border border-hairline-strong bg-surface-card px-2 py-0.5 text-[12.5px]"
                />
              </div>
              {entry.lastInteraction && <p className="text-muted">Last: {entry.lastInteraction}</p>}
            </>
          ) : (
            entry.closeReason && <p className="text-muted">{entry.closeReason}</p>
          )}
        </div>
      )}

      {!pending && !proposal && !entry && (
        <div className="flex flex-col gap-1 text-[12.5px] leading-[1.5]">
          <p className="text-muted">Not on the Hot List. It&apos;s added automatically when a touch or your CRM notes qualify it in.</p>
          {lastCheck?.decision === 'not_qualified' && (
            <p className="text-body">
              <span className="text-muted">Checked {new Date(lastCheck.checkedAt).toLocaleDateString()}: </span>
              {lastCheck.reason}
            </p>
          )}
        </div>
      )}

      {!pending && !proposal && (
        <button type="button" onClick={check} className="self-start text-[12px] text-text-link hover:underline">
          {entry ? 'Re-check from notes' : 'Check Hot List now'}
        </button>
      )}
    </div>
  );
}
