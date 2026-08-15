'use client';

// Bordered icon+input search box matching scout-ui.html — not a bare
// native <input type=search>.

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
    <div className="flex flex-1 items-center gap-2 rounded-md border border-hairline-strong bg-canvas px-3 py-2">
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="shrink-0">
        <circle cx="9" cy="9" r="5.5" stroke="#92979E" strokeWidth="1.5" />
        <path d="M13.2 13.2 L17 17" stroke="#92979E" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-0 bg-transparent text-[12.5px] text-ink placeholder:text-muted focus:outline-none"
      />
    </div>
  );
}
