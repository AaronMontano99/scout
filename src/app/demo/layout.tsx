import Link from 'next/link';
import { PRODUCT_NAME } from '@/lib/branding';
import { DEMO_ORGANIZATION, DEMO_REP } from '@/demo';
import { MobileNav } from '@/components/mobile-nav';

// App shell per DESIGN.md "App Shell" section — nav-rail + topbar,
// denser than the marketing site's editorial pacing. This is Demo Mode
// (docs/DEMO.md) — no auth, entirely fictional data, safe to view
// without any live backend.
//
// Nav items are deliberately limited to routes that actually exist —
// product spec §5 warns against unnecessary nav items; Team/Settings/
// global Accounts/People views aren't built yet (see PHASE_4_COMPLETION_REPORT.md),
// so they don't appear here rather than linking nowhere.

const NAV_ITEMS = [
  { href: '/demo', label: 'Home' },
  { href: '/demo/lists', label: 'My Lists' },
  { href: '/demo/analytics', label: 'Analytics' },
];

export default function DemoLayout({ children }: { children: React.ReactNode }) {
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
          Demo Mode — fictional data
          <div className="mt-1 text-ink">{DEMO_REP.fullName}</div>
        </div>
      </aside>
      <div className="flex-1 bg-canvas-soft">
        <header className="flex h-14 items-center justify-between border-b border-hairline bg-canvas px-4 md:px-6">
          <div className="flex items-center gap-3">
            <MobileNav items={NAV_ITEMS} />
            <span className="text-sm text-body">
              {DEMO_ORGANIZATION.name} — <span className="text-muted">Demo Workspace (fictional data)</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-body sm:inline">{DEMO_REP.fullName}</span>
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-strong text-xs font-semibold text-ink"
              title={DEMO_REP.fullName}
            >
              {DEMO_REP.fullName
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">{children}</main>
      </div>
    </div>
  );
}
