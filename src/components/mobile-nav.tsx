'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Drawer } from './ui/drawer';

// Responsive nav for small screens — product spec §62-63: application
// is desktop-first but must stay usable on smaller screens. Reuses the
// Drawer primitive rather than building a second mobile-nav mechanism.

export function MobileNav({ items }: { items: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md p-2 text-ink hover:bg-canvas-soft md:hidden"
        aria-label="Open navigation"
      >
        <span className="block h-0.5 w-5 bg-ink" />
        <span className="mt-1 block h-0.5 w-5 bg-ink" />
        <span className="mt-1 block h-0.5 w-5 bg-ink" />
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Navigate">
        <nav className="flex flex-col gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm text-body hover:bg-canvas-soft hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Drawer>
    </>
  );
}
