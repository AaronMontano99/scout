'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/calls', label: 'Calls' },
  { href: '/emails', label: 'Emails' },
  { href: '/hot-list', label: 'Hot List' },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-10 border-b border-hairline bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-8 px-4 sm:px-6">
        <Link href="/calls" className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9.25" stroke="#171717" strokeWidth="1.5" />
            <path d="M12 4.8 L15.1 12 L12 12 Z" fill="#2F80FF" />
            <path d="M12 4.8 L8.9 12 L12 12 Z" fill="#7FB0FF" />
            <path d="M12 19.2 L15.1 12 L12 12 Z" fill="#3E4146" />
            <path d="M12 19.2 L8.9 12 L12 12 Z" fill="#171717" />
          </svg>
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">Scout</span>
        </Link>
        <nav className="flex h-full items-stretch gap-1">
          {TABS.map((t) => {
            const active = pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center border-b-2 px-3 text-[14px] font-medium transition-colors ${
                  active ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-body'
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/day"
            className={`rounded-md px-3.5 py-1.5 text-[13px] font-medium ${pathname.startsWith('/day') ? 'bg-ink text-canvas' : 'border border-hairline-strong text-ink hover:bg-canvas-soft'}`}
          >
            Day finished
          </Link>
          <Link href="/settings" aria-label="Settings" className={`rounded-md p-1.5 ${pathname.startsWith('/settings') ? 'text-ink' : 'text-muted hover:text-ink'}`}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M10 2.9 v1.6 M10 15.5 v1.6 M17.1 10 h-1.6 M4.5 10 H2.9 M15.02 4.98 l-1.13 1.13 M6.11 13.89 l-1.13 1.13 M15.02 15.02 l-1.13 -1.13 M6.11 6.11 L4.98 4.98"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
