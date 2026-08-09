'use client';

import { useState } from 'react';

// See DESIGN.md — used for Account Brain's Overview/People/Memory/
// Activity/Research grouping (ACCOUNT_BRAIN.md). Underline-style
// active indicator, no pill/box tabs — matches the compact, editorial
// in-app language rather than a generic dashboard-template tab bar.

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

export function Tabs({ items, defaultTabId }: { items: TabItem[]; defaultTabId?: string }) {
  const [activeId, setActiveId] = useState(defaultTabId ?? items[0]?.id);
  const active = items.find((i) => i.id === activeId) ?? items[0];

  return (
    <div>
      <div role="tablist" className="flex gap-6 border-b border-hairline">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveId(item.id)}
              className={`-mb-px border-b-2 pb-2 text-sm font-medium transition-colors ${
                isActive ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-body'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" className="pt-4">
        {active?.content}
      </div>
    </div>
  );
}
