'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Drawer } from './ui/drawer';

// Responsive nav for small screens — product spec §62-63: application
// is desktop-first but must stay usable on smaller screens. Reuses the
// Drawer primitive rather than building a second mobile-nav mechanism.

export interface NavItem {
  href: string;
  label: string;
  dividerBefore?: boolean;
}

export function MobileNav({ items }: { items: NavItem[] }) {
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
            <div key={item.href}>
              {item.dividerBefore && <div className="my-2 border-t border-hairline" />}
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 text-sm text-body hover:bg-canvas-soft hover:text-ink"
              >
                {item.label}
              </Link>
            </div>
          ))}
        </nav>
      </Drawer>
    </>
  );
}
