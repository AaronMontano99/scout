import Link from 'next/link';
import type { ListRow } from '@/demo';
import { PriorityLabelChip } from './priority';
import { OutcomeBadge } from './badges';

// See DESIGN.md "list-row" — compact, shared-edge rows, not boxed cards.

export function AccountListRow({ row }: { row: ListRow }) {
  return (
    <Link
      href={`/demo/accounts/${row.account.id}`}
      className="flex items-center justify-between border-b border-hairline px-4 py-3 hover:bg-canvas-soft"
    >
      <div className="flex items-center gap-3">
        {row.pinned && <span title="Pinned">📌</span>}
        <div>
          <div className="text-sm font-medium text-ink">{row.account.name}</div>
          <div className="text-xs text-muted">
            {row.account.industry ?? 'Unknown industry'}
            {row.status === 'worked' && ' · worked'}
            {row.status === 'skipped' && ' · skipped'}
            {row.status === 'in_progress' && ' · in progress'}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <PriorityLabelChip priority={row.priorityLabel} />
        {row.lastOutcome && <OutcomeBadge outcome={row.lastOutcome.outcomeType} />}
      </div>
    </Link>
  );
}
