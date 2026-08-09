import type { ButtonHTMLAttributes } from 'react';

// See DESIGN.md "Buttons" — pure black pill for primary, hairline-bordered
// white for secondary, inline text-link for tertiary. rounded-md (8px),
// never rounded-full — pill geometry is reserved for badges, never CTAs.

type Variant = 'primary' | 'secondary' | 'tertiary';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-active',
  secondary: 'bg-surface-card text-ink border border-hairline-strong hover:bg-canvas-soft',
  tertiary: 'bg-transparent text-text-link hover:underline',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  const base =
    variant === 'tertiary'
      ? 'text-sm font-medium'
      : 'inline-flex items-center justify-center rounded-md px-[18px] py-[10px] text-sm font-medium transition-colors';
  return (
    <button className={`${base} ${VARIANT_CLASSES[variant]} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
