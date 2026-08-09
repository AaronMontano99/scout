'use client';

import { useState } from 'react';

// See DESIGN.md "disclosure-toggle" — collapsed by default, always.
// Too much reading is a product failure (product spec §22) — deep
// research/Account Brain detail is opt-in, never the default view.

export function Disclosure({
  label,
  expandedLabel,
  children,
}: {
  label: string;
  expandedLabel: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm font-medium text-text-link hover:underline"
      >
        {open ? expandedLabel : label}
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  );
}
