'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Flag } from 'lucide-react';
import type { Alert } from '@/domain/alerts';

const TABS = [
  { href: '/', label: 'Overview' },
  { href: '/calls', label: 'Calls' },
  { href: '/emails', label: 'Emails' },
  { href: '/hot-list', label: 'Hot List' },
  { href: '/accounts', label: 'Accounts' },
  { href: '/schedule', label: 'Schedule' },
  { href: '/reports', label: 'Reports' },
];

function Logo() {
  return (
    <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-primary text-on-primary">
      <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="5.6" cy="7.4" r="2.9" fill="currentColor" />
        <circle cx="18.4" cy="7.4" r="2.9" fill="currentColor" />
        <path d="M12 4.6c5.2 0 8.6 3.9 8.6 8.2 0 2.4-3.6 7.2-8.6 7.2s-8.6-4.8-8.6-7.2c0-4.3 3.4-8.2 8.6-8.2Z" fill="currentColor" />
        <path d="M3.9 11.4c2.4-1.8 4.6-1.9 6.2-.6.7.6 1.3 1.1 1.9 1.1s1.2-.5 1.9-1.1c1.6-1.3 3.8-1.2 6.2.6-.4 2.6-3 3.4-5.1 2.9-1.2-.3-2.2-.7-3-.7s-1.8.4-3 .7c-2.1.5-4.7-.3-5.1-2.9Z" fill="var(--accent)" />
        <circle cx="8.1" cy="12.3" r="1.25" fill="currentColor" />
        <circle cx="15.9" cy="12.3" r="1.25" fill="currentColor" />
        <path d="M10.3 15.2h3.4L12 17.3Z" fill="var(--accent)" />
      </svg>
    </span>
  );
}

const TONE_DOT: Record<Alert['tone'], string> = { urgent: 'bg-bad', attention: 'bg-warn', info: 'bg-muted' };

function Alerts({ alerts }: { alerts: Alert[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={alerts.length ? `${alerts.length} things need attention` : 'Nothing needs attention'}
        className="relative grid h-10 w-10 place-items-center rounded-full border border-hairline-strong hover:bg-surface-strong"
      >
        <Bell size={17} />
        {alerts.length > 0 && <span className="absolute -top-1 -right-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-bad px-1 text-[12px] leading-none font-semibold text-canvas">{alerts.length}</span>}
      </button>
      {open && (
        <div className="glass-solid rise absolute right-0 z-30 mt-2 w-[340px] max-w-[calc(100vw-32px)] p-2">
          <p className="px-3 pt-2 pb-1.5 text-[14px] font-medium">What needs you</p>
          {alerts.length === 0 && <p className="px-3 pb-3 text-[13.5px] text-body">All clear. Nothing overdue and no threads waiting on you.</p>}
          {alerts.map((a) => (
            <Link key={a.id} href={a.href} onClick={() => setOpen(false)} className="flex items-start gap-3 rounded-[14px] px-3 py-2.5 hover:bg-surface-strong">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TONE_DOT[a.tone]}`} />
              <span className="min-w-0">
                <span className="block truncate text-[13.5px] font-medium">{a.title}</span>
                <span className="block text-[13px] text-body">{a.detail}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function Nav({ alerts, ownerName }: { alerts: Alert[]; ownerName: string }) {
  const pathname = usePathname();
  const initial = (ownerName.trim()[0] ?? 'S').toUpperCase();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-20 border-b border-hairline" style={{ background: 'color-mix(in srgb, var(--canvas) 72%, transparent)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }}>
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Ferret overview">
          <Logo />
          <span className="font-head text-[19px] font-medium">Ferret</span>
        </Link>

        <nav aria-label="Main" className="scroll-x order-3 -mx-4 flex w-[calc(100%+32px)] items-center gap-1 overflow-x-auto px-4 lg:order-none lg:mx-0 lg:w-auto lg:px-0">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              aria-current={isActive(t.href) ? 'page' : undefined}
              className={`shrink-0 rounded-full px-4 py-2 text-[14px] font-medium transition-colors ${isActive(t.href) ? 'bg-surface-strong text-ink' : 'text-body hover:text-ink'}`}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/day"
            className={`hidden items-center gap-2 rounded-full px-4 py-2 text-[13.5px] font-medium sm:flex ${pathname.startsWith('/day') ? 'bg-primary text-on-primary' : 'border border-hairline-strong hover:bg-surface-strong'}`}
          >
            <Flag size={15} />
            Day finished
          </Link>
          <Alerts alerts={alerts} />
          <Link href="/settings" aria-label="Settings" className="grid h-10 w-10 place-items-center rounded-full bg-surface-strong font-head text-[15px] font-medium hover:bg-primary hover:text-on-primary">
            {initial}
          </Link>
        </div>
      </div>
    </header>
  );
}
