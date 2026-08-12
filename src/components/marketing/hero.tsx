import Link from 'next/link';
import { SUPPORT_EMAIL } from '@/lib/branding';
import { SparkleMark } from '@/components/marketing/logo';

// New hero — see DESIGN.md AMENDMENT 2026-08-12. Copy and layout come
// from the product owner's reference mockup, not invented here. Static
// (no scroll-scrubbed animation, no autoplay) per the anti-slop
// "no continuous motion" rule — the only interactive affordance is the
// two real CTAs.
//
// The "Trusted by" row deliberately does NOT use the mockup's real
// company names (Ramp, Vanta, Amplitude, dbt Labs, Chargebee) — Scout
// has no customers yet, and claiming named real companies as customers
// would be a false endorsement. It ships as neutral placeholder marks
// instead; swap in real logos once there are real customers to show.
//
// The floating "ACME CORP" panel uses the same obviously-fictional
// placeholder-company idiom as the rest of the demo product (Bay
// Sentinel Security, Coastal Framing Co in product-composite.tsx) —
// not a real account, not a real metric.

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-16 pb-24 sm:px-10">
      <div
        aria-hidden="true"
        className="from-brand-lavender pointer-events-none absolute inset-0 bg-gradient-to-br via-white to-white"
      />

      <div className="relative mx-auto grid max-w-[1280px] items-center gap-16 lg:grid-cols-[minmax(0,540px)_1fr]">
        {/* Left — copy */}
        <div>
          <div className="text-muted font-mono text-[11px] tracking-[0.88px] uppercase">
            _Intelligent Territory™
          </div>
          <h1 className="font-display text-ink mt-5 text-[clamp(40px,5.2vw,64px)] leading-[1.08] font-medium tracking-[-0.02em]">
            Find your <em className="text-brand-purple not-italic">next</em> best
            account.
          </h1>
          <p className="text-body mt-6 max-w-[440px] text-base leading-relaxed">
            Scout turns signals into targets and insight into action&mdash;so you
            can focus on the accounts most likely to win.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="bg-primary text-on-primary hover:bg-primary-active inline-flex h-11 items-center gap-2.5 rounded-full py-0 pr-4 pl-5 text-sm font-medium"
            >
              Book a Demo
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[11px]">
                →
              </span>
            </a>
            <Link
              href="/demo"
              className="border-hairline-strong text-ink hover:bg-canvas-soft inline-flex h-11 items-center gap-2.5 rounded-full border bg-white py-0 pr-4 pl-5 text-sm font-medium"
            >
              Start Scouting
              <span className="text-muted inline-flex h-5 w-5 items-center justify-center text-[11px]">
                →
              </span>
            </Link>
          </div>

          <div className="mt-14">
            <div className="text-faint font-mono text-[10px] tracking-[0.88px] uppercase">
              Trusted by top revenue teams
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-6">
              {PLACEHOLDER_MARKS.map((mark, i) => (
                <PlaceholderMark key={i} shape={mark} />
              ))}
            </div>
          </div>
        </div>

        {/* Right — constellation visual + product card */}
        <div className="relative mx-auto aspect-square w-full max-w-[560px]">
          <Constellation />

          <div className="border-hairline-strong absolute right-0 bottom-0 w-[300px] rounded-2xl border bg-white p-4 shadow-[0_30px_60px_-24px_rgba(76,29,149,0.35)] sm:w-[320px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="bg-brand-purple flex h-8 w-8 items-center justify-center rounded-lg">
                  <SparkleMark className="[&_path]:fill-white" />
                </span>
                <div>
                  <div className="text-ink font-mono text-xs font-semibold">
                    ACME CORP
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-[11px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-muted">Ideal Fit &middot; Very Strong</span>
                  </div>
                </div>
              </div>
              <span className="border-brand-purple text-brand-purple flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-semibold">
                92
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <div className="text-faint text-[10px] font-medium tracking-wide uppercase">
                  Top Signals
                </div>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {TOP_SIGNALS.map((s) => (
                    <li key={s.label}>
                      <div className="text-ink text-[11px] leading-snug">{s.label}</div>
                      <div className="text-faint text-[10px]">{s.age}</div>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-faint text-[10px] font-medium tracking-wide uppercase">
                  Nearby Targets
                </div>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {NEARBY_TARGETS.map((t) => (
                    <li key={t.name} className="flex items-center justify-between">
                      <span className="text-ink text-[11px]">{t.name}</span>
                      <span className="text-muted text-[10px]">{t.score}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <a
              href="#product"
              className="text-brand-purple mt-3 block text-[11px] font-medium"
            >
              View all targets &rarr;
            </a>

            <div className="border-hairline mt-4 border-t pt-3.5">
              <div className="text-faint text-[10px] font-medium tracking-wide uppercase">
                Next Best Action
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div>
                  <div className="text-ink text-[11px] font-medium">
                    Intro via Alex Kim
                  </div>
                  <div className="text-faint text-[10px]">VP of Sales, ACME</div>
                </div>
                <span className="bg-brand-purple flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium text-white">
                  Send Intro
                </span>
              </div>
            </div>
            <a
              href="#product"
              className="text-brand-purple mt-3 block text-[11px] font-medium"
            >
              View all next moves &rarr;
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

const TOP_SIGNALS = [
  { label: 'Expansion funding', age: '2 days ago' },
  { label: 'Hiring — 12 open roles', age: '1 week ago' },
  { label: 'Tech spend increase', age: '2 weeks ago' },
];

const NEARBY_TARGETS = [
  { name: 'Globex', score: '87' },
  { name: 'Initech', score: '82' },
  { name: 'Umbrella', score: '78' },
];

function Constellation() {
  return (
    <svg
      viewBox="0 0 560 560"
      fill="none"
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
    >
      <g stroke="var(--color-brand-purple)" strokeOpacity="0.22" strokeWidth="1">
        <line x1="280" y1="200" x2="120" y2="330" />
        <line x1="280" y1="200" x2="420" y2="120" />
        <line x1="280" y1="200" x2="440" y2="340" />
        <line x1="280" y1="200" x2="150" y2="120" />
        <line x1="120" y1="330" x2="90" y2="420" />
        <line x1="440" y1="340" x2="480" y2="440" />
      </g>
      <g fill="var(--color-brand-purple)" fillOpacity="0.5">
        <circle cx="120" cy="330" r="4" />
        <circle cx="420" cy="120" r="3" />
        <circle cx="440" cy="340" r="5" />
        <circle cx="150" cy="120" r="3" />
        <circle cx="90" cy="420" r="3" />
        <circle cx="480" cy="440" r="3" />
      </g>
      <circle
        cx="280"
        cy="200"
        r="46"
        stroke="var(--color-brand-purple)"
        strokeOpacity="0.35"
        strokeDasharray="3 5"
      />
      <path
        d="M280 172 284.5 195.5 308 200 284.5 204.5 280 228 275.5 204.5 252 200 275.5 195.5Z"
        fill="var(--color-brand-purple)"
      />
      <text
        x="280"
        y="140"
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="10"
        letterSpacing="1.5"
        fill="var(--color-muted)"
      >
        NORTH STAR
      </text>
      <text
        x="70"
        y="345"
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="10"
        letterSpacing="1"
        fill="var(--color-muted)"
      >
        MID-MARKET
      </text>
      <text
        x="490"
        y="105"
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="10"
        letterSpacing="1"
        fill="var(--color-muted)"
      >
        ENTERPRISE
      </text>
      <text
        x="500"
        y="470"
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="10"
        letterSpacing="1"
        fill="var(--color-muted)"
      >
        EMERGING
      </text>
    </svg>
  );
}

// Neutral, unlabeled placeholder marks — see file header note on why
// these aren't real company logos.
const PLACEHOLDER_MARKS: Array<'circle' | 'square' | 'triangle' | 'diamond' | 'pill'> = [
  'circle',
  'square',
  'triangle',
  'diamond',
  'pill',
];

function PlaceholderMark({ shape }: { shape: (typeof PLACEHOLDER_MARKS)[number] }) {
  return (
    <span
      aria-hidden="true"
      className="border-hairline-strong flex h-7 w-16 items-center justify-center rounded-md border bg-white"
    >
      {shape === 'circle' && (
        <span className="bg-muted-soft h-3 w-3 rounded-full" />
      )}
      {shape === 'square' && <span className="bg-muted-soft h-3 w-3 rounded-[3px]" />}
      {shape === 'triangle' && (
        <span
          className="border-muted-soft h-0 w-0 border-r-[6px] border-b-[9px] border-l-[6px] border-r-transparent border-l-transparent"
        />
      )}
      {shape === 'diamond' && (
        <span className="bg-muted-soft h-3 w-3 rotate-45" />
      )}
      {shape === 'pill' && <span className="bg-muted-soft h-2.5 w-6 rounded-full" />}
    </span>
  );
}
