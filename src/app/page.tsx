import Link from 'next/link';
import { PRODUCT_NAME, SUPPORT_EMAIL } from '@/lib/branding';
import { MarketingNav } from '@/components/marketing/nav';
import { ProductComposite } from '@/components/marketing/product-composite';

// Marketing homepage — DESIGN.md's marketing system: white canvas,
// restrained sky-blue hero wash (hero only, never elsewhere — see
// DESIGN.md Don'ts), black CTAs, 96px section rhythm. Structure per
// product spec §53, trimmed to what's honestly buildable pre-launch —
// no pricing/use-case pages exist yet, no fabricated metrics anywhere
// (§52). Product showcase uses the real Bay Sentinel Security demo
// fixture data already established in /demo — not invented numbers.

const WORKFLOW_STEPS = [
  { title: 'Bring your list', body: 'Upload Excel or connect your existing system.' },
  { title: 'Scout does the homework', body: 'Company websites, recent developments, relevant people, internal sales memory.' },
  { title: 'Start calling', body: 'Everything important in one concise workspace — no five open tabs.' },
  { title: 'Record what happened', body: 'One fast post-call workflow, not duplicate data entry.' },
  { title: 'Scout remembers', body: "Your organization's sales memory compounds instead of resetting." },
  { title: 'Measure the outcome', body: 'Meetings. Selling situations. Opportunities. Real denominators, always.' },
];

export default function MarketingHomePage() {
  return (
    <div className="bg-canvas">
      <MarketingNav />

      {/* Hero — the one place the sky-blue atmospheric wash is allowed, per DESIGN.md */}
      <section
        className="px-6 py-24 text-center sm:px-10 sm:py-32"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% -10%, var(--color-gradient-sky-light), transparent)',
        }}
      >
        <h1 className="mx-auto max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-ink sm:text-6xl">
          Turn your target list into a prospecting plan.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-body sm:text-lg">
          {PRODUCT_NAME} researches the companies your reps want to target, surfaces the people and
          context that matter, organizes what your team already knows, and gives reps what they need
          to start calling.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="inline-flex items-center justify-center rounded-md bg-primary px-[18px] py-[10px] text-sm font-medium text-on-primary hover:bg-primary-active"
          >
            Request a Demo
          </a>
          <a href="#how-it-works" className="text-sm font-medium text-text-link hover:underline">
            See how Scout works
          </a>
        </div>

        <div className="mt-16">
          <ProductComposite />
        </div>
      </section>

      {/* Value strip */}
      <section className="border-t border-hairline px-6 py-16 sm:px-10">
        <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-3">
          <ValueItem title="30 seconds to call-ready" body="Orientation, not a research report — the brief a rep actually reads before dialing." />
          <ValueItem title="Institutional memory that survives turnover" body="What your team already knows about an account, remembered — not lost when a rep leaves." />
          <ValueItem title="Real denominators, always" body="No fake AI scores. Every rate you see traces back to a real, countable event." />
        </div>
      </section>

      {/* How Scout works */}
      <section id="how-it-works" className="border-t border-hairline bg-canvas-soft px-6 py-20 sm:px-10">
        <h2 className="text-center text-xs font-semibold uppercase tracking-wide text-muted">How Scout Works</h2>
        <div className="mx-auto mt-8 grid max-w-5xl gap-4 sm:grid-cols-3">
          {WORKFLOW_STEPS.map((step, i) => (
            <div key={step.title} className="rounded-lg border border-hairline-strong bg-surface-card p-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-strong font-mono text-xs text-ink">
                {i + 1}
              </div>
              <div className="mt-3 text-sm font-semibold text-ink">{step.title}</div>
              <p className="mt-1 text-sm text-body">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Works with your stack */}
      <section className="border-t border-hairline px-6 py-20 text-center sm:px-10">
        <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Keep your CRM. Keep ZoomInfo. Keep Sales Navigator.</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-body sm:text-base">
          {PRODUCT_NAME} sits between scattered sales information and the salesperson&rsquo;s next call. It
          doesn&rsquo;t replace your stack, and it doesn&rsquo;t replace your reps &mdash; it does the homework
          around them.
        </p>
      </section>

      {/* Positioning */}
      <section className="border-t border-hairline bg-surface-dark px-6 py-20 text-center text-on-dark sm:px-10">
        <p className="mx-auto max-w-2xl font-mono text-lg leading-relaxed sm:text-xl">
          We do not sell AI.
          <br />
          We sell better-prepared salespeople.
        </p>
      </section>

      {/* Final CTA */}
      <section className="border-t border-hairline px-6 py-24 text-center sm:px-10">
        <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          See it working on your own accounts.
        </h2>
        <div className="mt-6 flex items-center justify-center gap-4">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="inline-flex items-center justify-center rounded-md bg-primary px-[18px] py-[10px] text-sm font-medium text-on-primary hover:bg-primary-active"
          >
            Request a Demo
          </a>
          <Link href="/demo" className="text-sm font-medium text-text-link hover:underline">
            Explore the demo workspace →
          </Link>
        </div>
      </section>

      <footer className="border-t border-hairline px-6 py-12 text-center text-xs text-muted sm:px-10">
        <div className="text-ink">{PRODUCT_NAME}</div>
        <p className="mt-1">Working name — see docs/PRODUCT_CONSTITUTION.md. Pre-launch, no customers yet.</p>
      </footer>
    </div>
  );
}

function ValueItem({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <div className="text-sm font-semibold text-ink">{title}</div>
      <p className="mt-1 text-sm text-body">{body}</p>
    </div>
  );
}
