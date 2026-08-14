import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAccount, getCallOutcomesForAccount, getPostCallNoteForOutcome } from '@/data';
import { EmptyState } from '@/components/states';
import { CertaintyBadge } from '@/components/badges';

// Post-call workflow for your real data — no AI-generated clean note
// or follow-up draft here (no AI provider connected), so this mirrors
// src/app/demo/accounts/[id]/post-call/page.tsx's structure but stays
// empty-state-only in V1: logging call outcomes isn't built yet. See
// docs/LOCAL_MODE.md.

export default async function PostCallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = getAccount(id);
  if (!account) notFound();

  const outcomes = getCallOutcomesForAccount(id);
  const note = outcomes.map((o) => getPostCallNoteForOutcome(o.id)).find((n) => n !== null);

  if (!note) {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-xs text-muted">
          <Link href={`/app/accounts/${id}`} className="hover:text-ink">
            {account.name}
          </Link>{' '}
          / Post-Call
        </div>
        <EmptyState
          title="No Post-Call Note Yet"
          body="Logging call outcomes and post-call notes isn't built yet in local mode — add notes directly on the account for now."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-xs text-muted">
        <Link href={`/app/accounts/${id}`} className="hover:text-ink">
          {account.name}
        </Link>{' '}
        / Post-Call
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Post-Call Workflow</h1>

      <section>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">What You Typed</div>
        <p className="mt-2 rounded-lg bg-surface-strong p-4 font-mono text-sm text-ink">{note.rawInput}</p>
      </section>

      {note.cleanNote && (
        <section>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">Clean Note</div>
          <p className="mt-2 rounded-lg border border-hairline-strong bg-surface-card p-4 text-sm text-body">
            {note.cleanNote}
          </p>
        </section>
      )}

      {note.proposedAccountUpdates.length > 0 && (
        <section>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">Proposed Account Updates</div>
          <ul className="mt-2 flex flex-col gap-2">
            {note.proposedAccountUpdates.map((u, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CertaintyBadge certainty={u.certaintyType} />
                <span className="text-body">{u.summary}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
