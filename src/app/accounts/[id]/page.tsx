import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Globe, Mail, MapPin, Phone } from 'lucide-react';
import { getAccount } from '@/data/accounts';
import { getAccountDirectory, getActivitiesForAccount, getCrmNotes, getHotListEntry, getIntel } from '@/data/sdr';
import { getTasksForAccount } from '@/data/tasks';
import { STAGE_LABEL, actionFlag, ymd } from '@/domain/hot-list';
import { rate, totals } from '@/domain/metrics';
import { buildSchedule } from '@/domain/schedule';
import { CrmHistory } from '@/components/sdr/crm-history';
import { FlagBadge } from '@/components/sdr/hot-list-table';
import { IntelPanel } from '@/components/sdr/intel-panel';
import { LogButton } from '@/components/dashboard/log-button';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { Panel, Stat, pct } from '@/components/dashboard/stat';
import { AccountTasks } from '@/components/dashboard/account-tasks';

export const dynamic = 'force-dynamic';

export default async function AccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = getAccount(id);
  if (!account) notFound();

  const today = ymd(new Date());
  const hot = getHotListEntry(id);
  const activities = getActivitiesForAccount(id);
  const intel = getIntel(id);
  const t = totals(activities);
  const connect = rate(t.connects, t.dials);
  const items = buildSchedule(getTasksForAccount(id), hot ? [hot] : []);
  const contact = getAccountDirectory().find((r) => r.id === id)?.contact ?? '';
  const phone = intel?.intel.localOffice.phone || account.phone;
  const zip = intel?.intel.localOffice.zip || account.zip;

  return (
    <div className="rise flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/accounts" aria-label="Back to accounts" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-hairline-strong hover:bg-surface-strong">
          <ArrowLeft size={17} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-[28px] leading-[1.15] font-medium tracking-[-0.015em] sm:text-[34px]">{account.name}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13.5px] text-body">
            {contact && <span>{contact}</span>}
            {phone && (
              <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 hover:text-ink">
                <Phone size={13} />
                {phone}
              </a>
            )}
            {account.domain && (
              <a href={`https://${account.domain}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-ink">
                <Globe size={13} />
                {account.domain}
              </a>
            )}
            {zip && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={13} />
                {zip}
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/calls?a=${id}`} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[14px] font-semibold text-on-primary hover:bg-primary-active">
            <Phone size={15} />
            Call
          </Link>
          <Link href={`/emails?a=${id}`} className="inline-flex items-center gap-2 rounded-full border border-hairline-strong px-4 py-2.5 text-[14px] font-medium hover:bg-surface-strong">
            <Mail size={15} />
            Email
          </Link>
        </div>
      </div>

      <section aria-label="Totals" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Touches" value={String(t.touches)} detail={`${t.dials} dials, ${t.emailsSent} emails`} />
        <Stat label="Connect rate" value={pct(connect)} detail={connect.denominator ? `${connect.numerator} of ${connect.denominator} dials` : 'No dials yet'} />
        <Stat label="Meetings booked" value={String(t.meetings)} detail="All time" />
        <div className="glass flex min-w-0 flex-col gap-1 p-5">
          <p className="text-[13.5px] text-body">Hot List</p>
          {hot ? (
            <>
              <p data-stage={hot.stage} className="flex items-center gap-2 font-head text-[22px] leading-snug font-medium">
                <span className="stage-dot" />
                {STAGE_LABEL[hot.stage]}
              </p>
              <div className="mt-1 flex items-center gap-2 text-[13px] text-body">
                <FlagBadge flag={actionFlag(hot.nextTouchDate, today)} />
                {hot.priority}
              </div>
            </>
          ) : (
            <p className="text-[14px] text-muted">Not on the list</p>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          {hot && (hot.nextQuestion || hot.learned) && (
            <Panel title="Where it stands">
              {hot.nextQuestion && (
                <div>
                  <p className="text-[13px] font-medium text-body">Next question to earn the meeting</p>
                  <p className="mt-0.5 text-[15px] leading-[1.5]">{hot.nextQuestion}</p>
                </div>
              )}
              {hot.learned && (
                <div>
                  <p className="text-[13px] font-medium text-body">What you learned</p>
                  <p className="mt-0.5 text-[14px] leading-[1.55]">{hot.learned}</p>
                </div>
              )}
            </Panel>
          )}
          <Panel title="Interaction history" action={<LogButton company={account.name} />}>
            <RecentActivity activities={activities} hideAccount />
          </Panel>
        </div>
        <aside className="flex min-w-0 flex-col gap-4">
          <AccountTasks accountId={id} items={items} today={today} />
          <IntelPanel intel={intel?.intel ?? null} researchedAt={intel?.researchedAt ?? null} />
          <CrmHistory accountId={id} notes={getCrmNotes(id)} />
        </aside>
      </div>
    </div>
  );
}
