import Link from 'next/link';

// First-run experience for an empty /app workspace — product spec's
// "FIRST RUN" section. Only the first two paths touch real local data;
// "Explore demo data" routes to /demo and never seeds /app with
// fixtures (see docs/DEMO.md).

const PATHS = [
  {
    n: '01',
    title: 'Import a list',
    body: 'Upload a CSV or spreadsheet of accounts and contacts you already have.',
    cta: 'Go to Imports',
    href: '/app/imports',
  },
  {
    n: '02',
    title: 'Add an account',
    body: 'Enter a single account by hand to start building real account memory.',
    cta: 'Add Account',
    href: '/app/accounts/new',
  },
  {
    n: '03',
    title: 'Explore demo data',
    body: 'See Scout working against a fictional workspace before you bring in your own data.',
    cta: 'Open Demo',
    href: '/demo',
  },
];

export function FirstRun() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Nothing here yet</h1>
        <p className="mt-1 text-sm text-body">This workspace has no accounts yet. Pick a place to start.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {PATHS.map((path) => (
          <Link
            key={path.n}
            href={path.href}
            className="flex flex-col gap-2 rounded-lg border border-hairline-strong bg-surface-card p-5 hover:bg-canvas-soft"
          >
            <span className="font-mono text-xs text-muted">{path.n}</span>
            <span className="text-sm font-semibold text-ink">{path.title}</span>
            <span className="text-xs text-body">{path.body}</span>
            <span className="mt-2 text-xs font-medium text-text-link">{path.cta} →</span>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
        <span>Your data stays local — nothing leaves this machine.</span>
        <span>No provider required to get started.</span>
        <span>Nothing is invented — Scout only ever shows what you put in.</span>
      </div>
    </div>
  );
}
