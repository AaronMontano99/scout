/**
 * Billing — architected for Stripe, not fully wired in Phase 2. See
 * docs/PILOT.md, docs/runbooks/BILLING.md, ARCHITECTURE.md §Billing.
 * Plan pricing (docs/PILOT.md's Starter/Team/Growth placeholders) is
 * intentionally NOT hardcoded into types or business logic here — see
 * COST_MODEL.md's deferred unit-economics note. Business logic should
 * key off `Subscription.status`/`planId`, never off a hardcoded price.
 */

export type SubscriptionStatus = 'pilot' | 'trial' | 'active' | 'past_due' | 'canceled';

export interface Plan {
  id: string;
  name: string;
  seatLimit: number | null; // null = unlimited
  monthlyResearchBudgetCents: number | null; // see COST_MODEL.md — per-org research budget
}

export interface Subscription {
  organizationId: string;
  stripeCustomerId: string | null; // null until first real billing event
  stripeSubscriptionId: string | null;
  planId: string;
  status: SubscriptionStatus;
  seats: number;
  currentPeriodEnd: string | null;
}

export interface BillingProvider {
  createCustomer(organizationId: string, email: string): Promise<{ stripeCustomerId: string }>;
  createSubscription(organizationId: string, planId: string): Promise<Subscription>;
  cancelSubscription(organizationId: string): Promise<void>;
  getSubscription(organizationId: string): Promise<Subscription | null>;
  /**
   * Verifies a webhook signature and returns the parsed event — see
   * docs/INTEGRATIONS.md §Webhook security. Never trust an unverified
   * webhook payload.
   */
  verifyWebhook(rawBody: string, signatureHeader: string): Promise<BillingWebhookEvent>;
}

export interface BillingWebhookEvent {
  type:
    | 'subscription.created'
    | 'subscription.updated'
    | 'subscription.canceled'
    | 'payment.failed'
    | 'payment.succeeded';
  organizationId: string;
  raw: Record<string, unknown>;
}

// What happens to product access at each status transition (e.g. does
// access degrade immediately on `past_due`, or after a grace period)
// is a real product decision, not an implementation detail — not yet
// decided, see docs/runbooks/BILLING.md. This interface deliberately
// doesn't encode an answer.
