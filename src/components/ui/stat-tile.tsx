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
    <div className="glass p-4">
      <div className="text-[13px] text-body">{label}</div>
      <div className="mt-1.5 font-head text-[30px] font-medium text-ink">{value}</div>
      {denominatorLabel && <div className="mt-0.5 text-[13px] text-muted">{denominatorLabel}</div>}
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
