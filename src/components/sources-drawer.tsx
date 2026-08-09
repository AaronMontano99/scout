'use client';

import { useState } from 'react';
import { Drawer } from './ui/drawer';
import { SourceChip } from './states';
import type { ResearchFinding } from '@/types/product';

// See DESIGN.md/CALL_READY_BRIEF.md §Sources — "why does Scout believe
// this" with minimal effort, without letting raw URLs dominate the
// brief. Inline SourceChips already exist next to individual claims;
// this drawer is the "see everything at once" complement, reached by
// one small trigger rather than crowding the main brief.

export function SourcesDrawerTrigger({ findings }: { findings: ResearchFinding[] }) {
  const [open, setOpen] = useState(false);
  if (findings.length === 0) return null;

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-xs text-text-link hover:underline">
        Sources ({findings.length})
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title={`Sources (${findings.length})`}>
        <ul className="flex flex-col gap-4">
          {findings.map((f) => (
            <li key={f.id} className="text-sm">
              <div className="font-medium text-ink">{f.sourceName}</div>
              <p className="mt-0.5 text-body">{f.content}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                <span>retrieved {new Date(f.retrievedAt).toLocaleDateString()}</span>
                {f.relevantDate && <span>· event {new Date(f.relevantDate).toLocaleDateString()}</span>}
              </div>
              {f.url && <SourceChip url={f.url} label="Open source" />}
            </li>
          ))}
        </ul>
      </Drawer>
    </>
  );
}
