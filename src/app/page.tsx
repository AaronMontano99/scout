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

      {/* Value strip */}
      <section className="border-hairline border-t px-10 py-24">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 sm:grid-cols-3">
          <ValueItem
            n="01"
            title="30 seconds to call-ready"
            body="Orientation, not a research report — the brief a rep actually reads before dialing."
          />
          <ValueItem
            n="02"
            title="Memory that survives turnover"
            body="What your team already knows about an account, remembered — not lost when a rep leaves."
            divided
          />
          <ValueItem
            n="03"
            title="Real denominators, always"
            body="No fake AI scores. Every rate you see traces back to a real, countable event."
            divided
          />
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
      <section className="border-hairline border-t px-10 py-32 text-center">
        <h2 className="text-ink text-5xl leading-[1.1] font-semibold tracking-[-1.44px]">
          See it working on your own accounts.
        </h2>
        <div className="mt-8 flex items-center justify-center gap-5">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="bg-primary text-on-primary hover:bg-primary-active inline-flex h-10 items-center rounded-md px-[18px] text-sm font-medium"
          >
            Request a Demo
          </a>
          <Link
            href="/demo"
            className="text-text-link text-sm font-medium hover:underline"
          >
            Explore the demo workspace →
          </Link>
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
              Demo workspace
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

function ValueItem({
  n,
  title,
  body,
  divided,
}: {
  n: string;
  title: string;
  body: string;
  divided?: boolean;
}) {
  return (
    <div className={divided ? 'border-hairline px-12 sm:border-l' : 'pr-12'}>
      <div className="text-muted-soft font-mono text-[11px] tracking-[0.88px] uppercase">
        {n}
      </div>
      <div className="text-ink mt-4 text-[22px] font-semibold tracking-[-0.5px]">
        {title}
      </div>
      <p className="text-body mt-2.5 text-base leading-relaxed">{body}</p>
    </div>
  );
}

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
