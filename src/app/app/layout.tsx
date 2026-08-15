import { getCurrentAuthContext } from '@/auth';
import { MobileNav, type NavItem } from '@/components/mobile-nav';
import { Sidebar } from '@/components/sidebar';
import Link from 'next/link';

// App shell for local-first mode — your own real data, stored in a
// local SQLite file (data/scout.db). See docs/LOCAL_MODE.md. This is
// the counterpart to src/app/demo/layout.tsx's "Demo Mode" shell —
// same layout, different data source, never mixed (see docs/DEMO.md).

const NAV_ITEMS: NavItem[] = [
  { href: '/app', label: 'Today' },
  { href: '/app/lists', label: 'Lists' },
  { href: '/app/accounts', label: 'Accounts' },
  { href: '/app/people', label: 'People' },
  { href: '/app/research', label: 'Research' },
  { href: '/app/imports', label: 'Imports', dividerBefore: true },
  { href: '/app/analytics', label: 'Analytics' },
  { href: '/app/settings', label: 'Settings' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { organization } = getCurrentAuthContext();

  return (
    <div className="flex min-h-screen">
      <Sidebar items={NAV_ITEMS} dbPath="data/scout.db" />
      <div className="flex-1 bg-canvas-soft">
        <header className="flex h-14 items-center justify-between border-b border-hairline bg-canvas px-4 md:px-6">
          <div className="flex items-center gap-3">
            <MobileNav items={NAV_ITEMS} />
            <span className="text-sm text-body">
              {organization.name} — <span className="text-muted">your real data, local only</span>
            </span>
          </div>
          <Link
            href="/app/accounts/new"
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-on-primary"
          >
            + Add Account
          </Link>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">{children}</main>
      </div>
    </div>
  );
}
