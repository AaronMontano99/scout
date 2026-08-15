import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAccount, getContactsForAccount, getCallOutcomesForAccount, getPostCallNoteForOutcome } from '@/data';
import { LogCallForm } from '@/components/log-call-form';
import { OutcomeBadge } from '@/components/badges';

// Real post-call workflow — logs a CallOutcome and (with explicit
// approval) writes proposed observations into account memory, always
// tagged INFERRED. Clean-note rewriting is best-effort AI (Ollama) —
// see src/app/app/accounts/[id]/post-call/actions.ts; the raw note is
// always saved regardless of whether that succeeds.

export default async function PostCallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = getAccount(id);
  if (!account) notFound();

  const contacts = getContactsForAccount(id).map((c) => c.contact);
  const outcomes = getCallOutcomesForAccount(id);

  return (
    <div className="flex flex-col gap-8">
      <div className="text-xs text-muted">
        <Link href={`/app/accounts/${id}`} className="hover:text-ink">
          {account.name}
        </Link>{' '}
        / Log Call
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Log Call — {account.name}</h1>

      <LogCallForm accountId={id} contacts={contacts} />

      {outcomes.length > 0 && (
        <section>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">Call History</div>
          <ul className="mt-2 flex flex-col gap-3">
            {outcomes.map((o) => {
              const note = getPostCallNoteForOutcome(o.id);
              return (
                <li key={o.id} className="text-sm text-body">
                  <div className="flex items-center gap-2">
                    <OutcomeBadge outcome={o.outcomeType} />
                    <span>{new Date(o.occurredAt).toLocaleString()}</span>
                    {o.contactRoleObserved && <span>— {o.contactRoleObserved}</span>}
                  </div>
                  {note?.cleanNote && (
                    <p className="mt-1.5 rounded-md border border-hairline-strong bg-surface-card px-3 py-2 text-[13px] text-ink">
                      {note.cleanNote}
                    </p>
                  )}
                  {note?.followUpEmailDraft && (
                    <div className="mt-1.5 rounded-md border border-hairline-strong bg-canvas-soft p-3">
                      <div className="text-[11px] font-semibold tracking-wide text-muted uppercase">Follow-Up Email Draft</div>
                      <p className="mt-1 text-[13px] whitespace-pre-wrap text-ink">{note.followUpEmailDraft}</p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
