'use client';

import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { HeatCell, Rate, SeriesPoint } from '@/domain/metrics';
import { HEAT_DAYS, HEAT_HOURS } from '@/domain/metrics';

export const CHANNELS = [
  { key: 'calls', label: 'Calls', color: 'var(--series-1)' },
  { key: 'emails', label: 'Emails', color: 'var(--series-2)' },
  { key: 'walkIns', label: 'Walk-ins', color: 'var(--series-3)' },
  { key: 'linkedin', label: 'LinkedIn', color: 'var(--series-4)' },
] as const;

const AXIS = { fontSize: 12.5, fill: 'var(--text-3)' };

function TooltipCard({ title, rows }: { title: string; rows: { label: string; value: string; color?: string }[] }) {
  return (
    <div className="glass-solid !rounded-[14px] px-3.5 py-2.5 text-[13px]">
      <p className="mb-1 font-medium text-ink">{title}</p>
      {rows.map((r) => (
        <p key={r.label} className="flex items-center justify-between gap-6 text-body">
          <span className="flex items-center gap-2">
            {r.color && <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />}
            {r.label}
          </span>
          <span className="font-medium text-ink">{r.value}</span>
        </p>
      ))}
    </div>
  );
}

export function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-body">
      {CHANNELS.map((c) => (
        <li key={c.key} className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
          {c.label}
        </li>
      ))}
    </ul>
  );
}

/** Touches per week by channel. Stacked because the total is the point and the mix is the detail. */
export function ActivityChart({ data, height = 240 }: { data: SeriesPoint[]; height?: number }) {
  const summary = `Touches per week. ${data.map((d) => `${d.label}: ${d.touches}`).join(', ')}.`;
  return (
    <div role="img" aria-label={summary} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: -24 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke="var(--line-soft)" />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} width={48} />
          <Tooltip
            cursor={{ fill: 'var(--line-soft)' }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0]!.payload as SeriesPoint;
              return (
                <TooltipCard
                  title={`Week of ${label}`}
                  rows={[
                    ...CHANNELS.filter((c) => p[c.key] > 0).map((c) => ({ label: c.label, value: String(p[c.key]), color: c.color })),
                    { label: 'Total', value: String(p.touches) },
                    ...(p.meetings ? [{ label: 'Meetings', value: String(p.meetings) }] : []),
                  ]}
                />
              );
            }}
          />
          {CHANNELS.map((c, i) => (
            <Bar key={c.key} dataKey={c.key} stackId="touches" fill={c.color} stroke="var(--canvas)" strokeWidth={1} isAnimationActive={false} radius={i === CHANNELS.length - 1 ? [5, 5, 0, 0] : 0} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ConnectRateChart({ data, average }: { data: SeriesPoint[]; average: number | null }) {
  const points = data.map((d) => ({ ...d, pct: d.connectRate === null ? null : Math.round(d.connectRate * 100) }));
  return (
    <div role="img" aria-label={`Connect rate by week. ${points.filter((p) => p.pct !== null).map((p) => `${p.label}: ${p.pct}%`).join(', ') || 'No dials in this range.'}`} className="h-[210px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--line-soft)" />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} tick={AXIS} tickLine={false} axisLine={false} width={52} />
          {average !== null && <ReferenceLine y={Math.round(average * 100)} stroke="var(--text-3)" strokeDasharray="4 4" />}
          <Tooltip
            cursor={{ stroke: 'var(--line)' }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0]!.payload as SeriesPoint & { pct: number | null };
              return <TooltipCard title={`Week of ${label}`} rows={[{ label: 'Connect rate', value: p.pct === null ? 'No dials' : `${p.pct}%` }, { label: 'Connects / dials', value: `${p.connects} / ${p.dials}` }]} />;
            }}
          />
          <Line type="linear" dataKey="pct" stroke="var(--series-1)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--series-1)', stroke: 'var(--canvas)', strokeWidth: 2 }} activeDot={{ r: 5 }} connectNulls isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Sparkline({ values, label }: { values: number[]; label: string }) {
  const max = Math.max(...values, 1);
  const w = 100;
  const h = 32;
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(h - 3 - (v / max) * (h - 6)).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label={label} className="h-8 w-full">
      <polyline points={pts} fill="none" stroke="var(--series-1)" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function Ring({ value, label, size = 76 }: { value: number; label: string; size?: number }) {
  const r = (size - 9) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(Math.max(value, 0), 1);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={7} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent-ink)" strokeWidth={7} strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fill="var(--text)" fontSize={size * 0.24} fontWeight={600}>
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

export interface FunnelStep {
  label: string;
  value: number;
  /** Conversion from the step above. */
  rate: Rate | null;
}

/** Bars with the step-to-step rate beside each, so the leak is the first thing you see. */
export function Funnel({ steps }: { steps: FunnelStep[] }) {
  const top = Math.max(steps[0]?.value ?? 0, 1);
  return (
    <ol className="flex flex-col gap-2.5">
      {steps.map((s) => (
        <li key={s.label} className="grid grid-cols-[minmax(92px,120px)_minmax(0,1fr)_44px] items-center gap-3 text-[13.5px]">
          <span className="text-body">{s.label}</span>
          <span className="h-3 overflow-hidden rounded-full bg-surface-strong">
            <span className="block h-full rounded-full" style={{ background: 'var(--series-1)', width: `${s.value === 0 ? 0 : Math.max((s.value / top) * 100, 3)}%` }} />
          </span>
          <span className="text-right font-medium">{s.value}</span>
          {s.rate && s.rate.denominator > 0 && (
            <span className="col-start-2 col-end-4 -mt-1.5 text-[12.5px] text-muted">
              {Math.round((s.rate.rate ?? 0) * 100)}% of the step above ({s.rate.numerator} of {s.rate.denominator})
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

function hourLabel(h: number): string {
  return `${h % 12 || 12}${h < 12 ? 'a' : 'p'}`;
}

/** When dials connect. Darker means more connects; the table of numbers sits on hover and in the title of each cell. */
export function CallHeatmap({ cells }: { cells: HeatCell[] }) {
  const [hover, setHover] = useState<HeatCell | null>(null);
  const max = Math.max(...cells.map((c) => c.connects), 1);
  const best = [...cells].filter((c) => c.dials >= 3).sort((a, b) => b.connects / b.dials - a.connects / a.dials)[0];

  return (
    <div>
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[440px] table-fixed border-separate border-spacing-1 text-[12.5px] text-muted">
          <caption className="sr-only">Connects by weekday and hour</caption>
          <thead>
            <tr>
              <th className="w-10" />
              {HEAT_HOURS.map((h) => (
                <th key={h} scope="col" className="font-normal">
                  {h % 2 === 1 ? hourLabel(h) : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HEAT_DAYS.map((day, d) => (
              <tr key={day}>
                <th scope="row" className="pr-1 text-left font-normal">
                  {day}
                </th>
                {HEAT_HOURS.map((hour) => {
                  const c = cells.find((x) => x.day === d && x.hour === hour)!;
                  const shade = c.dials === 0 ? 0 : 0.12 + (c.connects / max) * 0.88;
                  return (
                    <td
                      key={hour}
                      title={`${day} ${hourLabel(hour)}: ${c.connects} connects on ${c.dials} dials`}
                      onMouseEnter={() => setHover(c)}
                      onMouseLeave={() => setHover(null)}
                      className="h-7 rounded-[6px]"
                      style={{ background: c.dials === 0 ? 'var(--line-soft)' : `color-mix(in srgb, var(--series-1) ${Math.round(shade * 100)}%, transparent)` }}
                    >
                      <span className="sr-only">
                        {c.connects} of {c.dials}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 min-h-5 text-[13px] text-body">
        {hover
          ? `${HEAT_DAYS[hover.day]} ${hourLabel(hover.hour)}: ${hover.connects} connects on ${hover.dials} dials`
          : best
            ? `Best window so far: ${HEAT_DAYS[best.day]} ${hourLabel(best.hour)} (${best.connects} of ${best.dials} connected)`
            : 'Needs at least 3 dials in one hour before it can name a best window.'}
      </p>
    </div>
  );
}
