'use client';

import type { HotListUpdate } from '@/ai/sdr/schemas';
import { NEXT_ACTION_LABEL, STAGE_LABEL, type HotStage, type NextAction } from '@/domain/hot-list';
import { MicroLabel } from '@/components/ui/micro-label';
import { PriorityChip } from './shared';

const DECISION_LABEL: Record<HotListUpdate['decision'], string> = {
  qualify_in: 'Add to Hot List',
  update: 'Update Hot List row',
  meeting_booked: 'Meeting booked: take off Hot List',
  close: 'Close / recycle',
  not_qualified: 'Not qualified in yet',
};

const SELECT = 'rounded-md border border-hairline-strong bg-surface-card px-2 py-1 text-[12.5px] text-ink';

/** The Hot List change Scout proposes after a debrief — the rep confirms or tweaks it before it's saved. */
export function HotListProposal({
  update,
  onChange,
  apply,
  onApplyChange,
}: {
  update: HotListUpdate;
  onChange: (u: HotListUpdate) => void;
  apply: boolean;
  onApplyChange: (v: boolean) => void;
}) {
  const active = update.decision === 'qualify_in' || update.decision === 'update';
  return (
    <div className={`flex flex-col gap-3 rounded-md border p-4 ${apply ? 'border-[#F5C26B] bg-[#FFFBF2]' : 'border-hairline-strong'}`}>
      <div className="flex flex-wrap items-center gap-2.5">
        <MicroLabel color="text-accent-warning">Hot List</MicroLabel>
        <span className="text-[13.5px] font-medium text-ink">{DECISION_LABEL[update.decision]}</span>
        {active && <PriorityChip priority={update.priority} />}
        <label className="ml-auto flex items-center gap-1.5 text-[12.5px] text-body">
          <input type="checkbox" checked={apply} onChange={(e) => onApplyChange(e.target.checked)} />
          Apply when I save
        </label>
      </div>
      {update.reason && <p className="-mt-1 text-[12.5px] text-body">{update.reason}</p>}

      {active && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <select value={update.priority} onChange={(e) => onChange({ ...update, priority: e.target.value as HotListUpdate['priority'] })} className={SELECT}>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
            <select value={update.stage} onChange={(e) => onChange({ ...update, stage: e.target.value as HotStage })} className={SELECT}>
              {(['new_qi', 'developing', 'warm', 'meeting_ask_ready'] as HotStage[]).map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL[s]}
                </option>
              ))}
            </select>
            <span className="text-[12.5px] text-muted">Next:</span>
            <select value={update.nextAction} onChange={(e) => onChange({ ...update, nextAction: e.target.value as NextAction })} className={SELECT}>
              {(Object.keys(NEXT_ACTION_LABEL) as NextAction[]).map((a) => (
                <option key={a} value={a}>
                  {NEXT_ACTION_LABEL[a]}
                </option>
              ))}
            </select>
            <input type="date" value={update.nextTouchDate} onChange={(e) => onChange({ ...update, nextTouchDate: e.target.value })} className={SELECT} />
          </div>
          <dl className="grid grid-cols-[130px_1fr] gap-x-3 gap-y-1.5 text-[12.5px] leading-[1.5]">
            <dt className="text-muted">Why qualified in</dt>
            <dd className="text-ink">{update.whyQualified}</dd>
            <dt className="text-muted">Learned</dt>
            <dd className="text-ink">{update.learned}</dd>
            <dt className="text-muted">Next question</dt>
            <dd className="font-medium text-ink">{update.nextQuestion}</dd>
            <dt className="text-muted">Meeting to earn</dt>
            <dd className="text-ink">{update.meetingHypothesis}</dd>
          </dl>
        </>
      )}
    </div>
  );
}
