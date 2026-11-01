import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'tertiary';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-active',
  secondary: 'text-ink border border-hairline-strong hover:bg-surface-strong',
  tertiary: 'bg-transparent text-text-link hover:underline',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  const base = variant === 'tertiary' ? 'text-sm font-medium' : 'inline-flex items-center justify-center gap-1.5 rounded-full px-[18px] py-[10px] text-sm font-semibold transition-colors';
  return (
    <button className={`${base} ${VARIANT_CLASSES[variant]} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
