import Link from 'next/link';
import type { ListRow as DemoListRow } from '@/demo';
import type { ListRow as AppListRow } from '@/data';
import { PinToggleButton, MarkWorkedButton } from './list-item-actions';

// Grid-table row for a Target List's "All Accounts" section — matches
// scout-ui.html's ACCOUNT/PRIORITY/STATUS/LAST ACTIVITY/SOURCES columns.
// basePath is required so a caller can never accidentally link real
// /app data into /demo or vice versa — see docs/DEMO.md. Pin/worked
// controls are only interactive for /app — /demo is read-only fixture
// data and must never accept a mutation.

export const LIST_ROW_GRID = 'grid-cols-[28px_1fr_140px_150px_1fr_100px_110px]';

const PRIORITY_DOT: Record<string, string> = {
  strong_context: 'bg-semantic-success',
  useful_context: 'bg-text-link',
  limited_data: 'bg-muted',
  lower_confidence: 'bg-accent-warning',
};
const PRIORITY_TEXT: Record<string, string> = {
  strong_context: 'Strong Context',
  useful_context: 'Useful Context',
  limited_data: 'Limited Data',
  lower_confidence: 'Lower Confidence',
};
const STATUS_STYLE: Record<string, string> = {
  ready: 'bg-surface-strong text-ink',
  processing: 'bg-[#EEF6FF] text-text-link',
  needs_review: 'bg-[#F7F1E6] text-accent-warning',
  limited_data: 'bg-surface-strong text-body',
  queued: 'bg-surface-strong text-body',
  failed: 'bg-[#FBEDED] text-semantic-error',
  refreshing: 'bg-[#EEF6FF] text-text-link',
  identifying: 'bg-surface-strong text-body',
  researching: 'bg-[#EEF6FF] text-text-link',
};

export function AccountListRow({ row, basePath }: { row: DemoListRow | AppListRow; basePath: '/app' | '/demo' }) {
  const interactive = basePath === '/app';

  return (
    <div className={`grid ${LIST_ROW_GRID} items-center gap-4 border-b border-hairline px-[22px] py-3 last:border-b-0 hover:bg-canvas-soft`}>
      {interactive ? (
        <PinToggleButton itemId={row.itemId} pinned={row.pinned} />
      ) : (
        <span className="text-center">{row.pinned && <span title="Pinned">📌</span>}</span>
      )}

      <Link href={`${basePath}/accounts/${row.account.id}`} className="min-w-0">
        <div className="truncate text-[13.5px] font-medium text-ink hover:underline">{row.account.name}</div>
        <div className="mt-0.5 truncate text-[11.5px] text-muted">{row.account.primaryDomain ?? row.account.industry ?? '—'}</div>
      </Link>

      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${PRIORITY_DOT[row.priorityLabel]}`} />
        <span className="text-[12.5px] text-body">{PRIORITY_TEXT[row.priorityLabel]}</span>
      </div>

      <div>
        <span className={`inline-flex rounded-full px-2.5 py-0.5 font-mono text-[9.5px] tracking-[0.08em] uppercase ${STATUS_STYLE[row.account.researchStatus] ?? 'bg-surface-strong text-body'}`}>
          {row.account.researchStatus.replace('_', ' ')}
        </span>
      </div>

      <div className="truncate text-[12.5px] text-body">
        {row.lastOutcome
          ? `${row.lastOutcome.outcomeType.replace('_', ' ')} · ${new Date(row.lastOutcome.occurredAt).toLocaleDateString()}`
          : row.status === 'worked'
            ? 'Worked'
            : 'No activity yet'}
      </div>

      <div className="text-[12.5px] text-muted">{row.sourcesCount > 0 ? `${row.sourcesCount} sources` : '—'}</div>

      <div className="flex justify-end">
        {interactive ? (
          <MarkWorkedButton itemId={row.itemId} worked={row.status === 'worked'} />
        ) : (
          <Link href={`${basePath}/accounts/${row.account.id}`} className="text-[12.5px] text-text-link hover:underline">
            Open →
          </Link>
        )}
      </div>
    </div>
  );
}
