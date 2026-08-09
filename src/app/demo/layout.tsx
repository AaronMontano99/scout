import Link from 'next/link';
import { PRODUCT_NAME } from '@/lib/branding';
import { DEMO_REP } from '@/demo';

// App shell per DESIGN.md "App Shell" section — nav-rail + topbar,
// denser than the marketing site's editorial pacing. This is Demo Mode
// (docs/DEMO.md) — no auth, entirely fictional data, safe to view
// without any live backend.

const NAV_ITEMS = [
  { href: '/demo', label: 'Home' },
  { href: '/demo/lists', label: 'My Lists' },
];

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col border-r border-hairline bg-canvas px-3 py-4">
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
        <header className="flex h-14 items-center border-b border-hairline bg-canvas px-6">
          <span className="text-sm text-body">Bay Sentinel Security — Demo Workspace</span>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
