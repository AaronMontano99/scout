'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setItemPinnedAction, setItemWorkedAction } from '@/app/app/actions';

// Real, persisted mutations against target_list_items — see
// src/data/index.ts's setTargetListItemPinned/setTargetListItemWorked.
// Both call router.refresh() after the server action resolves since
// these are invoked directly from a client component, not a <form>.

export function PinToggleButton({ itemId, pinned }: { itemId: string; pinned: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      aria-pressed={pinned}
      title={pinned ? 'Unpin' : 'Pin'}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        startTransition(async () => {
          await setItemPinnedAction(itemId, !pinned);
          router.refresh();
        });
      }}
      className={`text-sm ${pinned ? 'text-ink' : 'text-muted hover:text-ink'} disabled:opacity-50`}
    >
      {pinned ? '📌' : '📍'}
    </button>
  );
}

/** Full-width secondary-style variant for the Account Brief's action column — see docs/PRODUCT_UX.md. Renders disabled with an explanation when the account isn't on any open list item, since there's nothing to mark worked yet. */
export function MarkWorkedButtonBrief({ itemId, worked }: { itemId: string | null; worked: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!itemId) {
    return (
      <button
        type="button"
        disabled
        title="Add this account to a Target List to enable Mark Worked"
        className="w-full rounded-md border border-hairline-strong bg-surface-card px-4 py-[9px] text-[12.5px] font-medium text-muted opacity-60"
      >
        Mark worked
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await setItemWorkedAction(itemId, !worked);
          router.refresh();
        });
      }}
      className={`w-full rounded-md border border-hairline-strong px-4 py-[9px] text-[12.5px] font-medium transition-colors disabled:opacity-50 ${
        worked ? 'bg-surface-strong text-ink' : 'bg-surface-card text-ink hover:bg-canvas-soft'
      }`}
    >
      {isPending ? 'Saving…' : worked ? 'Worked ✓' : 'Mark worked'}
    </button>
  );
}

export function MarkWorkedButton({ itemId, worked }: { itemId: string; worked: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        startTransition(async () => {
          await setItemWorkedAction(itemId, !worked);
          router.refresh();
        });
      }}
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
        worked
          ? 'border border-hairline-strong bg-surface-card text-body hover:bg-canvas-soft'
          : 'bg-primary text-on-primary hover:bg-primary-active'
      }`}
    >
      {isPending ? 'Saving…' : worked ? 'Worked' : 'Mark Worked'}
    </button>
  );
}
