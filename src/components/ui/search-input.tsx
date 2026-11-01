'use client';

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="flex flex-1 items-center gap-2.5 rounded-full border border-hairline-strong bg-canvas-soft px-4 py-2.5">
      <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="shrink-0 text-muted">
        <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M13.2 13.2 L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-0 bg-transparent text-[13.5px] text-ink placeholder:text-muted focus:outline-none"
      />
    </label>
  );
}
