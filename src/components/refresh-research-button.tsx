'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { runResearchForAccount } from '@/app/app/research/actions';

/** Real research refresh — fetches the company's public website + public news search (no LinkedIn, no scraping) and saves whatever comes back. See src/services/free-web-research-provider.ts. */
export function RefreshResearchButton({ accountId, variant = 'link' }: { accountId: string; variant?: 'link' | 'button' }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ saved: number; skipped: number } | null>(null);

  const run = () => {
    startTransition(async () => {
      const r = await runResearchForAccount(accountId);
      setResult(r);
      router.refresh();
    });
  };

  const label = isPending ? 'Searching public web + news…' : result ? `Found ${result.saved} new item${result.saved === 1 ? '' : 's'}` : 'Refresh research';

  if (variant === 'button') {
    return (
      <button
        type="button"
        disabled={isPending}
        onClick={run}
        className="rounded-md border border-hairline-strong bg-surface-card px-4 py-2 text-sm font-medium text-ink hover:bg-canvas-soft disabled:opacity-60"
      >
        {label}
      </button>
    );
  }

  return (
    <button type="button" disabled={isPending} onClick={run} className="text-center text-[12.5px] text-text-link hover:underline disabled:opacity-60">
      {label}
    </button>
  );
}
