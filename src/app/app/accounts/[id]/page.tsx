import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getAccount,
  getAccountBrief,
  getContactsForAccount,
  getKnowledgeItemsForAccount,
  getResearchFindingsForAccount,
  getCallOutcomesForAccount,
  getSellingSituationsForAccount,
  getCompetitorMemory,
  describeCompanyFreshness,
  describeNewsFreshness,
  getListsForAccount,
} from '@/data';
import { CertaintyBadge, RoleBadge, OutcomeBadge } from '@/components/badges';
import { SourceChip } from '@/components/states';
import { Disclosure } from '@/components/disclosure';
import { FreshnessChip } from '@/components/priority';

// Account page for your real data — same layout as
// src/app/demo/accounts/[id]/page.tsx, honest instead of AI-authored:
// "What They Do" / "What Matters" reflect only what was actually
// entered (see getAccountBrief in src/data/index.ts). No talk track —
// there's no AI provider generating one. See docs/LOCAL_MODE.md.

const RELATIONSHIP_LABEL: Record<string, string> = {
  prospect: 'Prospect',
  current_customer: 'Current Customer',
  former_customer: 'Former Customer',
  partner: 'Partner',
  unknown: 'Unknown Relationship',
};

export default async function AccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = getAccount(id);
  if (!account) notFound();

  const brief = getAccountBrief(id);
  const contacts = getContactsForAccount(id);
  const knowledgeItems = getKnowledgeItemsForAccount(id);
  const findings = getResearchFindingsForAccount(id);
  const outcomes = getCallOutcomesForAccount(id);
  const sellingSituations = getSellingSituationsForAccount(id);

  const incumbentItem = knowledgeItems.find((k) => k.type === 'incumbent_vendor');
  const incumbentName = incumbentItem?.structuredValue?.competitor_name as string | undefined;
  const competitorMemory = incumbentName
    ? getCompetitorMemory().find((m) => m.competitor === incumbentName)
    : null;
  const lists = getListsForAccount(id);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <div className="text-xs text-muted">
          <Link href="/app/accounts" className="hover:text-ink">
            Accounts
          </Link>{' '}
          / {account.name}
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{account.name}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-body">
          <span>{RELATIONSHIP_LABEL[account.relationshipStatus]}</span>
          {account.primaryDomain && <span>{account.primaryDomain}</span>}
          {account.employeeCountRange && <span>{account.employeeCountRange} employees</span>}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          {lists.length > 0 ? (
            lists.map((l) => (
              <Link key={l.id} href={`/app/lists/${l.id}`} className="text-text-link hover:underline">
                {l.name}
              </Link>
            ))
          ) : (
            <span>Not on any Target List yet</span>
          )}
          <Link href={`/app/people?account=${id}`} className="text-text-link hover:underline">
            View all people →
          </Link>
        </div>
      </header>

      {brief && (
        <>
          <section>
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted">What They Do</div>
              <FreshnessChip label={describeCompanyFreshness(id)} />
            </div>
            <p className="mt-1 text-sm text-body">{brief.whatTheyDo}</p>
          </section>

          <section>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">What Matters</div>
            <ul className="mt-1 flex flex-col gap-1 text-sm text-body">
              {brief.whatMatters.map((m, i) => (
                <li key={i}>· {m}</li>
              ))}
            </ul>
          </section>

          <section>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">People</div>
            {contacts.length === 0 ? (
              <p className="mt-1 text-sm text-muted">
                No contacts added yet.{' '}
                <Link href={`/app/accounts/${id}/contacts/new`} className="text-text-link hover:underline">
                  Add one →
                </Link>
              </p>
            ) : (
              <ul className="mt-1 flex flex-col gap-2">
                {contacts.map(({ contact, relationship, freshnessLabel }) => (
                  <li key={contact.id} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="font-medium text-ink">
                      {contact.firstName} {contact.lastName}
                    </span>
                    <span className="text-body">{contact.title}</span>
                    <RoleBadge role={relationship.roleHypothesis} />
                    <CertaintyBadge certainty={relationship.certaintyType} />
                    <FreshnessChip label={freshnessLabel} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {findings.length > 0 && (
            <section>
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Recent News / Developments
                </div>
                <FreshnessChip label={describeNewsFreshness(id)} />
              </div>
              <ul className="mt-1 flex flex-col gap-2 text-sm text-body">
                {findings.map((f) => (
                  <li key={f.id}>
                    {f.content} {f.url && <SourceChip url={f.url} label={f.sourceName} />}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">Talking Points</div>
            <ul className="mt-1 flex flex-col gap-1 text-sm text-body">
              {brief.talkingPoints.map((t, i) => (
                <li key={i}>· {t}</li>
              ))}
            </ul>
          </section>
        </>
      )}

      <section>
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">Call History</div>
          <Link
            href={`/app/accounts/${id}/post-call`}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-on-primary"
          >
            Log Call
          </Link>
        </div>
        {outcomes.length === 0 ? (
          <p className="mt-1 text-sm text-muted">No calls logged yet.</p>
        ) : (
          <ul className="mt-1 flex flex-col gap-2">
            {outcomes.map((o) => (
              <li key={o.id} className="flex items-center gap-2 text-sm text-body">
                <OutcomeBadge outcome={o.outcomeType} />
                <span>{new Date(o.occurredAt).toLocaleDateString()}</span>
                {o.contactRoleObserved && <span>— {o.contactRoleObserved}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {sellingSituations.length > 0 && (
        <section>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">Selling Situations</div>
          {sellingSituations.map((s) => (
            <div key={s.id} className="mt-1 rounded-lg border border-hairline-strong bg-surface-card p-4 text-sm">
              <div className="font-medium text-ink">Real Deal Check</div>
              <p className="mt-1 text-body">{s.notes}</p>
            </div>
          ))}
        </section>
      )}

      <Disclosure label="Show full knowledge timeline →" expandedLabel="↑ Hide knowledge timeline">
        <div className="flex flex-col gap-6 border-t border-hairline pt-6">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">Full Knowledge Timeline</div>
            <Link href={`/app/accounts/${id}/notes/new`} className="text-xs text-text-link hover:underline">
              + Add Note
            </Link>
          </div>
          <ul className="-mt-3 flex flex-col gap-3">
            {knowledgeItems.map((k) => (
              <li key={k.id} className="text-sm">
                <div className="flex items-center gap-2">
                  <CertaintyBadge certainty={k.certaintyType} />
                  <span className="text-xs text-muted">
                    {k.observedAt ? new Date(k.observedAt).toLocaleDateString() : 'date unknown'} · {k.origin}
                  </span>
                </div>
                <p className="mt-1 text-body">{k.content}</p>
              </li>
            ))}
            {knowledgeItems.length === 0 && (
              <li className="text-sm text-muted">No notes recorded for this account yet.</li>
            )}
          </ul>

          {competitorMemory && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                What Your Team Has Learned About {incumbentName}
              </div>
              <ul className="mt-2 flex flex-col gap-1 text-sm text-body">
                {competitorMemory.items.map((item) => (
                  <li key={item.id}>· {item.content}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Disclosure>
    </div>
  );
}
