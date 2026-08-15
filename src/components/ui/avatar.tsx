function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? '').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase();
}

export function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'lg' }) {
  const dims = size === 'sm' ? 'h-[26px] w-[26px] text-[10px]' : 'h-10 w-10 text-[13px]';
  const surface = size === 'sm' ? 'bg-surface-strong text-body' : 'bg-[#EEF6FF] text-text-link';
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${dims} ${surface}`}>
      {initialsOf(name)}
    </span>
  );
}

export function WorkspaceAvatar({ initials }: { initials: string }) {
  return (
    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-strong text-[11px] font-semibold text-ink">
      {initials}
    </span>
  );
}
