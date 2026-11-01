import Link from 'next/link';
import { Download } from 'lucide-react';
import { getAllActivities } from '@/data/sdr';
import { readFunnel } from '@/domain/day-summary';
import { callHeatmap, parseRange, rangeWindow, rate, topAccounts, totals, weeklySeries } from '@/domain/metrics';
import { PageHeader } from '@/components/ui/page-header';
import { ActivityChart, CallHeatmap, ConnectRateChart, Funnel, Legend, Sparkline } from '@/components/dashboard/charts';
import { RangePills } from '@/components/dashboard/range-pills';
import { Panel, Stat, pct } from '@/components/dashboard/stat';

export const dynamic = 'force-dynamic';

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const range = parseRange((await searchParams).range);
  const window = rangeWindow(range, new Date());
  const all = getAllActivities();
  const between = (from: Date, to: Date) => all.filter((a) => new Date(a.occurredAt) >= from && new Date(a.occurredAt) < to);
  const current = between(window.start, window.end);
  const t = totals(current);
  const prev = totals(between(window.previousStart, window.start));
  const series = weeklySeries(current, window.start, window.end);
  const connect = rate(t.connects, t.dials);
  const meetingRate = rate(t.meetings, t.touches);
  const accounts = topAccounts(current, window.start, window.end);
  const reads = readFunnel({ dials: t.dials, connects: t.connects, voicemails: t.voicemails, dmConversations: t.dmConversations, relevantConversations: t.relevantConversations, meetingAsks: t.meetingAsks, meetingsBooked: t.meetingsByChannel.calls });
  const hasPrev = prev.touches > 0;
  const period = `last ${window.weeks} weeks`;
  const channels = [
    { label: 'Calls', value: t.meetingsByChannel.calls },
    { label: 'Emails', value: t.meetingsByChannel.emails },
    { label: 'Walk-ins', value: t.meetingsByChannel.walkIns },
    { label: 'LinkedIn', value: t.meetingsByChannel.linkedin },
  ];

  return (
    <div className="rise flex flex-col gap-4">
      <PageHeader
        title="Reports"
        subtitle="Only what you logged. Nothing estimated."
        actions={
          <>
            <RangePills value={range} path="/reports" />
            <a href={`/reports/export?range=${range}`} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-[13.5px] font-semibold text-on-primary hover:bg-primary-active">
              <Download size={15} />
              Export CSV
            </a>
          </>
        }
      />

      <section aria-label="Totals" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Stat label="Touches" value={String(t.touches)} delta={hasPrev ? t.touches - prev.touches : null} detail={hasPrev ? 'vs the period before' : period} />
        <Stat label="Connect rate" value={pct(connect)} detail={connect.denominator ? `${connect.numerator} of ${connect.denominator} dials` : 'No dials in this range'} />
        <Stat label="Meetings booked" value={String(t.meetings)} delta={hasPrev ? t.meetings - prev.meetings : null} detail={hasPrev ? 'vs the period before' : period} />
        <Stat label="Touches per meeting" value={t.meetings ? String(Math.round(t.touches / t.meetings)) : '—'} detail={t.meetings ? `${pct(meetingRate)} of touches book one` : 'No meetings in this range'} />
      </section>

      <Panel title="Activity by channel">
        <ActivityChart data={series} height={280} />
        <Legend />
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Call funnel">
          <Funnel
            steps={[
              { label: 'Dials', value: t.dials, rate: null },
              { label: 'Connects', value: t.connects, rate: rate(t.connects, t.dials) },
              { label: 'DM talks', value: t.dmConversations, rate: rate(t.dmConversations, t.connects) },
              { label: 'Relevant', value: t.relevantConversations, rate: rate(t.relevantConversations, t.dmConversations) },
              { label: 'Meeting asks', value: t.meetingAsks, rate: rate(t.meetingAsks, t.relevantConversations) },
              { label: 'Meetings', value: t.meetingsByChannel.calls, rate: rate(t.meetingsByChannel.calls, t.meetingAsks) },
            ]}
          />
          {reads.length > 0 && (
            <ul className="flex flex-col gap-1 border-t border-hairline pt-3 text-[13.5px] leading-[1.5] text-body">
              {reads.map((r) => (
                <li key={r}>{r.replace(/\btoday\b/g, 'in this range')}</li>
              ))}
            </ul>
          )}
        </Panel>
        <div className="flex min-w-0 flex-col gap-4">
          <Panel title="Email funnel">
            <Funnel
              steps={[
                { label: 'Sent', value: t.emailsSent, rate: null },
                { label: 'Replies', value: t.emailReplies, rate: rate(t.emailReplies, t.emailsSent) },
                { label: 'Relevant', value: t.relevantReplies, rate: rate(t.relevantReplies, t.emailReplies) },
                { label: 'Meetings', value: t.meetingsByChannel.emails, rate: rate(t.meetingsByChannel.emails, t.emailReplies) },
              ]}
            />
          </Panel>
          <Panel title="Where meetings come from">
            {t.meetings === 0 ? (
              <p className="text-[14px] text-body">No meetings logged in this range.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-[14px]">
                {channels
                  .filter((c) => c.value > 0)
                  .sort((a, b) => b.value - a.value)
                  .map((c) => (
                    <li key={c.label} className="flex items-center justify-between">
                      <span className="text-body">{c.label}</span>
                      <span className="font-medium">
                        {c.value} ({Math.round((c.value / t.meetings) * 100)}%)
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Connect rate by week">
          <ConnectRateChart data={series} average={connect.rate} />
          <p className="text-[13px] text-body">{connect.rate === null ? 'No dials in this range.' : `Dashed line is the ${window.weeks}-week average, ${pct(connect)}.`}</p>
        </Panel>
        <Panel title="When people pick up">
          <CallHeatmap cells={callHeatmap(current)} />
        </Panel>
      </div>

      <Panel title="Most-worked accounts">
        {accounts.length === 0 ? (
          <p className="text-[14px] text-body">No touches in this range.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[14px]">
              <thead>
                <tr className="text-[13px] text-body">
                  <th scope="col" className="pb-2 font-medium">Account</th>
                  <th scope="col" className="pb-2 text-right font-medium">Touches</th>
                  <th scope="col" className="pb-2 text-right font-medium">Talks</th>
                  <th scope="col" className="pb-2 text-right font-medium">Meetings</th>
                  <th scope="col" className="w-[120px] pb-2 pl-5 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.accountId} className="border-t border-hairline">
                    <td className="py-2.5">
                      <Link href={`/accounts/${a.accountId}`} className="font-medium hover:underline">
                        {a.accountName}
                      </Link>
                    </td>
                    <td className="py-2.5 text-right">{a.touches}</td>
                    <td className="py-2.5 text-right">{a.conversations}</td>
                    <td className="py-2.5 text-right">{a.meetings}</td>
                    <td className="py-1.5 pl-5">
                      <Sparkline values={a.trend} label={`${a.accountName} touches by week: ${a.trend.join(', ')}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
