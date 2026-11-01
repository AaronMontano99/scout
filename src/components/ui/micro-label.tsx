// The small quiet label above a value or a card section.

export function MicroLabel({
  children,
  className = '',
  color,
}: {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'xs';
  /** Overrides the default muted color, e.g. text-warn for a "no trigger" state. */
  color?: string;
}) {
  return <span className={`text-[12.5px] font-medium ${color ?? 'text-muted'} ${className}`.trim()}>{children}</span>;
}
