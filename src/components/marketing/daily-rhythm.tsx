import { Reveal } from '@/components/marketing/reveal';

// "Scout every day" — see DESIGN.md AMENDMENT 2026-08-12. Copy and
// card layout come from the product owner's reference mockup. Replaces
// the old four-card generic feature grid; same section slot, same
// purpose (headline capabilities), new content and treatment.
//
// Mini previews reuse the same obviously-fictional demo idiom as the
// rest of the product (see hero.tsx header note) — illustrative UI,
// not real customer data.

export function DailyRhythm() {
  return (
    <section id="product" className="px-6 py-24 sm:px-10">
      <Reveal className="mx-auto max-w-[1200px]">
        <div className="text-muted font-mono text-[11px] tracking-[0.88px] uppercase">
          _Scout every day
        </div>
        <h2 className="font-display text-ink mt-4 max-w-[520px] text-[clamp(28px,3.4vw,40px)] leading-[1.15] font-medium tracking-[-0.02em]">
          A daily rhythm for smarter selling.
        </h2>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          <RhythmCard
            index="01"
            title="Daily Briefs"
            body="Your snapshot of what matters across accounts and territory."
            icon={<BriefIcon />}
          >
            <div className="border-hairline-strong rounded-lg border bg-white p-3.5">
              <div className="text-faint font-mono text-[10px]">Monday, May 12</div>
              <div className="text-ink mt-1 text-sm font-semibold">8 new signals</div>
              <div className="text-muted text-[11px]">Across 6 accounts</div>
              <div className="mt-2.5 flex -space-x-1.5" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className="bg-muted-soft border-hairline h-5 w-5 rounded-full border-2 border-white"
                    style={{ opacity: 1 - i * 0.12 }}
                  />
                ))}
                <span className="text-faint ml-2.5 self-center text-[10px]">+4</span>
              </div>
            </div>
          </RhythmCard>

          <RhythmCard
            index="02"
            title="Account Signals"
            body="Real-time signals that reveal intent, risk, and opportunity."
            icon={<SignalIcon />}
          >
            <div className="border-hairline-strong flex flex-col gap-2 rounded-lg border bg-white p-3.5">
              {[
                { label: 'Buying intent detected', sub: 'Datadog', age: '2h' },
                { label: 'Funding announced', sub: 'Modern Health', age: '5h' },
                { label: 'New leadership', sub: 'HashiCorp', age: '1d' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <div>
                    <div className="text-ink text-[11px] font-medium">{row.label}</div>
                    <div className="text-faint text-[10px]">{row.sub}</div>
                  </div>
                  <span className="text-faint text-[10px]">{row.age}</span>
                </div>
              ))}
            </div>
          </RhythmCard>

          <RhythmCard
            index="03"
            title="Territory Map"
            body="Visualize your world. Focus on the pockets with the most potential."
            icon={<MapIcon />}
          >
            <div className="border-hairline-strong from-brand-lavender relative h-[110px] overflow-hidden rounded-lg border bg-gradient-to-br to-white">
              <div
                aria-hidden="true"
                className="bg-brand-purple/20 absolute top-3 left-6 h-16 w-16 rounded-full blur-xl"
              />
              <div
                aria-hidden="true"
                className="bg-brand-purple/10 absolute right-8 bottom-2 h-12 w-12 rounded-full blur-lg"
              />
              <div className="border-hairline-strong absolute right-3 bottom-3 rounded-md border bg-white px-2.5 py-1.5 shadow-sm">
                <div className="text-ink text-[10px] font-semibold">High opportunity zone</div>
                <div className="text-faint text-[10px]">23 accounts</div>
              </div>
            </div>
          </RhythmCard>
        </div>

        <div className="mt-12 text-center">
          <a href="#how-it-works" className="text-brand-purple text-sm font-medium">
            Explore the platform &rarr;
          </a>
        </div>
      </Reveal>
    </section>
  );
}

function RhythmCard({
  index,
  title,
  body,
  icon,
  children,
}: {
  index: string;
  title: string;
  body: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border-hairline bg-canvas-soft rounded-2xl border p-6">
      <div className="flex items-center justify-between">
        <span className="bg-brand-purple flex h-9 w-9 items-center justify-center rounded-lg text-white">
          {icon}
        </span>
        <span className="text-faint font-mono text-[11px] tracking-[0.88px]">{index}</span>
      </div>
      <div className="text-ink mt-4 text-base font-semibold">{title}</div>
      <p className="text-body mt-1.5 text-sm leading-relaxed">{body}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function BriefIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 3h9l5 5v13H6V3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 12h6M9 16h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function SignalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="2.4" fill="currentColor" />
      <path
        d="M8 8a5.6 5.6 0 0 0 0 8M16 8a5.6 5.6 0 0 1 0 8M4.5 4.5a11 11 0 0 0 0 15M19.5 4.5a11 11 0 0 1 0 15"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2-6-2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 4v14M15 6v14" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
