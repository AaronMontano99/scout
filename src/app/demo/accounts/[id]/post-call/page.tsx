import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAccount, getCallOutcomesForAccount, getPostCallNoteForOutcome } from '@/demo';
import { EmptyState } from '@/components/states';
import { CertaintyBadge } from '@/components/badges';

// Signature experience #4 — post-call assistant. Product spec §40-41:
// messy dictated note -> clean CRM note + account memory update +
// follow-up draft in the rep's own style -> ONE approval -> CRM
// writeback. No duplicate data entry. crm_write_status is simulated —
// no live CRM is connected, see docs/CRM_WRITEBACK.md.

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
          <Link href={`/demo/accounts/${id}`} className="hover:text-ink">
            {account.name}
          </Link>{' '}
          / Post-Call
        </div>
        <EmptyState
          title="No Post-Call Note Yet"
          body="After a call, log the outcome and jot down a rough note — Scout turns it into a clean CRM note, updates account memory, and drafts a follow-up in your style, all in one approval."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-xs text-muted">
        <Link href={`/demo/accounts/${id}`} className="hover:text-ink">
          {account.name}
        </Link>{' '}
        / Post-Call
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Post-Call Workflow</h1>

      <section>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">
          What You Typed / Dictated
        </div>
        <p className="mt-2 rounded-lg bg-surface-strong p-4 font-mono text-sm text-ink">{note.rawInput}</p>
      </section>

      <div className="text-center text-xs text-muted">↓ Scout cleans this up ↓</div>

      <section>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">Clean CRM Note</div>
        <p className="mt-2 rounded-lg border border-hairline-strong bg-surface-card p-4 text-sm text-body">
          {note.cleanNote}
        </p>
      </section>

      <section>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">
          Proposed Account Memory Updates
        </div>
        <ul className="mt-2 flex flex-col gap-2">
          {note.proposedAccountUpdates.map((u, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <CertaintyBadge certainty={u.certaintyType} />
              <span className="text-body">{u.summary}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted">
          Nothing here becomes a permanent record until approved below — see AI_ARCHITECTURE.md&rsquo;s trust rules.
        </p>
      </section>

      {note.followUpEmailDraft && (
        <section>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">
            Follow-Up Email (drafted in your style)
          </div>
          <p className="mt-2 rounded-lg border border-hairline-strong bg-surface-card p-4 text-sm text-body">
            {note.followUpEmailDraft}
          </p>
        </section>
      )}

      <section className="rounded-lg border border-hairline-strong bg-surface-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-ink">
              {note.approvedAt ? 'Approved' : 'Awaiting your approval'}
            </div>
            {note.approvedAt && (
              <div className="text-xs text-muted">{new Date(note.approvedAt).toLocaleString()}</div>
            )}
          </div>
          <span className="rounded-full bg-surface-strong px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink">
            CRM write: {note.crmWriteStatus.replace('_', ' ')}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted">
          One approval writes the clean note, account updates, and follow-up status back to Scout and your
          connected CRM. No live CRM is connected in this demo — see docs/CRM_WRITEBACK.md.
        </p>
      </section>
    </div>
  );
}
