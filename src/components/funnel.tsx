import type { ProspectingFunnel } from '@/domain/analytics';
import { formatRate } from './stat-tile';

// Simple proportional-width bars, no charting library — product spec
// §30 requires every percentage to have a real denominator, and the
// anti-slop command rejects "meaningless charts." Bar width is
// directly derived from the real counts, nothing decorative.

interface Stage {
  label: string;
  count: number;
  rateFromPrevious?: { numerator: number; denominator: number; rate: number | null };
}

export function ProspectingFunnelView({ funnel }: { funnel: ProspectingFunnel }) {
  const stages: Stage[] = [
    { label: 'Calls Attempted', count: funnel.callsAttempted },
    { label: 'Conversations', count: funnel.conversations, rateFromPrevious: funnel.pickupRate },
    { label: 'Meetings Booked', count: funnel.meetingsBooked, rateFromPrevious: funnel.conversationToMeetingRate },
    {
      label: 'Selling Situations',
      count: funnel.sellingSituationsCreated,
      rateFromPrevious: funnel.meetingToSellingSituationRate,
    },
    {
      label: 'Opportunities',
      count: funnel.opportunitiesCreated,
      rateFromPrevious: funnel.sellingSituationToOpportunityRate,
    },
  ];
  const maxCount = Math.max(...stages.map((s) => s.count), 1);

  return (
    <div className="flex flex-col gap-3.5">
      {stages.map((stage) => (
        <div key={stage.label}>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-[13.5px] text-ink">{stage.label}</span>
            <span className="flex items-baseline gap-2.5">
              <span className="font-mono text-[13px] text-ink">{stage.count}</span>
              {stage.rateFromPrevious && (
                <span className="w-[100px] text-right text-[11.5px] text-muted">{formatRate(stage.rateFromPrevious).value}</span>
              )}
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface-strong">
            <div
              className="h-2 rounded-full bg-ink"
              style={{ width: `${Math.max((stage.count / maxCount) * 100, stage.count > 0 ? 2 : 0)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
