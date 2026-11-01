import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';

const FIELD_CLASSES = 'w-full rounded-[14px] border border-hairline-strong bg-canvas-soft px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none';

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${FIELD_CLASSES} ${className}`.trim()} {...props} />;
}

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${FIELD_CLASSES} min-h-24 py-2 ${className}`.trim()} {...props} />;
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${FIELD_CLASSES} ${className}`.trim()} {...props} />;
}
