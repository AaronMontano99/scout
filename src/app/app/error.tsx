'use client';

// Real error boundary for /app — explains what failed and what to do,
// never a generic "Something went wrong." See docs/PRODUCT_UX.md's
// error-state rules.

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-hairline-strong bg-surface-card px-6 py-16 text-center">
      <div className="text-lg font-semibold text-ink">Something failed while loading this page</div>
      <p className="max-w-md text-sm text-body">
        {error.message || 'An unexpected error occurred talking to the local database.'}
      </p>
      {error.digest && <p className="font-mono text-xs text-muted">Error ref: {error.digest}</p>}
      <button
        type="button"
        onClick={reset}
        className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary"
      >
        Try Again
      </button>
    </div>
  );
}
