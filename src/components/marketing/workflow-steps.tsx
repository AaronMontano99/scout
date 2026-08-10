'use client';

import { useState } from 'react';

// Interactive step list — DESIGN.md's workflow-step-card, extended
// with a real expand/collapse interaction (multiple steps can be open
// at once; nothing auto-expands or auto-plays). Each step has a
// one-line summary always visible plus a detail line revealed on
// click — matches the product's own progressive-disclosure principle
// (PRODUCT_UX.md) applied to the marketing site.

interface Step {
  title: string;
  summary: string;
  detail: string;
}

const STEPS: Step[] = [
  {
    title: 'Bring your list',
    summary: 'Upload Excel or connect your existing system.',
    detail: 'CSV/XLSX today — CRM connections come later without changing how the list works once it exists.',
  },
  {
    title: 'Scout does the homework',
    summary: 'Company websites, recent developments, relevant people, internal sales memory.',
    detail: 'Research runs in the background — accounts become usable as soon as they’re ready, not after the whole list finishes.',
  },
  {
    title: 'Start calling',
    summary: 'Everything important in one concise workspace — no five open tabs.',
    detail: 'About 30 seconds of reading: what they do, what matters, who’s relevant, and what your team already knows.',
  },
  {
    title: 'Record what happened',
    summary: 'One fast post-call workflow, not duplicate data entry.',
    detail: 'Log the outcome, jot a rough note — Scout drafts the clean version, the account update, and the follow-up in one pass.',
  },
  {
    title: 'Scout remembers',
    summary: 'Your organization’s sales memory compounds instead of resetting.',
    detail: 'A departed rep’s notes don’t disappear with them — the next person picks up exactly where the account left off.',
  },
  {
    title: 'Measure the outcome',
    summary: 'Meetings. Selling situations. Opportunities. Real denominators, always.',
    detail: 'Every rate traces back to a real, countable event — never a number invented to look good.',
  },
];

export function WorkflowSteps() {
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());

  function toggle(i: number) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <div className="mx-auto mt-8 grid max-w-5xl gap-4 sm:grid-cols-3">
      {STEPS.map((step, i) => {
        const open = openIds.has(i);
        return (
          <button
            key={step.title}
            onClick={() => toggle(i)}
            aria-expanded={open}
            className="rounded-lg border border-hairline-strong bg-surface-card p-5 text-left transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.15)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-strong font-mono text-xs text-ink">
                {i + 1}
              </div>
              <span className="text-muted transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>
                ⌄
              </span>
            </div>
            <div className="mt-3 text-sm font-semibold text-ink">{step.title}</div>
            <p className="mt-1 text-sm text-body">{step.summary}</p>
            {open && <p className="mt-2 border-t border-hairline pt-2 text-xs text-muted">{step.detail}</p>}
          </button>
        );
      })}
    </div>
  );
}
