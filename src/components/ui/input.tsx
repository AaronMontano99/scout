import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';

// See DESIGN.md "text-input" — rounded-md, hairline-strong border,
// height 44px, focus thickens to 2px ink border.

const FIELD_CLASSES =
  'w-full rounded-md border border-hairline-strong bg-surface-card px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-2 focus:border-ink focus:outline-none';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={FIELD_CLASSES} {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${FIELD_CLASSES} min-h-24 py-2`} {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={FIELD_CLASSES} {...props} />;
}
