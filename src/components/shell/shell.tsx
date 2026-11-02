'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Alert } from '@/domain/alerts';
import type { TaskKind } from '@/domain/schedule';
import type { ActivityChannel } from '@/domain/day-summary';
import type { QuickOutcome } from '@/domain/quick-log';
import { DEMO } from '@/demo/mode';
import { Nav } from './nav';
import { Dock } from './dock';
import { CommandPalette } from './command-palette';
import { TaskSheet, type TaskDraft } from './task-sheet';
import { LogSheet } from './log-sheet';
import { AccountSheet } from './account-sheet';
import { TweaksSheet } from './tweaks';

export interface AccountOption {
  id: string;
  name: string;
  contact: string;
}

export interface LogDraft {
  company?: string;
  channel?: ActivityChannel;
  outcome?: QuickOutcome;
  contactName?: string;
}

type Panel =
  | { type: 'palette' }
  | { type: 'task'; draft?: TaskDraft }
  | { type: 'log'; draft?: LogDraft }
  | { type: 'account' }
  | { type: 'tweaks' };

interface Toast {
  id: number;
  message: string;
  undo?: () => void;
}

interface ShellApi {
  open: (panel: Panel) => void;
  close: () => void;
  toast: (message: string, undo?: () => void) => void;
  accounts: AccountOption[];
}

const ShellContext = createContext<ShellApi | null>(null);

export function useShell(): ShellApi {
  const api = useContext(ShellContext);
  if (!api) throw new Error('useShell must be used inside <Shell>');
  return api;
}

export type { TaskKind };

export function Shell({ alerts, accounts, ownerName, children }: { alerts: Alert[]; accounts: AccountOption[]; ownerName: string; children: React.ReactNode }) {
  const [panel, setPanel] = useState<Panel | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = useCallback((message: string, undo?: () => void) => {
    clearTimeout(timer.current);
    setToast(DEMO ? { id: Date.now(), message: `${message} (demo, not saved)` } : { id: Date.now(), message, undo });
    timer.current = setTimeout(() => setToast(null), undo && !DEMO ? 7000 : 3500);
  }, []);

  const close = useCallback(() => setPanel(null), []);
  const api = useMemo<ShellApi>(() => ({ open: setPanel, close, toast: showToast, accounts }), [close, showToast, accounts]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPanel({ type: 'palette' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <ShellContext.Provider value={api}>
      {DEMO && (
        <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 bg-primary px-4 py-2 text-center text-[13.5px] text-on-primary">
          <span>Demo with made-up companies. Nothing you do here is saved.</span>
          <a href="https://github.com/AaronMontano99/ferret#build-your-own-ferret" className="font-semibold underline">
            Build your own
          </a>
          <a href="https://aaronmontano.vercel.app/" className="font-semibold underline">
            Back to Aaron&apos;s site
          </a>
        </p>
      )}
      <Nav alerts={alerts} ownerName={ownerName} />
      <main className="mx-auto w-full max-w-[1320px] px-4 pt-6 pb-32 sm:px-6">{children}</main>
      <Dock />

      {panel?.type === 'palette' && <CommandPalette onClose={close} />}
      {panel?.type === 'task' && <TaskSheet draft={panel.draft} onClose={close} />}
      {panel?.type === 'log' && <LogSheet draft={panel.draft} onClose={close} />}
      {panel?.type === 'account' && <AccountSheet onClose={close} />}
      {panel?.type === 'tweaks' && <TweaksSheet onClose={close} />}

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4">
        {toast && (
          <div key={toast.id} className="glass-solid rise pointer-events-auto flex items-center gap-4 !rounded-full py-2.5 pr-3 pl-5 text-[13.5px]">
            <span>{toast.message}</span>
            {toast.undo && (
              <button
                type="button"
                onClick={() => {
                  toast.undo?.();
                  setToast(null);
                }}
                className="rounded-full bg-primary px-3 py-1 text-[13px] font-semibold text-on-primary"
              >
                Undo
              </button>
            )}
          </div>
        )}
      </div>
    </ShellContext.Provider>
  );
}
