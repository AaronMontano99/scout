import Link from 'next/link';
import { RANGES, type RangeKey } from '@/domain/metrics';

export function RangePills({ value, path }: { value: RangeKey; path: string }) {
  return (
    <div className="flex gap-1 rounded-full bg-canvas-soft p-1" role="group" aria-label="Date range">
      {RANGES.map((r) => (
        <Link key={r.key} href={`${path}?range=${r.key}`} aria-current={value === r.key ? 'true' : undefined} className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium ${value === r.key ? 'bg-surface-strong text-ink' : 'text-body hover:text-ink'}`}>
          {r.label}
        </Link>
      ))}
    </div>
  );
}
