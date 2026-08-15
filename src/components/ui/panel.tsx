import type { HTMLAttributes } from 'react';

// Card surface matching scout-ui.html's reference cards precisely:
// white, 1px hairline-strong border, 12px radius, no heavy shadow.
// Distinct from ui/card.tsx (used by the marketing site) so /app's
// visual tightening never touches marketing surfaces.

export function Panel({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-lg border border-hairline-strong bg-surface-card ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

/** A Panel's header row — used above a grid table or a list of rows. */
export function PanelHeader({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`border-b border-hairline px-4 py-3 ${className}`.trim()}>{children}</div>
  );
}
