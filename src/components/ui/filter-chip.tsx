'use client';

// Shared pill-filter control — see DESIGN.md "filter-chip". Reused
// across Today/Lists/Accounts/People so filter interaction looks and
// behaves identically everywhere (product spec's "restrained, not
// bespoke per screen" rule).

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
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            value === option.id ? 'bg-ink text-canvas' : 'bg-surface-strong text-body hover:text-ink'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
