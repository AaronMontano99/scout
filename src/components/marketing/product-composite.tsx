'use client';

import { useState } from 'react';

// Hero product composite — DESIGN.md's "field-dashboard-card": a
// layered laptop + mobile composition built from real Scout product
// surfaces, showing the same fictional Bay Sentinel Security demo
// data used throughout /demo — never fabricated metrics, see product
// spec §52.
//
// Interactive: a segmented control switches the laptop + floating
// panel content between the three signature surfaces (Target List /
// Call-Ready Brief / Post-Call), tracing the actual product story
// flow rather than showing a single static screenshot. Real state
// (useState), not a decorative carousel that autoplays.
//
// Built with plain CSS 3D transforms (perspective + rotateX/Y +
// translateZ), not a WebGL/Three.js dependency — see ARCHITECTURE.md's
// simplicity principle. Layered panels use fixed transforms only; the
// only animation is the content swap on click (Tailwind's default
// transition), no continuous motion — per the anti-slop command's
// rejection of "constant page-wide parallax."

type View = 'targetList' | 'callReadyBrief' | 'postCall';

const VIEWS: { id: View; label: string }[] = [
  { id: 'targetList', label: 'Target List' },
  { id: 'callReadyBrief', label: 'Call-Ready Brief' },
  { id: 'postCall', label: 'Post-Call' },
];

export function ProductComposite() {
  const [view, setView] = useState<View>('targetList');

  return (
    <div>
      <div className="mx-auto mb-6 flex w-fit gap-1 rounded-full bg-surface-strong p-1">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              view === v.id ? 'bg-ink text-canvas' : 'text-body hover:text-ink'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div
        className="relative mx-auto h-[420px] w-full max-w-3xl sm:h-[480px]"
        style={{ perspective: '1800px' }}
      >
        {/* Laptop — main stage, content swaps with the selected view */}
        <div
          className="absolute left-1/2 top-4 w-[88%] -translate-x-1/2 overflow-hidden rounded-xl border border-hairline-strong bg-surface-card shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)] sm:w-[80%]"
          style={{ transform: 'translateX(-50%) rotateX(6deg) rotateY(-10deg)' }}
        >
          <div className="flex items-center gap-1.5 border-b border-hairline bg-canvas px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-hairline-strong" />
            <span className="h-2 w-2 rounded-full bg-hairline-strong" />
            <span className="h-2 w-2 rounded-full bg-hairline-strong" />
            <span className="ml-2 font-mono text-[10px] text-muted">{URL_BY_VIEW[view]}</span>
          </div>
          <div className="p-4">
            <LaptopContent view={view} />
          </div>
        </div>

        {/* Floating panel — context-specific, changes with the selected view */}
        <div
          className="absolute right-2 top-0 w-56 rounded-lg border border-hairline-strong bg-surface-dark p-4 text-on-dark shadow-[0_24px_50px_-16px_rgba(0,0,0,0.35)] sm:w-64"
          style={{ transform: 'rotateX(4deg) rotateY(-14deg) translateZ(70px)' }}
        >
          <FloatingPanelContent view={view} />
        </div>

        {/* Mobile — compact field view, stays on the Call-Ready Brief regardless of selection */}
        <div
          className="absolute bottom-0 left-2 w-32 overflow-hidden rounded-2xl border border-hairline-strong bg-surface-card shadow-[0_20px_40px_-16px_rgba(0,0,0,0.3)] sm:w-36"
          style={{ transform: 'rotateX(4deg) rotateY(12deg) translateZ(50px)' }}
        >
          <div className="border-b border-hairline bg-canvas px-2 py-1.5 text-center text-[9px] font-medium text-ink">
            Call-Ready Brief
          </div>
          <div className="p-2">
            <div className="text-[9px] font-semibold text-ink">Coastal Framing Co</div>
            <div className="mt-1 text-[8px] leading-snug text-body">
              Owner engaged directly. Hiring signal. Meeting Wed 2pm.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const URL_BY_VIEW: Record<View, string> = {
  targetList: 'scout.app/lists/construction',
  callReadyBrief: 'scout.app/accounts/coastal-framing',
  postCall: 'scout.app/accounts/coastal-framing/post-call',
};

function LaptopContent({ view }: { view: View }) {
  if (view === 'callReadyBrief') {
    return (
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">Coastal Framing Co</div>
        <div className="mt-1 text-xs text-body">
          Small commercial framing contractor, 10-20 employees, owner-operated.
        </div>
        <div className="mt-3 text-[10px] font-semibold uppercase tracking-wide text-muted">What Matters</div>
        <ul className="mt-1 flex flex-col gap-1 text-xs text-ink">
          <li>· Posted 3 new site-supervisor roles in 30 days</li>
          <li>· Angela Brooks (Owner) is the confirmed buyer</li>
        </ul>
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded-full bg-surface-strong px-2 py-0.5 text-[9px] font-semibold text-ink">KNOWN</span>
          <span className="text-[10px] text-body">Angela Brooks · Owner</span>
        </div>
      </div>
    );
  }

  if (view === 'postCall') {
    return (
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">What You Typed</div>
        <p className="mt-1 rounded-md bg-surface-strong p-2 font-mono text-[10px] text-ink">
          talked to angela direct. owner. said theyve been thinking about upgrading cameras...
        </p>
        <div className="mt-2 text-center text-[9px] text-muted">↓ Scout cleans this up ↓</div>
        <div className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-muted">Clean CRM Note</div>
        <p className="mt-1 rounded-md border border-hairline-strong p-2 text-[10px] text-body">
          Spoke directly with Angela Brooks (Owner). Considering a camera upgrade for new job sites.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        Construction — Bay Area
      </div>
      <div className="mt-1 text-xs text-body">83 / 197 worked · 17 ready · 12 processing</div>
      <div className="mt-3 flex flex-col gap-1.5">
        {[
          { name: 'Ridgeline Builders', tag: 'Strong Context', pinned: false },
          { name: 'Coastal Framing Co', tag: 'Strong Context', pinned: true },
          { name: 'Anderson & Sons Construction', tag: 'Useful Context', pinned: false },
        ].map((row) => (
          <div key={row.name} className="flex items-center justify-between rounded-md border border-hairline px-3 py-2">
            <span className="text-xs text-ink">
              {row.pinned && '📌 '}
              {row.name}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-semantic-success" />
              {row.tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FloatingPanelContent({ view }: { view: View }) {
  if (view === 'callReadyBrief') {
    return (
      <>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-on-dark-soft">Sources</div>
        <ul className="mt-2 flex flex-col gap-1.5 font-mono text-[11px] leading-relaxed">
          <li>· Job board posting</li>
          <li>· Company newsroom</li>
          <li>· CRM account record</li>
        </ul>
      </>
    );
  }

  if (view === 'postCall') {
    return (
      <>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-on-dark-soft">
          Follow-Up Draft
        </div>
        <p className="mt-2 font-mono text-[11px] leading-relaxed">
          &ldquo;Ahead of Wednesday, wanted to send a quick overview for multi-site camera upgrades...&rdquo;
        </p>
      </>
    );
  }

  return (
    <>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-on-dark-soft">What Matters</div>
      <ul className="mt-2 flex flex-col gap-1.5 font-mono text-[11px] leading-relaxed">
        <li>· New Bay Area office, Q3</li>
        <li>· Contract renewal ~Oct</li>
        <li>· VP Ops confirmed as buyer</li>
      </ul>
    </>
  );
}
