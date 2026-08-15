import Link from 'next/link';
import {
  resolveAccountQuery,
  getKnowledgeItemsForAccount,
  getContactsForAccount,
  getResearchFindingsForAccount,
} from '@/data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CertaintyBadge } from '@/components/badges';
import { SourceChip } from '@/components/states';
import { PageHeader } from '@/components/ui/page-header';
import { Panel } from '@/components/ui/panel';
import { MicroLabel } from '@/components/ui/micro-label';

// Research — resolves a company/domain against existing local
// knowledge and reports research-provider status honestly. No live
// provider is wired up in local-first mode (src/services/research-
// provider.ts is an unimplemented interface — see docs/LOCAL_MODE.md),
// so a "refresh" action is never offered; existing account memory is
// still fully shown.

export default async function ResearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim();
  const result = query ? resolveAccountQuery(query) : null;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Research" subtitle="Look up a company and see what Scout already knows about it." />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <Panel className="p-[18px_20px]">
            <form action="/app/research" method="GET" className="flex gap-2.5">
              <div className="flex-1">
                <Input name="q" defaultValue={query} placeholder="Enter company name or domain…" />
              </div>
              <Button type="submit" className="!px-5">
                Run
              </Button>
            </form>
          </Panel>

          {!query && (
            <Panel className="px-4 py-10 text-center text-sm text-muted">
              Enter a company name or domain above to see what Scout already knows.
            </Panel>
          )}

          {query && result && !result.account && (
            <Panel className="p-6">
              <div className="text-[13.5px] font-semibold text-ink">No existing account matches &ldquo;{query}&rdquo;</div>
              <p className="mt-1.5 text-[13.5px] leading-[1.55] text-body">
                Scout found nothing in your local workspace for this company. Live web research isn&apos;t available
                (see the Research Provider status), so the only way to get this account into Scout right now is to
                add it yourself.
              </p>
              <Link href="/app/accounts/new">
                <Button className="mt-3.5">Add &ldquo;{query}&rdquo; as an Account</Button>
              </Link>
            </Panel>
          )}

          {query && result?.account && (
            <ResolvedAccount accountId={result.account.id} verdict={result.match.verdict} name={result.account.name} />
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <Panel className="p-4">
            <MicroLabel>Research Provider</MicroLabel>
            <div className="mt-2.5 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-muted" />
              <span className="text-[13.5px] font-medium text-ink">Not configured</span>
            </div>
            <p className="mt-2 text-xs leading-[1.5] text-body">
              No live research provider is connected, so Scout can&apos;t fetch new web/news evidence right now.
              Everything shown here comes from what&apos;s already stored locally.
            </p>
            <Link href="/app/settings" className="mt-2 inline-block text-xs text-text-link hover:underline">
              Open Settings →
            </Link>
          </Panel>
        </aside>
      </div>
    </div>
  );
}

function ResolvedAccount({ accountId, verdict, name }: { accountId: string; verdict: string; name: string }) {
  const items = getKnowledgeItemsForAccount(accountId);
  const contacts = getContactsForAccount(accountId);
  const findings = getResearchFindingsForAccount(accountId);

  return (
    <div className="flex flex-col gap-4">
      <Panel className="p-[14px_16px]">
        <div className="flex items-center justify-between gap-4 rounded-[10px] border border-hairline bg-canvas-soft px-3.5 py-3">
          <div className="flex items-center gap-2.5">
            <MicroLabel>Matched To</MicroLabel>
            <span className="text-[13.5px] font-medium text-ink">{name}</span>
          </div>
          {verdict === 'review' && <span className="text-[12px] text-accent-warning">Needs review — confirm this is the right company</span>}
        </div>
        <Link href={`/app/accounts/${accountId}`} className="mt-3 inline-block">
          <Button>Open Brief</Button>
        </Link>
      </Panel>

      <Panel className="overflow-hidden">
        <div className="border-b border-hairline px-5 py-[15px]">
          <MicroLabel>Existing Account History</MicroLabel>
        </div>
        {items.length === 0 ? (
          <p className="px-5 py-4 text-sm text-muted">No notes recorded for this account yet.</p>
        ) : (
          <div>
            {items.slice(0, 8).map((k) => (
              <div key={k.id} className="flex items-baseline gap-2.5 border-b border-hairline px-5 py-2.5 last:border-b-0">
                <CertaintyBadge certainty={k.certaintyType} />
                <span className="text-[13px] leading-[1.5] text-body">{k.content}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel className="overflow-hidden">
        <div className="border-b border-hairline px-5 py-[15px]">
          <MicroLabel>Existing Contacts</MicroLabel>
        </div>
        {contacts.length === 0 ? (
          <p className="px-5 py-4 text-sm text-muted">No contacts recorded for this account yet.</p>
        ) : (
          <div>
            {contacts.map(({ contact, relationship }) => (
              <div key={contact.id} className="flex flex-wrap items-center gap-2.5 border-b border-hairline px-5 py-2.5 last:border-b-0">
                <span className="text-[13.5px] font-medium text-ink">
                  {contact.firstName} {contact.lastName}
                </span>
                <span className="text-[12.5px] text-body">{contact.title}</span>
                <CertaintyBadge certainty={relationship.certaintyType} />
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel className="overflow-hidden">
        <div className="border-b border-hairline px-5 py-[15px]">
          <MicroLabel>Existing Sources</MicroLabel>
        </div>
        {findings.length === 0 ? (
          <p className="px-5 py-4 text-sm text-muted">No stored research findings for this account yet.</p>
        ) : (
          <div>
            {findings.map((f) => (
              <div key={f.id} className="border-b border-hairline px-5 py-2.5 text-[13px] text-body last:border-b-0">
                {f.content} {f.url && <SourceChip url={f.url} label={f.sourceName} />}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
