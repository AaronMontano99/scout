// Hero product composite — DESIGN.md's "field-dashboard-card": a
// layered laptop + mobile composition built from real Scout product
// surfaces (Target List rows, Account Brain, Call-Ready Brief),
// showing the same fictional Bay Sentinel Security demo data used
// throughout /demo — never fabricated metrics, see product spec §52.
//
// Built with plain CSS 3D transforms (perspective + rotateX/Y +
// translateZ), not a WebGL/Three.js dependency. Per the 3D Usage
// Command this is "intentional product cinema," not "Dribbble bait" —
// a solo-founder-maintainable codebase (ARCHITECTURE.md's simplicity
// principle) doesn't need a 3D engine to achieve "layered panels,
// subtle perspective, controlled depth." Deliberately static — no
// continuous animation/parallax, per the anti-slop command's explicit
// rejection of "constant page-wide parallax" and to protect
// performance (product spec §64).

export function ProductComposite() {
  return (
    <div
      className="relative mx-auto h-[420px] w-full max-w-3xl sm:h-[480px]"
      style={{ perspective: '1800px' }}
      aria-hidden="true"
    >
      {/* Laptop — Target List workspace */}
      <div
        className="absolute left-1/2 top-4 w-[88%] -translate-x-1/2 overflow-hidden rounded-xl border border-hairline-strong bg-surface-card shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)] sm:w-[80%]"
        style={{ transform: 'translateX(-50%) rotateX(6deg) rotateY(-10deg)' }}
      >
        <div className="flex items-center gap-1.5 border-b border-hairline bg-canvas px-3 py-2">
          <span className="h-2 w-2 rounded-full bg-hairline-strong" />
          <span className="h-2 w-2 rounded-full bg-hairline-strong" />
          <span className="h-2 w-2 rounded-full bg-hairline-strong" />
          <span className="ml-2 font-mono text-[10px] text-muted">scout.app/lists/construction</span>
        </div>
        <div className="p-4">
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
              <div
                key={row.name}
                className="flex items-center justify-between rounded-md border border-hairline px-3 py-2"
              >
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
      </div>

      {/* Floating panel — Account Brain / What Matters */}
      <div
        className="absolute right-2 top-0 w-56 rounded-lg border border-hairline-strong bg-surface-dark p-4 text-on-dark shadow-[0_24px_50px_-16px_rgba(0,0,0,0.35)] sm:w-64"
        style={{ transform: 'rotateX(4deg) rotateY(-14deg) translateZ(70px)' }}
      >
        <div className="text-[10px] font-semibold uppercase tracking-wide text-on-dark-soft">What Matters</div>
        <ul className="mt-2 flex flex-col gap-1.5 font-mono text-[11px] leading-relaxed">
          <li>· New Bay Area office, Q3</li>
          <li>· Contract renewal ~Oct</li>
          <li>· VP Ops confirmed as buyer</li>
        </ul>
      </div>

      {/* Mobile — compact field view */}
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
  );
}
