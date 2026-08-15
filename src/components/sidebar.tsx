'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PRODUCT_NAME } from '@/lib/branding';

// Primary /app shell nav — matches scout-ui.html's sidebar precisely:
// 224px width, compass logo, 17px stroke icons, 8px/10px nav padding,
// a divider before the operational group, and a LOCAL MODE indicator
// at the bottom instead of a fake connection status.

interface NavEntry {
  href: string;
  label: string;
  icon: React.ReactNode;
  dividerBefore?: boolean;
}

const ICON_PROPS = { width: 17, height: 17, viewBox: '0 0 20 20', fill: 'none', 'aria-hidden': true } as const;

const NAV_ENTRIES: NavEntry[] = [
  {
    href: '/app',
    label: 'Today',
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="10" cy="10" r="6.75" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 5.8 L11.9 10 L10 10 Z" fill="currentColor" />
        <circle cx="10" cy="10" r="1.15" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: '/app/lists',
    label: 'Lists',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M7 5.5 H16.5 M7 10 H16.5 M7 14.5 H16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="3.9" cy="5.5" r="1.1" fill="currentColor" />
        <circle cx="3.9" cy="10" r="1.1" fill="currentColor" />
        <circle cx="3.9" cy="14.5" r="1.1" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: '/app/accounts',
    label: 'Accounts',
    icon: (
      <svg {...ICON_PROPS}>
        <path
          d="M3.75 16.5 V5 a0.5 0.5 0 0 1 0.5 -0.5 H11 a0.5 0.5 0 0 1 0.5 0.5 V16.5 M11.5 8.5 H15.75 a0.5 0.5 0 0 1 0.5 0.5 V16.5 M2.5 16.5 H17.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M6 7.75 H9 M6 10.75 H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/app/people',
    label: 'People',
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="8.6" cy="7.4" r="2.9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3.4 16.2 c0 -2.7 2.3 -4.4 5.2 -4.4 s5.2 1.7 5.2 4.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M14.2 6.1 a2.4 2.4 0 0 1 0 4.6 M15.6 12.4 c1.4 0.6 2.3 1.8 2.3 3.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/app/research',
    label: 'Research',
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M13.2 13.2 L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M9 6.2 L10.4 9 L9 9 Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: '/app/imports',
    label: 'Imports',
    dividerBefore: true,
    icon: (
      <svg {...ICON_PROPS}>
        <path
          d="M5 2.8 h6 l4 4 V17.2 a0.5 0.5 0 0 1 -0.5 0.5 H5 a0.5 0.5 0 0 1 -0.5 -0.5 V3.3 a0.5 0.5 0 0 1 0.5 -0.5 Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M11 2.8 V7 h4 M7.5 12.5 V9 M7.5 9 L5.7 10.8 M7.5 9 L9.3 10.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/app/analytics',
    label: 'Analytics',
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M3.5 16.5 H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M6 13.5 V9.5 M10 13.5 V5.5 M14 13.5 V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/app/settings',
    label: 'Settings',
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M10 2.9 v1.6 M10 15.5 v1.6 M17.1 10 h-1.6 M4.5 10 H2.9 M15.02 4.98 l-1.13 1.13 M6.11 13.89 l-1.13 1.13 M15.02 15.02 l-1.13 -1.13 M6.11 6.11 L4.98 4.98"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export function Sidebar({ dbPath }: { dbPath: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 flex-col border-r border-hairline bg-canvas px-3 py-[18px] md:flex">
      <div className="flex items-center gap-2 px-2 pb-[22px]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9.25" stroke="#171717" strokeWidth="1.5" />
          <path d="M12 4.8 L15.1 12 L12 12 Z" fill="#2F80FF" />
          <path d="M12 4.8 L8.9 12 L12 12 Z" fill="#7FB0FF" />
          <path d="M12 19.2 L15.1 12 L12 12 Z" fill="#3E4146" />
          <path d="M12 19.2 L8.9 12 L12 12 Z" fill="#171717" />
        </svg>
        <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{PRODUCT_NAME}</span>
      </div>

      <nav className="flex flex-col gap-0.5">
        {NAV_ENTRIES.map((item) => {
          const active = item.href === '/app' ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <div key={item.href}>
              {item.dividerBefore && <div className="mx-2.5 my-3 h-px bg-hairline" />}
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13.5px] font-medium transition-colors ${
                  active ? 'bg-[#EEF6FF] text-[#2F80FF]' : 'text-body hover:bg-canvas-soft hover:text-ink'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="mt-auto px-2.5">
        <div className="mb-3 h-px bg-hairline" />
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-semantic-success" />
          <span className="font-mono text-[10px] tracking-[0.1em] text-body">LOCAL MODE</span>
        </div>
        <div className="mt-1 font-mono text-[10px] text-[#B8BDC4]">{dbPath}</div>
      </div>
    </aside>
  );
}
