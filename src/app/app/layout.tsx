import { getCurrentAuthContext } from '@/auth';
import { MobileNav, type NavItem } from '@/components/mobile-nav';
import { Sidebar } from '@/components/sidebar';
import { WorkspaceAvatar } from '@/components/ui/avatar';

// App shell for local-first mode — your own real data, stored in a
// local SQLite file (data/scout.db). See docs/LOCAL_MODE.md. This is
// the counterpart to src/app/demo/layout.tsx's "Demo Mode" shell —
// same layout, different data source, never mixed (see docs/DEMO.md).

const MOBILE_NAV_ITEMS: NavItem[] = [
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
  const { organization, membership } = getCurrentAuthContext();
  const ownerName = 'You';

  return (
    <div className="flex min-h-screen bg-canvas-soft text-[14px]">
      <Sidebar dbPath="data/scout.db" />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-hairline bg-canvas px-6">
          <div className="flex items-center gap-2.5">
            <MobileNav items={MOBILE_NAV_ITEMS} />
            <span className="text-[13.5px] text-body">{organization.name}</span>
            <span className="h-[3px] w-[3px] rounded-full bg-hairline-strong" />
            <span className="text-[13.5px] text-muted">your data, stored locally</span>
          </div>
          <div className="flex items-center gap-3.5">
            <span className="text-[13.5px] text-body">{ownerName}</span>
            <WorkspaceAvatar initials={membership.role === 'OWNER' ? 'Y' : 'U'} />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1240px] flex-1 overflow-auto px-7 py-[26px] pb-10">{children}</main>
      </div>
    </div>
  );
}
