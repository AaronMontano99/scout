'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, CalendarDays, ListPlus, Mail, Moon, PhoneCall, Plus, Search, Send, SlidersHorizontal, Sun } from 'lucide-react';
import { useShell } from './shell';
import { readLook, saveLook } from './tweaks';

function watchLook(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-look'] });
  return () => observer.disconnect();
}

const ITEM = 'grid h-11 w-11 place-items-center rounded-full text-body transition-colors hover:bg-surface-strong hover:text-ink';

/** The floating bar from the reference: everything you do from anywhere, one reach away. */
export function Dock() {
  const { open } = useShell();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const light = useSyncExternalStore(watchLook, () => document.documentElement.dataset.look === 'day', () => false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const away = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setMenu(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [menu]);

  const pick = (fn: () => void) => () => {
    setMenu(false);
    fn();
  };

  const toggleTheme = () => {
    saveLook({ ...readLook(), look: light ? undefined : 'day' });
  };

  return (
    <div ref={ref} className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-3">
      <div className="relative">
        {menu && (
          <div role="menu" className="glass-solid rise absolute bottom-[64px] left-1/2 w-[240px] -translate-x-1/2 p-2">
            <MenuItem icon={<Send size={16} />} label="Log a touch" onClick={pick(() => open({ type: 'log' }))} />
            <MenuItem icon={<ListPlus size={16} />} label="New task" onClick={pick(() => open({ type: 'task' }))} />
            <MenuItem icon={<Building2 size={16} />} label="Add an account" onClick={pick(() => open({ type: 'account' }))} />
            <div className="my-1 border-t border-hairline" />
            <MenuItem icon={<PhoneCall size={16} />} label="I'm calling…" onClick={pick(() => router.push('/calls'))} />
            <MenuItem icon={<Mail size={16} />} label="I'm emailing…" onClick={pick(() => router.push('/emails'))} />
          </div>
        )}
        <div className="glass flex items-center gap-0.5 !rounded-full p-1.5" style={{ background: 'color-mix(in srgb, var(--card-solid) 78%, transparent)' }}>
          <button type="button" aria-label="Search (Command K)" title="Search  ⌘K" className={ITEM} onClick={() => open({ type: 'palette' })}>
            <Search size={19} />
          </button>
          <button
            type="button"
            aria-label="New"
            aria-expanded={menu}
            aria-haspopup="menu"
            title="New"
            onClick={() => setMenu(!menu)}
            className="grid h-11 w-11 place-items-center rounded-full bg-primary text-on-primary hover:bg-primary-active"
          >
            <Plus size={21} />
          </button>
          <button type="button" aria-label="Log a touch" title="Log a touch" className={ITEM} onClick={() => open({ type: 'log' })}>
            <Send size={18} />
          </button>
          <Link href="/schedule" aria-label="Schedule" title="Schedule" className={ITEM}>
            <CalendarDays size={19} />
          </Link>
          <span className="mx-1 h-6 w-px bg-hairline-strong" />
          <button type="button" aria-label={light ? 'Switch to dark' : 'Switch to light'} title={light ? 'Dark' : 'Light'} className={ITEM} onClick={toggleTheme}>
            {light ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button type="button" aria-label="Tweak the look" title="Tweak the look" className={ITEM} onClick={() => open({ type: 'tweaks' })}>
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" role="menuitem" onClick={onClick} className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left text-[14px] hover:bg-surface-strong">
      <span className="text-body">{icon}</span>
      {label}
    </button>
  );
}
