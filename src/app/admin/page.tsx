import { DEMO_ORGANIZATION } from '@/demo';

/**
 * Founder Operations Console — structural stub only. See
 * docs/FOUNDER_OPERATIONS.md for the full spec.
 *
 * ⚠️ NOT WIRED TO REAL AUTHORIZATION. Per ADR-0007 and SECURITY.md,
 * this route must be gated on `app_users.platform_admin = true` before
 * it is ever deployed somewhere reachable with real customer data
 * behind it. No such check exists yet because no live Supabase project
 * or auth flow exists yet (see README.md). Do not treat this route's
 * mere existence as evidence access control is handled — it isn't.
 * Illustrative content only, using the same fictional demo org as
 * /demo — never real customer data, see DEMO.md.
 */
export default function AdminConsolePage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 rounded-md border-l-[3px] border-l-accent-warning bg-surface-strong px-4 py-3 text-sm text-ink">
        <strong>Structural stub — not authorization-gated.</strong> Do not deploy this route with real
        customer data reachable until platform_admin authorization (ADR-0007) is actually implemented.
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-ink">Founder Operations Console</h1>
      <p className="mt-1 text-sm text-body">Illustrative layout — see docs/FOUNDER_OPERATIONS.md.</p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <Section title="Customer">
          <Row label="Organization" value={DEMO_ORGANIZATION.name} />
          <Row label="Plan" value="Pilot" />
          <Row label="Seats" value="1 / 5" />
        </Section>

        <Section title="Implementation">
          <Row label="Onboarding" value="Complete" />
          <Row label="Target Lists" value="2" />
          <Row label="First Value" value="Reached 2026-07-22" />
        </Section>

        <Section title="Integrations">
          <Row label="CRM" value="Not connected" />
          <Row label="Enrichment" value="Not connected" />
        </Section>

        <Section title="Research">
          <Row label="Accounts researched" value="14 / 14" />
          <Row label="Failed jobs (7d)" value="0" />
          <Row label="Est. cost (7d)" value="$0.00 (demo)" />
        </Section>

        <Section title="Product Activity">
          <Row label="Accounts worked" value="4" />
          <Row label="Meetings booked" value="1" />
          <Row label="Selling situations" value="1" />
        </Section>

        <Section title="Health">
          <Row label="Status" value="Healthy" />
          <Row label="Basis" value="Active in last 7 days, research current, no failed jobs" />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-hairline-strong bg-surface-card p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</div>
      <div className="mt-2 flex flex-col gap-1">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-body">{label}</span>
      <span className="font-mono text-ink">{value}</span>
    </div>
  );
}
