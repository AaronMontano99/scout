'use client';

import { useState } from 'react';
import { Sheet } from './sheet';

export interface Look {
  look?: string;
  accent?: string;
  head?: string;
  art?: string;
  blur?: number;
}

const KEY = 'scout-look';

export function readLook(): Look {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Look;
  } catch {
    return {};
  }
}

export function saveLook(look: Look): void {
  const d = document.documentElement;
  for (const [attr, value] of [['look', look.look], ['accent', look.accent], ['head', look.head], ['art', look.art]] as const) {
    if (value) d.dataset[attr] = value;
    else delete d.dataset[attr];
  }
  if (look.blur) d.style.setProperty('--blur', `${look.blur}px`);
  else d.style.removeProperty('--blur');
  try {
    localStorage.setItem(KEY, JSON.stringify(look));
  } catch {
    // Private window: the look still applies until the page reloads.
  }
}

const LOOKS = [
  { id: '', label: 'Night', hint: 'Dark with a warm olive tint' },
  { id: 'graphite', label: 'Graphite', hint: 'Dark neutral gray' },
  { id: 'day', label: 'Cream', hint: 'Light beige, for daytime' },
];
const BACKDROPS = [
  { id: '', label: 'Dot grid', hint: 'Faint dots that fade out' },
  { id: 'none', label: 'Plain', hint: 'Nothing at all' },
  { id: 'penguins', label: 'Surf penguins', hint: 'Penguins on surfboards and friends' },
];
const ACCENTS = [
  { id: '', label: 'Olive' },
  { id: 'blue', label: 'Blue' },
  { id: 'amber', label: 'Amber' },
  { id: 'lime', label: 'Lime' },
];
const HEADS = [
  { id: '', label: 'Outfit' },
  { id: 'sora', label: 'Sora' },
  { id: 'bricolage', label: 'Bricolage' },
];

function Group({ label, options, value, onPick }: { label: string; options: { id: string; label: string; hint?: string }[]; value: string; onPick: (id: string) => void }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-[13px] font-medium text-body">{label}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button key={o.label} type="button" title={o.hint} aria-pressed={value === o.id} onClick={() => onPick(o.id)} className={`rounded-full px-4 py-2 text-[13.5px] font-medium ${value === o.id ? 'bg-primary text-on-primary' : 'bg-surface-strong text-body hover:text-ink'}`}>
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** See it, don't imagine it: every call on the look, live, saved in this browser. */
export function TweaksSheet({ onClose }: { onClose: () => void }) {
  const [look, setLook] = useState<Look>(readLook);

  const update = (patch: Look) => {
    const next = { ...look, ...patch };
    setLook(next);
    saveLook(next);
  };

  return (
    <Sheet title="Tweak the look" subtitle="Applies as you click and stays on this browser." onClose={onClose}>
      <div className="flex flex-col gap-6">
        <Group label="Look" options={LOOKS} value={look.look ?? ''} onPick={(id) => update({ look: id || undefined })} />
        <Group label="Background" options={BACKDROPS} value={look.art ?? ''} onPick={(id) => update({ art: id || undefined })} />
        <Group label="Accent" options={ACCENTS} value={look.accent ?? ''} onPick={(id) => update({ accent: id || undefined })} />
        <Group label="Heading font" options={HEADS} value={look.head ?? ''} onPick={(id) => update({ head: id || undefined })} />
        <label className="flex flex-col gap-2 text-[13px] font-medium text-body">
          Glass blur: {look.blur ?? 22}px
          <input type="range" min={0} max={40} step={2} value={look.blur ?? 22} onChange={(e) => update({ blur: Number(e.target.value) })} className="accent-[var(--accent)]" />
        </label>
        <button type="button" onClick={() => update({ look: undefined, accent: undefined, head: undefined, art: undefined, blur: undefined })} className="self-start text-[13.5px] text-text-link hover:underline">
          Back to default
        </button>
      </div>
    </Sheet>
  );
}
