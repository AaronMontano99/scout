'use client';

import { useEffect, useRef } from 'react';

// See DESIGN.md — used for the evidence/source panel (CALL_READY_BRIEF.md
// §Sources) and any contextual detail that shouldn't force a full page
// navigation. Built on the native <dialog> element for free focus-trap
// and Escape-to-close behavior — no dialog library dependency needed
// for something this contained (ARCHITECTURE.md's simplicity principle).

export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="m-0 ml-auto h-full max-h-none w-full max-w-md border-l border-hairline bg-canvas p-0 backdrop:bg-ink/20"
    >
      <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <button onClick={onClose} aria-label="Close" className="text-sm text-muted hover:text-ink">
          Close
        </button>
      </div>
      <div className="overflow-y-auto p-5">{children}</div>
    </dialog>
  );
}
