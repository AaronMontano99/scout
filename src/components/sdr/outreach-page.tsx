import Link from 'next/link';
import { getAccount, getRecentAccounts } from '@/data/accounts';
import { getActivitiesForAccount, getCrmNotes, getEmailLog, getHotListEntry, getIntel, getLastHotListCheck, getLatestDraft, getLeadCandidates, isIntelStale } from '@/data/sdr';
import { EmailLog } from './email-log';
import { ymd } from '@/domain/hot-list';
import { getIdentity } from '@/data/settings';
import { MicroLabel } from '@/components/ui/micro-label';
import { OutreachComposer } from './outreach-composer';
import { CallCardPanel } from './call-card-panel';
import { EmailPanel } from './email-panel';
import { DebriefPanel } from './debrief-panel';
import { IntelPanel } from './intel-panel';
import { HotListCard } from './hot-list-card';
import { CrmHistory } from './crm-history';
import { ActivityList } from './activity-list';
import { LeadCard, LeadFinder } from './lead-finder';

type Kind = 'call' | 'email';

/**
 * Calls and Emails share one shape: say who you're reaching out to at
 * the top; the call card or email lands underneath with the "why now"
 * research, your notes, and the Hot List status alongside.
 */
export function OutreachPage({ kind, accountId, go, instruction }: { kind: Kind; accountId?: string; go?: boolean; instruction?: string }) {
  const account = accountId ? getAccount(accountId) : null;
  const path = kind === 'call' ? '/calls' : '/emails';

  if (!account) {
    const recent = getRecentAccounts(10);
    const leads = kind === 'call' ? getLeadCandidates('new') : [];
    return (
      <div className={`rise mx-auto flex flex-col gap-6 ${kind === 'email' ? 'max-w-[1240px]' : 'max-w-[980px]'}`}>
        <div className={kind === 'email' ? 'mx-auto w-full max-w-[980px]' : ''}>
          <OutreachComposer kind={kind} />
        </div>
        {kind === 'email' && (
          <section className="flex flex-col gap-2">
            <MicroLabel>Email log: who&apos;s qualified in, who&apos;s out, and where each thread stands</MicroLabel>
            <EmailLog rows={getEmailLog()} />
          </section>
        )}
        {kind === 'call' && recent.length > 0 && (
          <section className="flex flex-col gap-2">
            <MicroLabel>Pick up where you left off</MicroLabel>
            <div className="flex flex-wrap gap-2">
              {recent.map(({ account: a }) => (
                <Link
                  key={a.id}
                  href={`${path}?a=${a.id}`}
                  className="rounded-full bg-surface-strong px-3.5 py-1.5 text-[13.5px] text-ink hover:bg-primary hover:text-on-primary"
                >
                  {a.name}
                </Link>
              ))}
            </div>
          </section>
        )}
        {kind === 'call' && (
          <section className="flex flex-col gap-3">
            <MicroLabel>Today&apos;s leads</MicroLabel>
            <LeadFinder territoryZips={getIdentity().zips} />
            {leads.map((c) => (
              <LeadCard key={c.id} candidate={c} />
            ))}
          </section>
        )}
      </div>
    );
  }

  const intel = getIntel(account.id);
  const hasFreshIntel = !isIntelStale(intel);
  const activities = getActivitiesForAccount(account.id);
  const cardDraft = getLatestDraft(account.id, 'call_card');
  const emailDraft = getLatestDraft(account.id, 'email');
  const emailSent = emailDraft ? activities.some((a) => a.outcome === 'email_sent' && a.occurredAt >= emailDraft.createdAt) : false;
  const zip = intel?.intel.localOffice.zip || account.zip;
  const phone = intel?.intel.localOffice.phone || account.phone;
  const inTerritory = intel?.intel.localOffice.inTerritory;
  const autoStart = go ? { instruction: instruction ?? '' } : null;
  const otherPath = kind === 'call' ? '/emails' : '/calls';

  return (
    <div className="rise mx-auto flex max-w-[1240px] flex-col gap-5">
      <OutreachComposer kind={kind} compact />

      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-ink">{account.name}</h1>
          {zip && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${
                inTerritory === 'yes' ? 'bg-good-soft text-good' : inTerritory === 'no' ? 'bg-bad-soft text-bad' : 'bg-surface-strong text-ink'
              }`}
            >
              {zip}
              {inTerritory === 'no' ? ' · outside territory' : ''}
            </span>
          )}
          {phone && (
            <a href={`tel:${phone}`} className="text-[13px] text-text-link hover:underline">
              {phone}
            </a>
          )}
          {account.domain && (
            <a href={`https://${account.domain}`} target="_blank" rel="noreferrer" className="text-[13px] text-body hover:text-ink">
              {account.domain}
            </a>
          )}
        </div>
        <Link href={`${otherPath}?a=${account.id}`} className="text-[12.5px] text-text-link hover:underline">
          {kind === 'call' ? 'Email them instead →' : 'Call them instead →'}
        </Link>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-5">
          <div className="glass px-6 py-5 ">
            {kind === 'call' ? (
              <CallCardPanel
                key={account.id}
                accountId={account.id}
                initialCard={cardDraft?.data ?? null}
                cardCreatedAt={cardDraft?.createdAt ?? null}
                hasFreshIntel={hasFreshIntel}
                autoStart={autoStart}
                identity={getIdentity()}
              />
            ) : (
              <EmailPanel
                key={account.id}
                accountId={account.id}
                initialDraft={emailDraft ? { id: emailDraft.id, data: emailDraft.data, createdAt: emailDraft.createdAt } : null}
                hasFreshIntel={hasFreshIntel}
                initiallySent={emailSent}
                autoStart={autoStart}
              />
            )}
          </div>

          <div className="glass px-6 py-5">
            <div className="mb-3">
              <h2 className="text-[15px] font-semibold text-ink">{kind === 'call' ? 'After the call' : 'Got a reply?'}</h2>
              <p className="text-[12.5px] text-muted">
                {kind === 'call'
                  ? 'Paste what happened. You get coaching, CRM notes, and the Hot List update.'
                  : 'Paste their reply or your notes. You get the read, CRM notes, and the next step.'}
              </p>
            </div>
            <DebriefPanel key={account.id} accountId={account.id} targetName={cardDraft?.data.target.name || null} defaultChannel={kind === 'call' ? 'call' : 'email'} />
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <IntelPanel intel={intel?.intel ?? null} researchedAt={intel?.researchedAt ?? null} />
          <HotListCard accountId={account.id} entry={getHotListEntry(account.id)} today={ymd(new Date())} lastCheck={getLastHotListCheck(account.id)} />
          <CrmHistory accountId={account.id} notes={getCrmNotes(account.id)} />
          {activities.length > 0 && <ActivityList activities={activities} title="History" />}
        </aside>
      </div>
    </div>
  );
}
