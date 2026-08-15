import type { CertaintyType } from '@/types/evidence';
import type { BuyingRole, CallOutcomeType } from '@/types/product';

// See DESIGN.md "Certainty & Role Badges" — fixed colors, never
// remapped per page. Certainty must never be visually ambiguous with
// a role — an inference presented as fact is a product-trust failure.

const CERTAINTY_STYLES: Record<CertaintyType, string> = {
  KNOWN: 'bg-surface-strong text-ink',
  INFERRED: 'bg-transparent text-body border border-hairline-strong',
  SUGGESTED: 'bg-transparent text-muted border border-dashed border-hairline',
};

export function CertaintyBadge({ certainty }: { certainty: CertaintyType }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] ${CERTAINTY_STYLES[certainty]}`}
    >
      {certainty}
    </span>
  );
}

const ROLE_LABELS: Record<BuyingRole, string> = {
  decision_maker: 'Decision Maker',
  economic_buyer: 'Economic Buyer',
  champion: 'Champion',
  influencer: 'Influencer',
  technical_buyer: 'Technical Buyer',
  blocker: 'Blocker',
  unknown: 'Unknown',
};

export function RoleBadge({ role }: { role: BuyingRole }) {
  return (
    <span className="inline-flex items-center rounded-full bg-surface-strong px-2.5 py-0.5 text-[11.5px] font-medium text-ink">
      {ROLE_LABELS[role]}
    </span>
  );
}

const OUTCOME_LABELS: Record<CallOutcomeType, string> = {
  no_answer: 'No Answer',
  voicemail: 'Voicemail Left',
  gatekeeper: 'Gatekeeper',
  general_staff: 'General Staff',
  influencer: 'Influencer',
  champion: 'Champion',
  decision_maker: 'Decision Maker',
  other_executive: 'Other Executive',
  wrong_contact: 'Wrong Contact',
  not_interested: 'Not Interested',
  connected: 'Connected',
  meeting_booked: 'Meeting Booked',
  follow_up_required: 'Follow-Up Required',
};

const POSITIVE_OUTCOMES: CallOutcomeType[] = ['meeting_booked', 'connected'];
const NEUTRAL_OUTCOMES: CallOutcomeType[] = ['not_interested', 'wrong_contact'];

export function OutcomeBadge({ outcome }: { outcome: CallOutcomeType }) {
  const style = POSITIVE_OUTCOMES.includes(outcome)
    ? 'bg-surface-strong text-semantic-success'
    : NEUTRAL_OUTCOMES.includes(outcome)
      ? 'bg-surface-strong text-body'
      : 'bg-surface-strong text-ink';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${style}`}>
      {OUTCOME_LABELS[outcome]}
    </span>
  );
}
