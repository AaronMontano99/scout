// See DESIGN.md — premium skeletons, not endless spinners (product
// spec §42). A single subtle pulse, sized to the content it stands in
// for, so loading states don't visually jump when real content arrives.

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-surface-strong ${className}`} />;
}

export function SkeletonText({ lines = 1 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}
