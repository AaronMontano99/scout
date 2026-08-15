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
  getGeneratedCommunication,
} from '@/data';
import { getPrimaryListItemForAccount } from '@/data/calls';
import { CertaintyBadge, OutcomeBadge } from '@/components/badges';
import { SourceChip } from '@/components/states';
import { Disclosure } from '@/components/disclosure';
import { FreshnessChip } from '@/components/priority';
import { MicroLabel } from '@/components/ui/micro-label';
import { Button } from '@/components/ui/button';
import { MarkWorkedButtonBrief } from '@/components/list-item-actions';
import { RefreshResearchButton } from '@/components/refresh-research-button';
import { CommunicationGenerator } from '@/components/communication-generator';

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

const ROLE_LABEL: Record<string, string> = {
  decision_maker: 'Decision Maker',
  economic_buyer: 'Economic Buyer',
  champion: 'Champion',
  influencer: 'Influencer',
  technical_buyer: 'Technical Buyer',
  blocker: 'Blocker',
  unknown: 'Unknown',
};

export default async function AccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ expand?: string }>;
}) {
  const { id } = await params;
  const { expand } = await searchParams;
  const account = getAccount(id);
  if (!account) notFound();

  const brief = getAccountBrief(id);
  const contacts = getContactsForAccount(id);
  const knowledgeItems = getKnowledgeItemsForAccount(id);
  // "What Your Team Knows" shows things a person recorded — the
  // AI-synthesized What They Do/What Matters already have their own
  // sections above, so exclude them here to avoid showing the same
  // content twice. They still appear in the full timeline below.
  const teamKnowledgeItems = knowledgeItems.filter((k) => !(k.structuredValue as { kind?: string } | null)?.kind?.startsWith('ai_'));
  const findings = getResearchFindingsForAccount(id);
  const outcomes = getCallOutcomesForAccount(id);
  const sellingSituations = getSellingSituationsForAccount(id);

  const incumbentItem = knowledgeItems.find((k) => k.type === 'incumbent_vendor');
  const incumbentName = incumbentItem?.structuredValue?.competitor_name as string | undefined;
  const competitorMemory = incumbentName ? getCompetitorMemory().find((m) => m.competitor === incumbentName) : null;
  const lists = getListsForAccount(id);
  const primaryItem = getPrimaryListItemForAccount(id);
  const callScriptDraft = getGeneratedCommunication(id, 'call_script')?.content ?? null;
  const voicemailDraft = getGeneratedCommunication(id, 'voicemail_script')?.content ?? null;
  const emailDraft = getGeneratedCommunication(id, 'email_draft')?.content ?? null;

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-4">
      <div className="flex items-center gap-2 text-[12.5px]">
        <Link href="/app/accounts" className="text-body hover:text-ink">
          Accounts
        </Link>
        <span className="text-[#B8BDC4]">/</span>
        <span className="text-muted">{account.name}</span>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-hairline-strong bg-surface-card shadow-[0_8px_28px_rgba(17,24,39,0.05)]">
        <div className="border-b border-hairline px-7 pt-6 pb-5">
          <div className="flex items-start justify-between gap-7">
            <div className="min-w-0">
              <h1 className="text-[25px] leading-tight font-semibold tracking-[-0.02em] text-ink">{account.name}</h1>
              <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                {account.primaryDomain && <span className="text-[13px] text-body">{account.primaryDomain}</span>}
                <span className="h-[3px] w-[3px] rounded-full bg-hairline-strong" />
                <span className="inline-flex rounded-full bg-surface-strong px-2.5 py-0.5 text-[11.5px] font-medium text-ink">
                  {RELATIONSHIP_LABEL[account.relationshipStatus]}
                </span>
                {account.employeeCountRange && <span className="text-[12.5px] text-muted">{account.employeeCountRange} employees</span>}
                {lists.length > 0 && (
                  <>
                    <span className="h-[3px] w-[3px] rounded-full bg-hairline-strong" />
                    <span className="text-[12.5px] text-muted">On list:</span>
                    {lists.map((l) => (
                      <Link key={l.id} href={`/app/lists/${l.id}`} className="inline-flex rounded-full border border-hairline px-2.5 py-0.5 text-[11.5px] text-body hover:border-hairline-strong">
                        {l.name}
                      </Link>
                    ))}
                  </>
                )}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <FreshnessChip label={describeCompanyFreshness(id)} />
                <span className="h-[3px] w-[3px] rounded-full bg-hairline-strong" />
                <Link href={`/app/people?account=${id}`} className="text-[12.5px] text-text-link hover:underline">
                  View all people →
                </Link>
              </div>
            </div>
            <div className="flex w-[190px] shrink-0 flex-col gap-2">
              <Link href={`/app/accounts/${id}/post-call`}>
                <Button className="w-full !py-[11px] !text-[13px]">Log call</Button>
              </Link>
              <div className="flex gap-2">
                <Link href={`/app/accounts/${id}/notes/new`} className="flex-1">
                  <Button variant="secondary" className="w-full !py-[9px] !text-[12.5px]">
                    Add note
                  </Button>
                </Link>
                <div className="flex-1">
                  <MarkWorkedButtonBrief itemId={primaryItem?.id ?? null} worked={primaryItem?.worked ?? false} />
                </div>
              </div>
              <RefreshResearchButton accountId={id} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6 px-7 py-6">
          {brief && (
            <>
              <section>
                <MicroLabel>What They Do</MicroLabel>
                <p className="mt-1.5 max-w-[760px] text-[14.5px] leading-[1.55] text-ink">{brief.whatTheyDo}</p>
              </section>

              <section>
                <MicroLabel color={brief.noStrongTrigger ? 'text-accent-warning' : undefined}>
                  {brief.noStrongTrigger ? 'No Strong Current Trigger' : 'What Matters'}
                </MicroLabel>
                <div className="mt-2.5 flex max-w-[800px] flex-col gap-2">
                  {brief.whatMatters.map((m, i) => (
                    <div key={i} className="flex items-baseline gap-2.5">
                      <span className="mt-[-3px] h-1 w-1 shrink-0 self-center rounded-full bg-[#2F80FF]" />
                      <span className="text-sm leading-[1.55] text-ink">{m}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <MicroLabel>What Your Team Knows</MicroLabel>
                <div className="mt-2.5 flex max-w-[800px] flex-col gap-2">
                  {teamKnowledgeItems.length === 0 ? (
                    <p className="text-sm text-muted">No notes yet — add one to start building a record here.</p>
                  ) : (
                    teamKnowledgeItems.slice(0, 6).map((k) => (
                      <div key={k.id} className="flex items-baseline gap-2.5 rounded-md px-2 py-1.5">
                        <CertaintyBadge certainty={k.certaintyType} />
                        <span className="text-[13.5px] leading-[1.55] text-body">{k.content}</span>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section>
                <div className="flex items-baseline justify-between">
                  <MicroLabel>Who Matters</MicroLabel>
                  {contacts.length > 0 && (
                    <Link href={`/app/accounts/${id}/contacts/new`} className="text-[12.5px] text-text-link hover:underline">
                      + Add contact
                    </Link>
                  )}
                </div>
                {contacts.length === 0 ? (
                  <p className="mt-2 text-[13.5px] text-muted">
                    No relevant people confirmed yet.{' '}
                    <Link href={`/app/accounts/${id}/contacts/new`} className="text-text-link hover:underline">
                      Add one →
                    </Link>
                  </p>
                ) : (
                  <div className="mt-2.5 overflow-hidden rounded-[10px] border border-hairline">
                    <div className="grid grid-cols-[1fr_1fr_150px_120px_1fr] gap-3.5 border-b border-hairline bg-canvas-soft px-4 py-2">
                      <MicroLabel>Name</MicroLabel>
                      <MicroLabel>Title</MicroLabel>
                      <MicroLabel>Buying Role</MicroLabel>
                      <MicroLabel>Certainty</MicroLabel>
                      <MicroLabel>Note</MicroLabel>
                    </div>
                    {contacts.map(({ contact, relationship, freshnessLabel }) => (
                      <div key={contact.id} className="grid grid-cols-[1fr_1fr_150px_120px_1fr] items-center gap-3.5 border-b border-hairline px-4 py-2.5 last:border-b-0">
                        <span className="truncate text-[13.5px] font-medium text-ink">
                          {contact.firstName} {contact.lastName}
                        </span>
                        <span className="truncate text-[13px] text-body">{contact.title ?? '—'}</span>
                        <span className="text-[13px] text-ink">{ROLE_LABEL[relationship.roleHypothesis]}</span>
                        <CertaintyBadge certainty={relationship.certaintyType} />
                        <span className="truncate text-xs text-muted">{freshnessLabel}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {findings.length > 0 && (
                <section>
                  <div className="flex items-baseline justify-between">
                    <MicroLabel>Recent Developments</MicroLabel>
                    <FreshnessChip label={describeNewsFreshness(id)} />
                  </div>
                  <div className="mt-2.5 flex max-w-[800px] flex-col gap-2">
                    {findings.map((f) => (
                      <div key={f.id} className="text-[13.5px] leading-[1.55] text-body">
                        {f.content} {f.url && <SourceChip url={f.url} label={f.sourceName} />}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <MicroLabel>Talking Points</MicroLabel>
                <ol className="mt-2.5 flex max-w-[800px] flex-col gap-1.5 text-sm text-body">
                  {brief.talkingPoints.map((t, i) => (
                    <li key={i}>
                      {i + 1}. {t}
                    </li>
                  ))}
                </ol>
              </section>
            </>
          )}
        </div>
      </div>

      <div>
        <MicroLabel>Outreach</MicroLabel>
        <p className="mt-1 text-xs text-muted">Written in your saved Seller Style (Settings → Seller Style) — never invents facts, times, or customer names.</p>
        <div className="mt-2.5 grid gap-3 sm:grid-cols-3">
          <CommunicationGenerator accountId={id} communicationType="call_script" initialText={callScriptDraft} />
          <CommunicationGenerator accountId={id} communicationType="voicemail" initialText={voicemailDraft} />
          <CommunicationGenerator accountId={id} communicationType="email" initialText={emailDraft} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <MicroLabel>Call History</MicroLabel>
        <Link href={`/app/accounts/${id}/post-call`} className="text-[12.5px] text-text-link hover:underline">
          Log another call →
        </Link>
      </div>
      {outcomes.length === 0 ? (
        <p className="text-sm text-muted">No calls logged yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {outcomes.map((o) => (
            <li key={o.id} className="flex items-center gap-2 text-sm text-body">
              <OutcomeBadge outcome={o.outcomeType} />
              <span>{new Date(o.occurredAt).toLocaleDateString()}</span>
              {o.contactRoleObserved && <span>— {o.contactRoleObserved}</span>}
            </li>
          ))}
        </ul>
      )}

      {sellingSituations.length > 0 && (
        <section>
          <MicroLabel>Selling Situations</MicroLabel>
          {sellingSituations.map((s) => (
            <div key={s.id} className="mt-1 rounded-lg border border-hairline-strong bg-surface-card p-4 text-sm">
              <div className="font-medium text-ink">Real Deal Check</div>
              <p className="mt-1 text-body">{s.notes}</p>
            </div>
          ))}
        </section>
      )}

      <Disclosure label="Show full account brain →" expandedLabel="↑ Hide full account brain" defaultOpen={expand === '1'}>
        <div className="flex flex-col gap-6 border-t border-hairline pt-6">
          <div className="flex items-center justify-between">
            <MicroLabel>Full Knowledge Timeline</MicroLabel>
            <Link href={`/app/accounts/${id}/notes/new`} className="text-[12.5px] text-text-link hover:underline">
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
            {knowledgeItems.length === 0 && <li className="text-sm text-muted">No notes recorded for this account yet.</li>}
          </ul>

          {competitorMemory && (
            <div>
              <MicroLabel>What Your Team Has Learned About {incumbentName}</MicroLabel>
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
