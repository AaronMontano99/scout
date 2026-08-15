// JetBrains Mono uppercase micro-label — used for card section headers,
// table column headers, and metric-tile labels throughout scout-ui.html's
// reference design (9.5-11px, 0.08-0.1em tracking, muted color).

export function MicroLabel({
  children,
  className = '',
  size = 'sm',
  color,
}: {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'xs';
  /** Overrides the default muted color — e.g. text-accent-warning for a "no trigger" state. */
  color?: string;
}) {
  const fontSize = size === 'sm' ? 'text-[9.5px]' : 'text-[10px]';
  return (
    <span className={`font-mono ${fontSize} uppercase tracking-[0.1em] ${color ?? 'text-muted'} ${className}`.trim()}>
      {children}
    </span>
  );
}
