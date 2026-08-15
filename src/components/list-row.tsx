import Link from 'next/link';
import type { ListRow as DemoListRow } from '@/demo';
import type { ListRow as AppListRow } from '@/data';
import { PriorityLabelChip } from './priority';
import { OutcomeBadge } from './badges';
import { PinToggleButton, MarkWorkedButton } from './list-item-actions';

// See DESIGN.md "list-row" — compact, shared-edge rows, not boxed cards.
// basePath is required (not defaulted) so a caller can never accidentally
// link real /app data into /demo or vice versa — see docs/DEMO.md.
// Pin/worked controls are only interactive for /app — /demo is
// read-only fixture data and must never accept a mutation.

export function AccountListRow({ row, basePath }: { row: DemoListRow | AppListRow; basePath: '/app' | '/demo' }) {
  const interactive = basePath === '/app';

  return (
    <div className="flex items-center justify-between gap-3 border-b border-hairline px-4 py-3 last:border-b-0 hover:bg-canvas-soft">
      <Link href={`${basePath}/accounts/${row.account.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        {interactive ? (
          <PinToggleButton itemId={row.itemId} pinned={row.pinned} />
        ) : (
          row.pinned && <span title="Pinned">📌</span>
        )}
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-ink">{row.account.name}</div>
          <div className="truncate text-xs text-muted">
            {row.account.industry ?? 'Unknown industry'}
            {row.status === 'worked' && ' · worked'}
            {row.status === 'skipped' && ' · skipped'}
            {row.status === 'in_progress' && ' · in progress'}
          </div>
        </div>
      </Link>
      <div className="flex items-center gap-3">
        <PriorityLabelChip priority={row.priorityLabel} />
        {row.lastOutcome && <OutcomeBadge outcome={row.lastOutcome.outcomeType} />}
        {interactive && <MarkWorkedButton itemId={row.itemId} worked={row.status === 'worked'} />}
      </div>
    </div>
  );
}
