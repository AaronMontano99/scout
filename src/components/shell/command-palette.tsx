'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, CornerDownLeft, Search } from 'lucide-react';
import { useShell } from './shell';

interface Row {
  id: string;
  label: string;
  hint: string;
  run: () => void;
  account?: boolean;
}

/** ⌘K: jump to any account or do anything, from anywhere. */
export function CommandPalette({ onClose }: { onClose: () => void }) {
  const { accounts, open } = useShell();
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (ref.current && !ref.current.open) ref.current.showModal();
  }, []);

  const go = (path: string) => () => {
    onClose();
    router.push(path);
  };

  const commands: Row[] = [
    { id: 'log', label: 'Log a touch', hint: 'Action', run: () => open({ type: 'log' }) },
    { id: 'task', label: 'New task', hint: 'Action', run: () => open({ type: 'task' }) },
    { id: 'account', label: 'Add an account', hint: 'Action', run: () => open({ type: 'account' }) },
    { id: 'call', label: "I'm calling…", hint: 'Calls', run: go('/calls') },
    { id: 'email', label: "I'm emailing…", hint: 'Emails', run: go('/emails') },
    { id: 'hot', label: 'Hot List', hint: 'Page', run: go('/hot-list') },
    { id: 'schedule', label: 'Schedule', hint: 'Page', run: go('/schedule') },
    { id: 'reports', label: 'Reports', hint: 'Page', run: go('/reports') },
    { id: 'day', label: 'Day finished', hint: 'Page', run: go('/day') },
    { id: 'settings', label: 'Settings', hint: 'Page', run: go('/settings') },
  ];

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchedAccounts: Row[] = accounts
      .filter((a) => !q || `${a.name} ${a.contact}`.toLowerCase().includes(q))
      .slice(0, 6)
      .map((a) => ({ id: a.id, label: a.name, hint: a.contact, account: true, run: go(`/accounts/${a.id}`) }));
    const matchedCommands = commands.filter((c) => !q || c.label.toLowerCase().includes(q));
    return q ? [...matchedAccounts, ...matchedCommands] : [...commands.slice(0, 5), ...matchedAccounts];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, accounts]);

  const pick = rows[Math.min(index, rows.length - 1)];

  return (
    <dialog ref={ref} onClose={onClose} onClick={(e) => e.target === ref.current && onClose()} aria-label="Search" className="glass-solid fixed inset-x-3 top-[12vh] mx-auto mt-0 w-auto max-w-[580px] p-0 text-ink sm:w-full">
      <div className="flex items-center gap-3 border-b border-hairline px-5 py-4">
        <Search size={18} className="text-muted" />
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIndex(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setIndex(Math.min(index + 1, rows.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setIndex(Math.max(index - 1, 0));
            } else if (e.key === 'Enter' && pick) {
              e.preventDefault();
              pick.run();
            }
          }}
          placeholder="Search accounts, or type what you want to do"
          aria-label="Search accounts and actions"
          className="w-full border-0 bg-transparent text-[16px] text-ink placeholder:text-muted focus:outline-none"
        />
      </div>
      <div className="max-h-[52vh] overflow-y-auto p-2">
        {rows.length === 0 && <p className="px-3 py-4 text-[14px] text-body">No match. Use “Add an account” to start one.</p>}
        {rows.map((r, i) => (
          <button
            key={r.id}
            type="button"
            onMouseEnter={() => setIndex(i)}
            onClick={r.run}
            className={`flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left text-[14px] ${i === index ? 'bg-surface-strong' : ''}`}
          >
            {r.account && <Building2 size={15} className="shrink-0 text-muted" />}
            <span className="min-w-0 flex-1 truncate">{r.label}</span>
            <span className="max-w-[45%] truncate text-[13px] text-muted">{r.hint}</span>
            {i === index && <CornerDownLeft size={14} className="shrink-0 text-muted" />}
          </button>
        ))}
      </div>
    </dialog>
  );
}
