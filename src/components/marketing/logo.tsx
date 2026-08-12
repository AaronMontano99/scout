import { PRODUCT_NAME } from '@/lib/branding';

// Sparkle / north-star mark + serif wordmark — see DESIGN.md AMENDMENT
// 2026-08-12. Replaces the old compass-ring + diamond mark. Static SVG,
// no gradient/glow/animation per DESIGN.md §3's "the logo is a
// signature, not a decorative object" rule.

export function ScoutLogo({
  className = '',
  markClassName = '',
  wordmarkClassName = '',
}: {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <SparkleMark className={markClassName} />
      <span
        className={`font-display text-ink text-[19px] font-medium tracking-tight ${wordmarkClassName}`}
      >
        {PRODUCT_NAME}
      </span>
    </span>
  );
}

export function SparkleMark({ className = '' }: { className?: string }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M12 1.5 14 9.9 22.5 12 14 14.1 12 22.5 10 14.1 1.5 12 10 9.9Z"
        fill="var(--color-brand-purple)"
      />
    </svg>
  );
}
