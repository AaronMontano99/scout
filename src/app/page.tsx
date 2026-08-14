import Link from 'next/link';
import { PRODUCT_NAME, SUPPORT_EMAIL } from '@/lib/branding';
import { MarketingNav } from '@/components/marketing/nav';
import { FlightHero } from '@/components/marketing/flight-hero';

// Marketing homepage — DESIGN.md's marketing system: white canvas, restrained
// sky-blue hero wash (hero only, never elsewhere — see DESIGN.md Don'ts), black
// CTAs, 96px section rhythm. Structure per product spec §53, trimmed to what's
// honestly buildable pre-launch — no fabricated metrics anywhere (§52). Product
// surfaces use the real Bay Sentinel / Coastal Framing demo fixture data already
// established in /demo — not invented numbers.
//
// The hero is now FlightHero: a scroll-scrubbed seven-beat camera move through the
// real product surfaces, replacing the static ProductComposite. ProductComposite
// remains in the tree unused — delete it once the flight has shipped and settled.

export default function MarketingHomePage() {
  return (
    <div className="bg-canvas">
      <MarketingNav />

      <FlightHero />

      {/* Feature grid */}
      <section className="px-10 py-24">
        <div className="mx-auto grid max-w-[1200px] gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="border-hairline bg-surface-card rounded-[14px] border p-[26px] shadow-[0_10px_30px_-24px_rgba(23,23,23,0.4)]"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#2f6fed]/[0.08]">
                <span className="text-[#2f6fed]">{f.icon}</span>
              </div>
              <div className="text-ink mt-[18px] text-base font-semibold">{f.title}</div>
              <p className="text-body mt-2 text-sm leading-relaxed">{f.body}</p>
              <a
                href={f.href}
                className="mt-4 inline-block text-sm font-medium text-[#2f6fed] hover:underline"
              >
                Learn more →
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* How Scout works */}
      <section
        id="how-it-works"
        className="border-hairline bg-canvas-soft border-t px-10 py-24"
      >
        <div className="mx-auto grid max-w-[1200px] gap-20 lg:grid-cols-[360px_1fr]">
          <div>
            <div className="text-muted font-mono text-[11px] tracking-[0.88px] uppercase">
              How {PRODUCT_NAME} works
            </div>
            <h2 className="text-ink mt-[18px] text-4xl leading-[1.15] font-semibold tracking-[-1.08px]">
              Six steps, one workflow.
            </h2>
            <p className="text-body mt-4 text-base leading-relaxed">
              The same path the flight above traces — from a spreadsheet nobody wants to
              open to a call your rep is ready for.
            </p>
          </div>
          <div className="flex flex-col">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                className={`grid grid-cols-[56px_1fr] gap-6 py-[22px] ${
                  i < STEPS.length - 1 ? 'border-hairline-strong border-b' : ''
                }`}
              >
                <div className="text-muted-soft font-mono text-[13px]">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div>
                  <div className="text-ink text-lg font-semibold">{s.title}</div>
                  <p className="text-body mt-1.5 text-base leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certainty */}
      <section id="certainty" className="border-hairline border-t px-10 py-24">
        <div className="mx-auto max-w-[1200px]">
          <div className="text-muted font-mono text-[11px] tracking-[0.88px] uppercase">
            Certainty is a first-class state
          </div>
          <h2 className="text-ink mt-[18px] max-w-[680px] text-4xl leading-[1.15] font-semibold tracking-[-1.08px]">
            A rep should never have to guess how confident the page is.
          </h2>
          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            <CertaintyCard
              badge="KNOWN"
              badgeClass="bg-surface-strong text-ink"
              body="Stated by the source, or logged by someone on your team. It goes in the brief as fact."
            />
            <CertaintyCard
              badge="INFERRED"
              badgeClass="border border-hairline-strong text-body"
              body="Reasoned from evidence Scout can show you. Useful, and always labelled as reasoning."
            />
            <CertaintyCard
              badge="SUGGESTED"
              badgeClass="border border-dashed border-hairline-strong text-muted"
              body="A lead worth checking, nothing more. The weakest state, and it looks like it."
            />
          </div>
        </div>
      </section>

      {/* Built for work around the call */}
      <section className="bg-surface-dark text-on-dark px-10 py-32 text-center">
        <div className="text-on-dark-soft font-mono text-[11px] tracking-[0.88px] uppercase">
          Built for work around the call
        </div>
        <p className="mx-auto mt-7 max-w-[760px] font-mono text-[28px] leading-[1.7]">
          Scout does the research, organizes the account, and handles the follow-up work
          so reps can keep selling.
        </p>
      </section>

      {/* Works with your stack */}
      <section id="stack" className="px-10 py-24 text-center">
        <h2 className="text-ink mx-auto max-w-[900px] text-4xl leading-[1.15] font-semibold tracking-[-1.08px]">
          Keep your CRM. Keep ZoomInfo. Keep Sales Navigator.
        </h2>
        <p className="text-body mx-auto mt-[18px] max-w-[640px] text-base leading-relaxed">
          {PRODUCT_NAME} sits between scattered sales information and the
          salesperson&rsquo;s next call. It doesn&rsquo;t replace your stack, and it
          doesn&rsquo;t replace your reps &mdash; it does the homework around them.
        </p>
      </section>

      {/* Final CTA */}
      <section className="px-10 py-24">
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 overflow-hidden rounded-[20px] bg-[linear-gradient(135deg,#eaf1fe_0%,#dbe8fd_55%,#cfe0fb_100%)] px-16 py-[72px] lg:grid-cols-[1fr_auto]">
          <svg
            width="300"
            height="300"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="absolute -right-[30px] -bottom-[70px] opacity-35"
          >
            <path
              d="M12 1.5 14 9.9 22.5 12 14 14.1 12 22.5 10 14.1 1.5 12 10 9.9Z"
              fill="#ffffff"
            />
          </svg>
          <h2 className="text-ink relative m-0 max-w-[520px] text-[clamp(28px,3.4vw,44px)] leading-[1.12] font-semibold tracking-[-0.03em]">
            See it working on your own accounts.
          </h2>
          <div className="relative flex items-center gap-3.5">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-on-primary inline-flex h-11 shrink-0 items-center gap-2.5 rounded-full bg-[#2f6fed] py-0 pr-4 pl-5 text-sm font-medium whitespace-nowrap shadow-[0_10px_24px_-12px_rgba(47,111,237,0.9)] hover:bg-[#2761d8]"
            >
              Request a Demo
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[11px]">
                →
              </span>
            </a>
            <Link
              href="/demo"
              className="border-hairline-strong bg-surface-card text-ink inline-flex h-11 shrink-0 items-center rounded-full border px-5 text-sm font-medium whitespace-nowrap"
            >
              View Product Tour
            </Link>
            <Link
              href="/app"
              className="border-hairline-strong bg-surface-card text-ink inline-flex h-11 shrink-0 items-center rounded-full border px-5 text-sm font-medium whitespace-nowrap"
            >
              Open My Workspace
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-hairline border-t px-10 py-16">
        <div className="mx-auto flex max-w-[1200px] items-start justify-between gap-10">
          <div>
            <div className="text-ink text-[15px] font-semibold tracking-[-0.2px]">
              {PRODUCT_NAME}
            </div>
            <p className="text-muted mt-2.5 text-sm">
              Working name — see docs/PRODUCT_CONSTITUTION.md. Pre-launch, no customers
              yet.
            </p>
          </div>
          <div className="flex gap-10">
            <a href="#how-it-works" className="text-body hover:text-ink text-sm">
              How it works
            </a>
            <a href="#certainty" className="text-body hover:text-ink text-sm">
              Certainty
            </a>
            <Link href="/demo" className="text-body hover:text-ink text-sm">
              Product tour
            </Link>
            <Link href="/app" className="text-body hover:text-ink text-sm">
              My Workspace
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const STEPS = [
  { title: 'Bring your list', body: 'Upload Excel or connect your existing system.' },
  {
    title: 'Scout does the homework',
    body: 'Company websites, recent developments, relevant people, internal sales memory.',
  },
  {
    title: 'Start calling',
    body: 'Everything important in one concise workspace — no five open tabs.',
  },
  {
    title: 'Record what happened',
    body: 'One fast post-call workflow, not duplicate data entry.',
  },
  {
    title: 'Scout remembers',
    body: 'Your organization’s sales memory compounds instead of resetting.',
  },
  {
    title: 'Measure the outcome',
    body: 'Meetings. Selling situations. Opportunities. Real denominators, always.',
  },
];

const FEATURES = [
  {
    title: '30 seconds to call-ready',
    body: 'Orientation, not a research report — the brief a rep actually reads before dialing.',
    href: '#how-it-works',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 4 13.4 10.6 20 12 13.4 13.4 12 20 10.6 13.4 4 12 10.6 10.6Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    title: 'Memory that survives turnover',
    body: 'What your team already knows about an account, remembered — not lost when a rep leaves.',
    href: '#how-it-works',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: 'Real denominators, always',
    body: 'No fake AI scores. Every rate you see traces back to a real, countable event.',
    href: '#certainty',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 18V9M10 18V5M16 18v-6M22 18h-20"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: 'Keep your existing stack',
    body: 'Works alongside your CRM, ZoomInfo and Sales Navigator — nothing to rip out.',
    href: '#stack',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M5 19v-1.5a3.5 3.5 0 0 1 3.5-3.5h1M19 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-1"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <circle cx="9" cy="8.5" r="2.6" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="15.5" cy="8.5" r="2.6" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
];

function CertaintyCard({
  badge,
  badgeClass,
  body,
}: {
  badge: string;
  badgeClass: string;
  body: string;
}) {
  return (
    <div className="border-hairline-strong rounded-lg border p-7">
      <span
        className={`inline-block rounded-full px-2 py-0.5 font-mono text-[11px] tracking-[0.88px] ${badgeClass}`}
      >
        {badge}
      </span>
      <p className="text-body mt-[18px] text-base leading-relaxed">{body}</p>
    </div>
  );
}
