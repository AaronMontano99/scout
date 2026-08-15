import Link from 'next/link';
import {
  resolveAccountQuery,
  getKnowledgeItemsForAccount,
  getContactsForAccount,
  getResearchFindingsForAccount,
} from '@/data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CertaintyBadge, RoleBadge } from '@/components/badges';
import { SourceChip } from '@/components/states';

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
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Research</h1>
        <p className="mt-1 text-sm text-body">Look up a company and see what Scout already knows about it.</p>
      </header>

      <form action="/app/research" method="GET" className="flex max-w-lg gap-2">
        <div className="flex-1">
          <Input name="q" defaultValue={query} placeholder="Enter company name or domain…" />
        </div>
        <Button type="submit">Search</Button>
      </form>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          {!query && (
            <div className="rounded-lg border border-hairline-strong bg-surface-card px-4 py-8 text-center text-sm text-muted">
              Enter a company name or domain above to see what Scout already knows.
            </div>
          )}

          {query && result && !result.account && (
            <div className="rounded-lg border border-hairline-strong bg-surface-card p-6">
              <div className="text-sm font-semibold text-ink">No existing account matches &ldquo;{query}&rdquo;</div>
              <p className="mt-1 text-sm text-body">
                Scout found nothing in your local workspace for this company. Live web research isn&apos;t available
                (see the Research Provider status), so the only way to get this account into Scout right now is to
                add it yourself.
              </p>
              <Link
                href={`/app/accounts/new`}
                className="mt-3 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary"
              >
                Add &ldquo;{query}&rdquo; as an Account
              </Link>
            </div>
          )}

          {query && result?.account && (
            <ResolvedAccount accountId={result.account.id} verdict={result.match.verdict} name={result.account.name} />
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-lg border border-hairline-strong bg-surface-card p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">Research Provider</div>
            <div className="mt-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-muted" />
              <span className="text-sm font-medium text-ink">Not configured</span>
            </div>
            <p className="mt-2 text-xs text-body">
              No live research provider is connected, so Scout can&apos;t fetch new web/news evidence right now.
              Everything shown here comes from what&apos;s already stored locally.
            </p>
            <Link href="/app/settings" className="mt-2 inline-block text-xs text-text-link hover:underline">
              Open Settings →
            </Link>
          </div>
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
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-hairline-strong bg-surface-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-ink">Matched: {name}</div>
            {verdict === 'review' && (
              <div className="mt-1 text-xs text-accent-warning">
                This match needs review — confidence wasn&apos;t high enough to apply automatically.
              </div>
            )}
          </div>
          <Link href={`/app/accounts/${accountId}`} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-on-primary">
            Open Brief
          </Link>
        </div>
      </div>

      <section>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">Existing Account History</div>
        {items.length === 0 ? (
          <p className="mt-1 text-sm text-muted">No notes recorded for this account yet.</p>
        ) : (
          <ul className="mt-1 flex flex-col gap-2 text-sm text-body">
            {items.slice(0, 8).map((k) => (
              <li key={k.id} className="flex items-start gap-2">
                <CertaintyBadge certainty={k.certaintyType} />
                <span>{k.content}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">Existing Contacts</div>
        {contacts.length === 0 ? (
          <p className="mt-1 text-sm text-muted">No contacts recorded for this account yet.</p>
        ) : (
          <ul className="mt-1 flex flex-col gap-2 text-sm">
            {contacts.map(({ contact, relationship }) => (
              <li key={contact.id} className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-ink">
                  {contact.firstName} {contact.lastName}
                </span>
                <span className="text-body">{contact.title}</span>
                <RoleBadge role={relationship.roleHypothesis} />
                <CertaintyBadge certainty={relationship.certaintyType} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted">Existing Sources</div>
        {findings.length === 0 ? (
          <p className="mt-1 text-sm text-muted">No stored research findings for this account yet.</p>
        ) : (
          <ul className="mt-1 flex flex-col gap-1 text-sm text-body">
            {findings.map((f) => (
              <li key={f.id}>
                {f.content} {f.url && <SourceChip url={f.url} label={f.sourceName} />}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
