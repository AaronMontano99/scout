import type { Rate } from '@/domain/metrics';
import { Sparkline } from './charts';

/** A headline number. Rates always carry their denominator; a delta only shows when there's a real prior period. */
export function Stat({ label, value, detail, delta, trend, goal }: { label: string; value: string; detail?: string; delta?: number | null; trend?: number[]; goal?: { done: number; target: number } }) {
  return (
    <div className="glass flex min-w-0 flex-col gap-1 p-5">
      <p className="text-[13.5px] text-body">{label}</p>
      <p className="font-head text-[34px] leading-[1.1] font-medium">{value}</p>
      <p className="min-h-5 text-[13px] text-muted">
        {delta != null && delta !== 0 && <span className={`mr-1.5 font-medium ${delta > 0 ? 'text-good' : 'text-bad'}`}>{delta > 0 ? `+${delta}` : `−${Math.abs(delta)}`}</span>}
        {detail}
      </p>
      {goal && goal.target > 0 ? (
        <div className="mt-2" role="img" aria-label={`${goal.done} of ${goal.target} goal`}>
          <div className="h-2 overflow-hidden rounded-full bg-surface-strong">
            <div className="h-full rounded-full" style={{ background: 'var(--series-1)', width: `${Math.min((goal.done / goal.target) * 100, 100)}%` }} />
          </div>
          <p className="mt-1.5 text-[12.5px] text-muted">
            {goal.done} of {goal.target} goal
          </p>
        </div>
      ) : (
        trend && (
          <div className="mt-1">
            <Sparkline values={trend} label={`${label}, last ${trend.length} weeks: ${trend.join(', ')}`} />
          </div>
        )
      )}
    </div>
  );
}

export function pct(r: Rate): string {
  return r.rate === null ? '—' : `${Math.round(r.rate * 100)}%`;
}

export function Panel({ title, action, children, className = '' }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`glass flex min-w-0 flex-col gap-4 p-5 sm:p-6 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[18px] font-medium">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
