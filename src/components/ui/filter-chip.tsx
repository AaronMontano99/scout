'use client';

// Pill filter control matching scout-ui.html: 999px radius, 12-12.5px
// font, 1px border, active = ink-filled, inactive = pale-bordered.

export interface FilterChipOption<T extends string> {
  id: T;
  label: string;
}

export function FilterChipGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: FilterChipOption<T>[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          aria-pressed={value === option.id}
          className={`rounded-full border px-3 py-1 text-[12.5px] font-medium whitespace-nowrap transition-colors ${
            value === option.id
              ? 'border-ink bg-ink text-canvas'
              : 'border-hairline-strong bg-canvas text-body hover:text-ink'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
