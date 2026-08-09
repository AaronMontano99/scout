import type { HTMLAttributes } from 'react';

// See DESIGN.md "feature-card"/"feature-card-dark" — restrained
// hairline border, rounded-lg (12px), no exaggerated shadow. Depth
// comes from hairlines and hierarchy, not drop shadows — DESIGN.md
// §Depth.

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  dark?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

const PADDING_CLASSES = { sm: 'p-4', md: 'p-5', lg: 'p-6' };

export function Card({ dark = false, padding = 'md', className = '', children, ...props }: CardProps) {
  const surface = dark ? 'bg-surface-dark text-on-dark' : 'bg-surface-card text-ink border border-hairline-strong';
  return (
    <div className={`rounded-lg ${surface} ${PADDING_CLASSES[padding]} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
