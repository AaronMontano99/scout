import Link from 'next/link';
import { PRODUCT_NAME } from '@/lib/branding';
import { getCurrentAuthContext } from '@/auth';
import { MobileNav } from '@/components/mobile-nav';

// App shell for local-first mode — your own real data, stored in a
// local SQLite file (data/scout.db). See docs/LOCAL_MODE.md. This is
// the counterpart to src/app/demo/layout.tsx's "Demo Mode" shell —
// same layout, different data source, never mixed (see docs/DEMO.md).

const NAV_ITEMS = [
  { href: '/app', label: 'Home' },
  { href: '/app/lists', label: 'My Lists' },
  { href: '/app/analytics', label: 'Analytics' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { organization } = getCurrentAuthContext();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-56 flex-col border-r border-hairline bg-canvas px-3 py-4 md:flex">
        <div className="px-2 pb-6 text-sm font-semibold tracking-tight text-ink">{PRODUCT_NAME}</div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-body hover:bg-canvas-soft hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto px-2 pt-6 text-xs text-muted">
          My Workspace — stored locally
          <div className="mt-1 text-ink">data/scout.db</div>
        </div>
      </aside>
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
        <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">{children}</main>
      </div>
    </div>
  );
}
