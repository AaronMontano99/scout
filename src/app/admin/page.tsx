import { DEMO_ORGANIZATION, getResearchDiagnostics } from '@/demo';

/**
 * Founder Operations Console — structural stub with real research
 * diagnostics. See docs/FOUNDER_OPERATIONS.md for the full spec.
 *
 * ⚠️ NOT WIRED TO REAL AUTHORIZATION. Per ADR-0007 and SECURITY.md,
 * this route must be gated on `app_users.platform_admin = true` before
 * it is ever deployed somewhere reachable with real customer data
 * behind it. No such check exists yet because no live Supabase project
 * or auth flow exists yet (see README.md). Do not treat this route's
 * mere existence as evidence access control is handled — it isn't.
 *
 * Customer/Implementation/Integrations/Billing/Health sections remain
 * illustrative (no live org/billing model to compute from yet — see
 * PHASE_4_COMPLETION_REPORT.md). The Research section is real —
 * computed from actual demo fixture research_status values via
 * src/domain/research-status.ts, not hand-typed numbers. This is the
 * one section RESEARCH_OPERATIONS.md specifically requires to answer
 * real questions ("why didn't this account research") without a
 * manual query — this section actually does, even in demo mode.
 */
export default function AdminConsolePage() {
  const diagnostics = getResearchDiagnostics();

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 rounded-md border-l-[3px] border-l-accent-warning bg-surface-strong px-4 py-3 text-sm text-ink">
        <strong>Structural stub — not authorization-gated.</strong> Do not deploy this route with real
        customer data reachable until platform_admin authorization (ADR-0007) is actually implemented.
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-ink">Founder Operations Console</h1>
      <p className="mt-1 text-sm text-body">
        Research section below is real (computed from demo fixture data); other sections remain
        illustrative — see docs/FOUNDER_OPERATIONS.md.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <Section title="Customer">
          <Row label="Organization" value={DEMO_ORGANIZATION.name} />
          <Row label="Plan" value="Pilot" />
          <Row label="Seats" value="1 / 5" />
        </Section>

        <Section title="Implementation">
          <Row label="Onboarding" value="Complete" />
          <Row label="Target Lists" value="3" />
          <Row label="First Value" value="Reached 2026-07-22" />
        </Section>

        <Section title="Integrations">
          <Row label="CRM" value="Not connected" />
          <Row label="Enrichment" value="Not connected" />
        </Section>

        <Section title="Research (real)">
          <Row label="Total accounts" value={String(diagnostics.totalAccounts)} />
          <Row label="Ready" value={String(diagnostics.summary.ready)} />
          <Row label="Processing" value={String(diagnostics.summary.processing)} />
          <Row label="Queued" value={String(diagnostics.summary.queued)} />
          <Row label="Needs review" value={String(diagnostics.summary.needsReview)} />
          <Row label="Failed" value={String(diagnostics.summary.failed)} />
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

      {diagnostics.needsAttention.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Accounts Needing Attention ({diagnostics.needsAttention.length})
          </div>
          <div className="rounded-lg border border-hairline-strong bg-surface-card">
            {diagnostics.needsAttention.map((a) => (
              <div key={a.id} className="flex items-center justify-between border-b border-hairline px-4 py-2 last:border-b-0 text-sm">
                <span className="text-ink">{a.name}</span>
                <span className="font-mono text-xs text-muted">{a.researchStatus}</span>
              </div>
            ))}
          </div>
        </div>
      )}
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
