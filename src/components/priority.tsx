import type { PriorityLabel } from '@/types/product';

// See DESIGN.md "priority-label" — text-only tier, never a fake-precise
// numeric score. The dot is a glance-level signal; the label is the
// actual information.

const PRIORITY_CONFIG: Record<PriorityLabel, { label: string; dot: string }> = {
  strong_context: { label: 'Strong Context', dot: 'bg-semantic-success' },
  useful_context: { label: 'Useful Context', dot: 'bg-text-link' },
  limited_data: { label: 'Limited Data', dot: 'bg-muted' },
  lower_confidence: { label: 'Lower Confidence', dot: 'bg-accent-warning' },
};

export function PriorityLabelChip({ priority }: { priority: PriorityLabel }) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12.5px] text-body">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export function FreshnessChip({ label }: { label: string }) {
  return <span className="text-[11.5px] text-[#B8BDC4]">{label}</span>;
}
