import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAccount, getContactsForAccount, getCallOutcomesForAccount } from '@/data';
import { LogCallForm } from '@/components/log-call-form';
import { OutcomeBadge } from '@/components/badges';

// Real post-call workflow — logs a CallOutcome and (with explicit
// approval) writes proposed observations into account memory, always
// tagged INFERRED. No AI-generated "clean note" here — there's no AI
// provider connected in local mode. See docs/POST_CALL_WORKFLOW.md.

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
          <ul className="mt-2 flex flex-col gap-2">
            {outcomes.map((o) => (
              <li key={o.id} className="flex items-center gap-2 text-sm text-body">
                <OutcomeBadge outcome={o.outcomeType} />
                <span>{new Date(o.occurredAt).toLocaleString()}</span>
                {o.contactRoleObserved && <span>— {o.contactRoleObserved}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
