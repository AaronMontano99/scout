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
  getIdentityWarning,
  describeCompanyFreshness,
  describeNewsFreshness,
} from '@/demo';
import { CertaintyBadge, RoleBadge, OutcomeBadge } from '@/components/badges';
import { SourceChip } from '@/components/states';
import { Disclosure } from '@/components/disclosure';
import { FreshnessChip } from '@/components/priority';

const RESEARCH_STATUS_BANNER: Partial<Record<string, string>> = {
  processing: 'Research in progress — showing available information now.',
  refreshing: 'Refreshing research — showing the most recent information available.',
  limited_data: 'Limited public information found. Accuracy beats manufactured content — see below for what is confirmed.',
  needs_review: 'Company identity needs review before treating research below as reliable.',
  queued: 'Research not yet started for this account.',
};

// Signature experiences #2 (Call-Ready Brief) and #3 (Account Memory) —
// deliberately one continuous page, not a grid of boxed widgets or
// separate tabs. Default view is ~30 seconds of reading (product spec
// §21-22); deeper research/full Account Brain is opt-in via Disclosure.

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
  const identityWarning = getIdentityWarning(id);
  const statusBanner = RESEARCH_STATUS_BANNER[account.researchStatus];

  const incumbentItem = knowledgeItems.find((k) => k.type === 'incumbent_vendor');
  const incumbentName = incumbentItem?.structuredValue?.competitor_name as string | undefined;
  const competitorMemory = incumbentName
    ? getCompetitorMemory().find((m) => m.competitor === incumbentName)
    : null;

  return (
    <div className="flex flex-col gap-8">
      {identityWarning && (
        <div className="rounded-md border-l-[3px] border-l-accent-warning bg-surface-strong px-4 py-3 text-sm text-ink">
          <strong>{identityWarning.warning}</strong>
          {identityWarning.rawImportedName && identityWarning.matchConfidence !== undefined && (
            <div className="mt-1 text-xs text-body">
              Imported as &ldquo;{identityWarning.rawImportedName}&rdquo;, matched to this account at{' '}
              {Math.round(identityWarning.matchConfidence * 100)}% confidence.
            </div>
          )}
        </div>
      )}

      {!identityWarning && statusBanner && (
        <div className="rounded-md border-l-[3px] border-l-hairline-strong bg-surface-strong px-4 py-3 text-sm text-body">
          {statusBanner}
        </div>
      )}

      <header>
        <div className="text-xs text-muted">
          <Link href="/demo/lists" className="hover:text-ink">
            My Lists
          </Link>{' '}
          / {account.name}
        </div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{account.name}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-body">
          <span>{RELATIONSHIP_LABEL[account.relationshipStatus]}</span>
          {account.primaryDomain && <span>{account.primaryDomain}</span>}
          {account.employeeCountRange && <span>{account.employeeCountRange} employees</span>}
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
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">
              {brief.noStrongTrigger ? 'No Strong Current Trigger' : 'What Matters'}
            </div>
            <ul className="mt-1 flex flex-col gap-1 text-sm text-body">
              {brief.whatMatters.map((m, i) => (
                <li key={i}>· {m}</li>
              ))}
            </ul>
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
                    {f.content}{' '}
                    {f.url && <SourceChip url={f.url} label={f.sourceName} />}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {knowledgeItems.length > 0 && (
            <section>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted">What Your Team Knows</div>
              <ul className="mt-1 flex flex-col gap-1 text-sm text-body">
                {knowledgeItems.slice(0, 3).map((k) => (
                  <li key={k.id} className="flex items-start gap-2">
                    <CertaintyBadge certainty={k.certaintyType} />
                    <span>{k.content}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {contacts.length > 0 && (
            <section>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted">People</div>
              <ul className="mt-1 flex flex-col gap-2">
                {contacts.map(({ contact, relationship, freshnessLabel }) => (
                  <li key={contact.id} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className={`font-medium ${relationship.isCurrent ? 'text-ink' : 'text-muted line-through'}`}>
                      {contact.firstName} {contact.lastName}
                    </span>
                    <span className="text-body">{contact.title}</span>
                    <RoleBadge role={relationship.roleHypothesis} />
                    <CertaintyBadge certainty={relationship.certaintyType} />
                    <FreshnessChip label={freshnessLabel} />
                    {!relationship.isCurrent && (
                      <span className="text-xs text-accent-warning">
                        superseded{relationship.validUntil ? ` ${new Date(relationship.validUntil).toLocaleDateString()}` : ''} — see history
                      </span>
                    )}
                    {relationship.isCurrent && contact.status === 'departed' && (
                      <span className="text-xs text-accent-warning">departed — needs re-verification</span>
                    )}
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

          {brief.talkTrack && (
            <section>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                Optional Talk Track (~30-50 sec)
              </div>
              <p className="mt-1 rounded-lg bg-surface-dark p-4 font-mono text-xs leading-relaxed text-on-dark">
                {brief.talkTrack}
              </p>
            </section>
          )}
        </>
      )}

      {outcomes.length > 0 && (
        <section>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted">Call History</div>
          <ul className="mt-1 flex flex-col gap-2">
            {outcomes.map((o) => (
              <li key={o.id} className="flex items-center gap-2 text-sm text-body">
                <OutcomeBadge outcome={o.outcomeType} />
                <span>{new Date(o.occurredAt).toLocaleDateString()}</span>
                {o.contactRoleObserved && <span>— {o.contactRoleObserved}</span>}
              </li>
            ))}
          </ul>
          <Link
            href={`/demo/accounts/${id}/post-call`}
            className="mt-3 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary"
          >
            View Post-Call Workflow
          </Link>
        </section>
      )}

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

      <Disclosure label="Show deeper research →" expandedLabel="↑ Hide deeper research">
        <div className="flex flex-col gap-6 border-t border-hairline pt-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">
              Full Knowledge Timeline
            </div>
            <ul className="mt-2 flex flex-col gap-3">
              {knowledgeItems.map((k) => (
                <li key={k.id} className="text-sm">
                  <div className="flex items-center gap-2">
                    <CertaintyBadge certainty={k.certaintyType} />
                    <span className="text-xs text-muted">
                      {k.observedAt ? new Date(k.observedAt).toLocaleDateString() : 'date unknown'} · {k.origin}
                    </span>
                  </div>
                  <p className="mt-1 text-body">{k.content}</p>
                  {k.sourceReference && <p className="text-xs text-muted">Source: {k.sourceReference}</p>}
                </li>
              ))}
              {knowledgeItems.length === 0 && (
                <li className="text-sm text-muted">No historical knowledge recorded for this account yet.</li>
              )}
            </ul>
          </div>

          {competitorMemory && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted">
                What Your Team Has Learned About {incumbentName}
              </div>
              <p className="mt-1 text-sm text-body">
                {competitorMemory.items.length} historical notes across your accounts mention {incumbentName}.
              </p>
              <ul className="mt-2 flex flex-col gap-1 text-sm text-body">
                {competitorMemory.items.map((item) => (
                  <li key={item.id}>· {item.content}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">All Sources</div>
            <ul className="mt-1 flex flex-col gap-1">
              {findings.map((f) => (
                <li key={f.id} className="text-sm">
                  {f.url ? <SourceChip url={f.url} label={f.sourceName} /> : f.sourceName} — retrieved{' '}
                  {new Date(f.retrievedAt).toLocaleDateString()}
                </li>
              ))}
              {findings.length === 0 && <li className="text-sm text-muted">No external research on file.</li>}
            </ul>
          </div>
        </div>
      </Disclosure>
    </div>
  );
}
