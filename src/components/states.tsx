// See DESIGN.md "empty-state" / "error-banner" — every empty state
// names the specific next action; never the bare "Nothing here yet 🙂"
// pattern. Every error explains what failed and what to do next.
import Link from 'next/link';

export function EmptyState({
  title,
  body,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  body: string;
  ctaLabel?: string;
  /** When provided, the CTA navigates there instead of rendering as a non-functional button. */
  ctaHref?: string;
}) {
  const cta = ctaLabel && (
    <span className="mt-3 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary">
      {ctaLabel}
    </span>
  );

  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-hairline-strong bg-surface-card px-6 py-12 text-center">
      <div className="text-lg font-semibold text-ink">{title}</div>
      <div className="max-w-sm text-sm text-body">{body}</div>
      {cta && (ctaHref ? <Link href={ctaHref}>{cta}</Link> : cta)}
    </div>
  );
}

export function SourceChip({ url, label }: { url: string; label: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-text-link hover:underline"
    >
      {label} ↗
    </a>
  );
}
