'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PRODUCT_NAME } from '@/lib/branding';
import type { NavItem } from './mobile-nav';

// Primary /app shell nav — see docs/PRODUCT_UX.md's navigation model:
// Today/Lists/Accounts/People/Research as the daily-work group, then
// Imports/Analytics/Settings as the operational group below a divider.

export function Sidebar({ items, dbPath }: { items: NavItem[]; dbPath: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 flex-col border-r border-hairline bg-canvas px-3 py-4 md:flex">
      <div className="px-2 pb-6 text-sm font-semibold tracking-tight text-ink">{PRODUCT_NAME}</div>
      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          // Exact match for /app itself, prefix match for nested routes
          // so e.g. /app/accounts/[id] still highlights "Accounts".
          const active = item.href === '/app' ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <div key={item.href}>
              {item.dividerBefore && <div className="my-2 border-t border-hairline" />}
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                  active ? 'bg-canvas-soft font-medium text-ink' : 'text-body hover:bg-canvas-soft hover:text-ink'
                }`}
              >
                {item.label}
              </Link>
            </div>
          );
        })}
      </nav>
      <div className="mt-auto px-2 pt-6 text-xs text-muted">
        My Workspace — stored locally
        <div className="mt-1 text-ink">{dbPath}</div>
      </div>
    </aside>
  );
}
