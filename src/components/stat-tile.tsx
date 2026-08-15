// See DESIGN.md "stat-tile" — every rate must show its denominator
// directly beneath it. A rate without a visible denominator is the
// "fake Engagement Score" failure mode the product spec forbids.

export function StatTile({
  label,
  value,
  denominatorLabel,
}: {
  label: string;
  value: string;
  denominatorLabel?: string;
}) {
  return (
    <div className="rounded-lg border border-hairline-strong bg-surface-card p-4">
      <div className="font-mono text-[9.5px] tracking-[0.1em] text-muted uppercase">{label}</div>
      <div className="mt-1.5 text-[26px] font-semibold text-ink">{value}</div>
      {denominatorLabel && <div className="mt-0.5 text-[11.5px] text-muted">{denominatorLabel}</div>}
    </div>
  );
}

export function formatRate(rate: { numerator: number; denominator: number; rate: number | null }): {
  value: string;
  denominatorLabel: string;
} {
  return {
    value: rate.rate === null ? '—' : `${Math.round(rate.rate * 100)}%`,
    denominatorLabel: `${rate.numerator} / ${rate.denominator}`,
  };
}
