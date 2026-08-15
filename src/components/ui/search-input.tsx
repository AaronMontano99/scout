'use client';

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="search"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-hairline-strong bg-surface-card px-3 py-1.5 text-sm text-ink placeholder:text-muted focus:border-2 focus:border-ink focus:outline-none"
    />
  );
}
