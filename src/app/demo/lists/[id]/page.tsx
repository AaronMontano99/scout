import { notFound } from 'next/navigation';
import { getTargetListOverview, getListRows, getSuggestedCalls, getIdentityWarning } from '@/demo';
import { AccountFilterList } from '@/components/account-filter-list';
import { PriorityLabelChip } from '@/components/priority';
import Link from 'next/link';

// Signature experience #1 — Target List workspace. Product spec §34/§105:
// progress, suggested calls, all accounts, pins, freshness, focus —
// persistent across sessions (memory never resets, see ADR-0006).

// Deliberately tiny and static — product spec §19-20 explicitly forbids
// generic industry essays. If nothing meaningful happened, say so.
const INDUSTRY_PULSE: Record<string, string[]> = {
  'demo-list-construction': [
    'Bay Area commercial permitting volume up modestly quarter-over-quarter.',
    'Two regional GCs announced office expansions in the last 30 days.',
  ],
  'demo-list-landscaping': [],
};

export default async function TargetListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const overview = getTargetListOverview(id);
  if (!overview) notFound();
  const { list, progress, researchProgress } = overview;

  const rows = getListRows(id);
  const suggested = getSuggestedCalls(id, 50);
  const pulse = INDUSTRY_PULSE[id] ?? [];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <div className="text-xs text-muted">
          <Link href="/demo/lists" className="hover:text-ink">
            My Lists
          </Link>{' '}
          / {list.name}
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{list.name}</h1>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-body">
          <span>{progress.total} accounts</span>
          <span>{progress.worked} worked</span>
          <span>{progress.remaining} remaining</span>
          <span>{progress.pinnedCount} pinned</span>
          <span>Research focus: {list.researchFocus ?? 'General'}</span>
          {list.lastWorkedAt && <span>Last worked: {new Date(list.lastWorkedAt).toLocaleDateString()}</span>}
        </div>
        {/* Product spec §5: "17 ready, 36 processing, 147 queued, 0 failed" */}
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <span>{researchProgress.ready} ready</span>
          <span>{researchProgress.processing} processing</span>
          <span>{researchProgress.queued} queued</span>
          {researchProgress.needsReview > 0 && <span>{researchProgress.needsReview} needs review</span>}
          {researchProgress.failed > 0 && <span>{researchProgress.failed} failed</span>}
        </div>
      </header>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Industry Pulse</h2>
        {pulse.length > 0 ? (
          <ul className="flex flex-col gap-1 text-sm text-body">
            {pulse.map((item, i) => (
              <li key={i}>· {item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Nothing meaningful to report today.</p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Suggested Calls ({suggested.length})
        </h2>
        <div className="rounded-lg border border-hairline-strong bg-surface-card">
          {suggested.map((entry) => {
            const warning = getIdentityWarning(entry.account.id);
            return (
              <Link
                key={entry.item.id}
                href={`/demo/accounts/${entry.account.id}`}
                className="flex items-center justify-between border-b border-hairline px-4 py-3 last:border-b-0 hover:bg-canvas-soft"
              >
                <div className="flex items-center gap-3">
                  {entry.pinned && <span title="Pinned">📌</span>}
                  <div>
                    <div className="text-sm font-medium text-ink">{entry.account.name}</div>
                    {/* Product spec §106: explainable reasons, never a fake score */}
                    {entry.reasons.length > 0 && (
                      <div className="text-xs text-muted">{entry.reasons.join(' · ')}</div>
                    )}
                    {warning && <div className="text-xs text-accent-warning">{warning.warning}</div>}
                  </div>
                </div>
                <PriorityLabelChip priority={entry.priorityLabel} />
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          All Accounts ({rows.length})
        </h2>
        <AccountFilterList rows={rows} basePath="/demo" />
      </section>
    </div>
  );
}
