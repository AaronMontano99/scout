/**
 * Demo Mode fixture data — see docs/DEMO.md and product spec §49/§94.
 * Entirely fictional. No real company, person, or customer data. This
 * is what the founder shows in a demo before any live research
 * provider is connected — see docs/RESEARCH_ARCHITECTURE.md for what
 * real research would eventually replace this with.
 *
 * Covers the required demo scenarios: messy + clean lists, ambiguous
 * match, prospect/customer/former-customer, known/suggested
 * stakeholders, stale contact, current news + no news, competitor/
 * incumbent memory, historical notes, post-call update with CRM
 * writeback simulation, meeting booked, selling situation, low-data
 * company, seller style personalization, list progress, analytics.
 */
import type {
  Account,
  AccountContactRelationship,
  AccountScore,
  CallOutcome,
  Contact,
  KnowledgeItem,
  PostCallNote,
  ResearchFinding,
  SellerStyleProfile,
  SellingSituation,
  SellingSituationDefinition,
  TargetList,
  TargetListItem,
  AnalyticsEvent,
} from '@/types/product';

export const DEMO_ORG_ID = 'demo-org-bay-sentinel';
export const DEMO_MEMBERSHIP_ID = 'demo-membership-jordan';

export const DEMO_ORGANIZATION = {
  id: DEMO_ORG_ID,
  name: 'Bay Sentinel Security',
  industry: 'Commercial Security',
};

export const DEMO_REP = {
  membershipId: DEMO_MEMBERSHIP_ID,
  fullName: 'Jordan Reyes',
  role: 'REP' as const,
};

// --- Seller Style (distinct memory category — see SELLER_STYLE.md) ----

export const DEMO_SELLER_STYLE: SellerStyleProfile = {
  id: 'demo-style-jordan',
  organizationId: DEMO_ORG_ID,
  membershipId: DEMO_MEMBERSHIP_ID,
  sampleEmails: [
    "Hey {{firstName}} — tried you a couple times this week, figured I'd try email instead. We work with a few other builders in the area on camera + access control, and given {{company}} is growing I thought it was worth a quick conversation. 15 min this week or next?",
  ],
  sampleScripts: [
    "Hey, this is Jordan over at Bay Sentinel — I know this is a cold call so I'll keep it quick. We do security systems for construction and commercial sites in the Bay Area, and I saw {{company}} {{trigger}}. Curious if that's created any gaps worth a quick conversation about.",
  ],
  sampleVoicemails: [
    "Hey {{firstName}}, Jordan Reyes with Bay Sentinel Security, my number's {{phone}} — no worries if now's not the time, just wanted to put myself on your radar given {{trigger}}. Talk soon.",
  ],
  toneNotes:
    'Direct, conversational, no corporate buzzwords. Short sentences. Never says "reach out" or "circle back." Always references something specific to the company, never generic.',
  updatedAt: '2026-08-01T00:00:00Z',
};

// --- Selling Situation Definition (org-configurable, not hardcoded MEDDPICC) ---

export const DEMO_SELLING_SITUATION_DEFINITION: SellingSituationDefinition = {
  id: 'demo-ssdef-1',
  organizationId: DEMO_ORG_ID,
  name: 'Real Deal Check',
  criteria: 'Is it a deal? Is it a deal I can get? Is it a deal I can get this month?',
  isDefault: true,
};

// --- Target Lists -------------------------------------------------------

export const DEMO_TARGET_LISTS: TargetList[] = [
  {
    id: 'demo-list-construction',
    organizationId: DEMO_ORG_ID,
    name: 'Construction — Bay Area',
    description: 'General commercial construction prospecting, Bay Area territory.',
    ownerMembershipId: DEMO_MEMBERSHIP_ID,
    researchFocus: null,
    vertical: 'Construction',
    geography: 'Bay Area, CA',
    status: 'active',
    createdAt: '2026-07-20T00:00:00Z',
    lastWorkedAt: '2026-08-07T00:00:00Z',
  },
  {
    id: 'demo-list-landscaping',
    organizationId: DEMO_ORG_ID,
    name: 'Landscaping — Bay Area',
    description: 'Uploaded from an old NAICS export — messier data than Construction.',
    ownerMembershipId: DEMO_MEMBERSHIP_ID,
    researchFocus: null,
    vertical: 'Landscaping',
    geography: 'Bay Area, CA',
    status: 'active',
    createdAt: '2026-08-04T00:00:00Z',
    lastWorkedAt: '2026-08-05T00:00:00Z',
  },
  {
    id: 'demo-list-stress-test',
    organizationId: DEMO_ORG_ID,
    name: 'Data Stress Test — Internal QA',
    // Explicitly labeled, not a real prospecting list — see
    // docs/PHASE_3_5_STATUS.md. No live research provider has ever run
    // (Phase 3.5 never happened), so real messy output doesn't exist to
    // test against. This list substitutes deliberately extreme fixture
    // data (10 sources, 6 stakeholders, zero data, a failed research
    // run, long names/titles) to verify the UI holds up under edge
    // cases the polished narrative demo lists don't exercise.
    description: 'Deliberately messy fixture data for UI robustness testing — not a real prospecting list.',
    ownerMembershipId: DEMO_MEMBERSHIP_ID,
    researchFocus: null,
    vertical: 'Mixed',
    geography: 'N/A',
    status: 'active',
    createdAt: '2026-08-08T00:00:00Z',
    lastWorkedAt: null,
  },
];

// --- Accounts ------------------------------------------------------------
// Construction list

export const ACC_RIDGELINE = 'demo-acc-ridgeline';
export const ACC_ANDERSON = 'demo-acc-anderson';
export const ACC_PACIFIC_RIM = 'demo-acc-pacific-rim';
export const ACC_DELGADO = 'demo-acc-delgado';
export const ACC_SUMMIT = 'demo-acc-summit';
export const ACC_BAYVIEW = 'demo-acc-bayview';
export const ACC_NORTHGATE = 'demo-acc-northgate';
export const ACC_COASTAL = 'demo-acc-coastal';
export const ACC_IRONCLAD = 'demo-acc-ironclad';
export const ACC_VANTAGE = 'demo-acc-vantage';
// Landscaping list
export const ACC_EVERGREEN = 'demo-acc-evergreen';
export const ACC_SUNRISE = 'demo-acc-sunrise';
export const ACC_GREENSCAPE = 'demo-acc-greenscape';
export const ACC_TURF_MASTERS = 'demo-acc-turfmasters';
// Stress-test accounts — see "Data Stress Test — Internal QA" list above.
export const ACC_STRESS_LONG_NAME = 'demo-acc-stress-long-name';
export const ACC_STRESS_MANY_PEOPLE = 'demo-acc-stress-many-people';
export const ACC_STRESS_ZERO_DATA = 'demo-acc-stress-zero-data';
export const ACC_STRESS_FAILED = 'demo-acc-stress-failed';

function acc(overrides: Partial<Account> & { id: string; name: string }): Account {
  return {
    organizationId: DEMO_ORG_ID,
    normalizedName: overrides.name.toLowerCase(),
    primaryDomain: null,
    industry: null,
    employeeCountRange: null,
    address: null,
    territoryId: null,
    ownerMembershipId: DEMO_MEMBERSHIP_ID,
    relationshipStatus: 'prospect',
    status: 'active',
    researchStatus: 'ready',
    identityStatus: 'confirmed',
    identityConfirmedAt: '2026-07-20T00:00:00Z',
    createdAt: '2026-07-20T00:00:00Z',
    updatedAt: '2026-08-07T00:00:00Z',
    ...overrides,
  };
}

export const DEMO_ACCOUNTS: Account[] = [
  acc({
    id: ACC_RIDGELINE,
    name: 'Ridgeline Builders',
    primaryDomain: 'ridgelinebuilders.com',
    industry: 'Commercial Construction',
    employeeCountRange: '50-200',
    relationshipStatus: 'prospect',
  }),
  acc({
    id: ACC_ANDERSON,
    name: 'Anderson & Sons Construction',
    primaryDomain: 'andersonsons.com',
    industry: 'Commercial Construction',
    employeeCountRange: '20-50',
  }),
  acc({
    id: ACC_PACIFIC_RIM,
    name: 'Pacific Rim Contractors',
    primaryDomain: 'pacificrimcontractors.com',
    industry: 'Commercial Construction',
    employeeCountRange: '100-250',
    relationshipStatus: 'current_customer',
  }),
  acc({
    id: ACC_DELGADO,
    name: 'Delgado Construction Group',
    primaryDomain: 'delgadocg.com',
    industry: 'Commercial Construction',
    employeeCountRange: '50-100',
    relationshipStatus: 'former_customer',
  }),
  acc({
    id: ACC_SUMMIT,
    name: 'Summit Structural',
    primaryDomain: 'summitstructural.com',
    industry: 'Commercial Construction',
    employeeCountRange: '20-50',
    identityStatus: 'review_recommended', // ambiguous import match — see product spec §15
    researchStatus: 'needs_review',
  }),
  acc({
    id: ACC_BAYVIEW,
    name: 'Bayview Development',
    primaryDomain: null,
    industry: 'Commercial Construction',
    employeeCountRange: null,
    researchStatus: 'limited_data', // no website, no news — see product spec §18, §71
  }),
  acc({
    id: ACC_NORTHGATE,
    name: 'Northgate Builders',
    primaryDomain: 'northgatebuilders.com',
    industry: 'Commercial Construction',
    employeeCountRange: '20-50',
  }),
  acc({
    id: ACC_COASTAL,
    name: 'Coastal Framing Co',
    primaryDomain: 'coastalframing.com',
    industry: 'Commercial Construction',
    employeeCountRange: '10-20',
  }),
  acc({
    id: ACC_IRONCLAD,
    name: 'Ironclad Construction',
    primaryDomain: 'ironcladconstruction.com',
    industry: 'Commercial Construction',
    employeeCountRange: '50-100',
  }),
  acc({
    id: ACC_VANTAGE,
    name: 'Vantage Point Builders',
    primaryDomain: 'vantagepointbuilders.com',
    industry: 'Commercial Construction',
    employeeCountRange: '20-50',
    researchStatus: 'processing', // being actively worked, conflicting CFO evidence not yet fully resolved
  }),
  acc({
    id: ACC_EVERGREEN,
    name: 'Evergreen Grounds Co',
    primaryDomain: 'evergreengrounds.com',
    industry: 'Commercial Landscaping',
    employeeCountRange: '10-20',
    researchStatus: 'queued', // not yet processed — see product spec §5-6
  }),
  acc({
    id: ACC_SUNRISE,
    name: 'Sunrise Landscape & Design',
    primaryDomain: null,
    industry: 'Commercial Landscaping',
    employeeCountRange: null,
    researchStatus: 'limited_data',
  }),
  acc({
    id: ACC_GREENSCAPE,
    name: 'GreenScape Bay Area',
    primaryDomain: 'greenscapebayarea.com',
    industry: 'Commercial Landscaping',
    employeeCountRange: '20-50',
    identityStatus: 'lower_confidence', // shortened import name, moderate-confidence match
    researchStatus: 'needs_review',
  }),
  acc({
    id: ACC_TURF_MASTERS,
    name: 'Turf Masters Inc',
    primaryDomain: 'turfmastersinc.com',
    industry: 'Commercial Landscaping',
    employeeCountRange: '10-20',
  }),
  // --- Stress-test accounts (demo-list-stress-test) — see DEMO.md ---
  acc({
    id: ACC_STRESS_LONG_NAME,
    name: 'Silicon Valley Advanced Manufacturing, Integration & Logistics Solutions Group LLC',
    primaryDomain: 'svamils-group.example.com',
    industry: 'Advanced Manufacturing',
    employeeCountRange: '250-500',
  }),
  acc({
    id: ACC_STRESS_MANY_PEOPLE,
    name: 'Meridian Industrial Partners',
    primaryDomain: 'meridianindustrial.example.com',
    industry: 'Industrial Services',
    employeeCountRange: '100-250',
  }),
  acc({
    id: ACC_STRESS_ZERO_DATA,
    name: 'Unresearched Holdings Inc',
    primaryDomain: null,
    industry: null,
    employeeCountRange: null,
    researchStatus: 'queued',
  }),
  acc({
    id: ACC_STRESS_FAILED,
    name: 'Provider Failure Test Co',
    primaryDomain: 'providerfailuretest.example.com',
    industry: 'Unknown',
    employeeCountRange: null,
    researchStatus: 'failed',
  }),
];

// --- Target List Items ----------------------------------------------------

function tli(
  id: string,
  targetListId: string,
  accountId: string,
  status: TargetListItem['status'],
  pinned = false
): TargetListItem {
  return {
    id,
    targetListId,
    accountId,
    status,
    pinned,
    workedAt: status === 'worked' ? '2026-08-07T00:00:00Z' : null,
    addedAt: '2026-07-20T00:00:00Z',
  };
}

export const DEMO_TARGET_LIST_ITEMS: TargetListItem[] = [
  tli('tli-1', 'demo-list-construction', ACC_RIDGELINE, 'not_started'),
  tli('tli-2', 'demo-list-construction', ACC_ANDERSON, 'not_started'),
  tli('tli-3', 'demo-list-construction', ACC_PACIFIC_RIM, 'not_started'),
  tli('tli-4', 'demo-list-construction', ACC_DELGADO, 'not_started'),
  tli('tli-5', 'demo-list-construction', ACC_SUMMIT, 'not_started'),
  tli('tli-6', 'demo-list-construction', ACC_BAYVIEW, 'not_started'),
  tli('tli-7', 'demo-list-construction', ACC_NORTHGATE, 'worked'),
  tli('tli-8', 'demo-list-construction', ACC_COASTAL, 'worked', true),
  tli('tli-9', 'demo-list-construction', ACC_IRONCLAD, 'skipped'),
  tli('tli-10', 'demo-list-construction', ACC_VANTAGE, 'in_progress'),
  tli('tli-11', 'demo-list-landscaping', ACC_EVERGREEN, 'not_started'),
  tli('tli-12', 'demo-list-landscaping', ACC_SUNRISE, 'not_started'),
  tli('tli-13', 'demo-list-landscaping', ACC_GREENSCAPE, 'not_started'),
  tli('tli-14', 'demo-list-landscaping', ACC_TURF_MASTERS, 'worked'),
  tli('tli-15', 'demo-list-stress-test', ACC_STRESS_LONG_NAME, 'not_started'),
  tli('tli-16', 'demo-list-stress-test', ACC_STRESS_MANY_PEOPLE, 'not_started'),
  tli('tli-17', 'demo-list-stress-test', ACC_STRESS_ZERO_DATA, 'not_started'),
  tli('tli-18', 'demo-list-stress-test', ACC_STRESS_FAILED, 'not_started'),
];

// --- Contacts + buying-role relationships --------------------------------

export const DEMO_CONTACTS: Contact[] = [
  {
    id: 'demo-contact-maria',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_RIDGELINE,
    firstName: 'Maria',
    lastName: 'Chen',
    title: 'VP Operations',
    email: null,
    phone: null,
    linkedinUrl: null,
    status: 'active',
    lastVerifiedAt: '2026-08-01T00:00:00Z', // recently confirmed via research pass
  },
  {
    id: 'demo-contact-david',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_RIDGELINE,
    firstName: 'David',
    lastName: 'Okafor',
    title: 'IT Director',
    email: null,
    phone: null,
    linkedinUrl: null,
    status: 'active',
    lastVerifiedAt: null, // never independently verified — inferred only
  },
  {
    id: 'demo-contact-priya',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_ANDERSON,
    firstName: 'Priya',
    lastName: 'Patel',
    title: 'Office Manager',
    email: null,
    phone: null,
    linkedinUrl: null,
    status: 'active',
    lastVerifiedAt: null,
  },
  {
    id: 'demo-contact-tom',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_PACIFIC_RIM,
    firstName: 'Tom',
    lastName: 'Reilly',
    title: 'Facilities Manager',
    email: null,
    phone: null,
    linkedinUrl: null,
    status: 'active',
    lastVerifiedAt: '2026-06-15T00:00:00Z', // existing-customer relationship, verified at last renewal
  },
  {
    id: 'demo-contact-steve',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_NORTHGATE,
    firstName: 'Steve',
    lastName: 'Malone',
    title: 'Operations Manager (as of 2025)',
    email: null,
    phone: null,
    linkedinUrl: null,
    status: 'departed', // stale contact — see call outcome note below
    lastVerifiedAt: '2025-03-10T00:00:00Z', // last verified well over a year ago — clearly stale
  },
  {
    id: 'demo-contact-angela',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_COASTAL,
    firstName: 'Angela',
    lastName: 'Brooks',
    title: 'Owner',
    email: null,
    phone: null,
    linkedinUrl: null,
    status: 'active',
    lastVerifiedAt: '2026-08-07T00:00:00Z', // verified this week via direct call
  },
  // Conflicting-evidence example — product spec §36. Two rows for the
  // same account/role: CRM says John Smith (2022, now superseded),
  // official website says Sarah Lee (2026, current). Neither is
  // deleted — see AccountContactRelationship rows below.
  {
    id: 'demo-contact-john-smith',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_VANTAGE,
    firstName: 'John',
    lastName: 'Smith',
    title: 'CFO (per 2022 CRM note)',
    email: null,
    phone: null,
    linkedinUrl: null,
    status: 'unknown',
    lastVerifiedAt: '2022-09-01T00:00:00Z',
  },
  {
    id: 'demo-contact-sarah-lee',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_VANTAGE,
    firstName: 'Sarah',
    lastName: 'Lee',
    title: 'CFO',
    email: null,
    phone: null,
    linkedinUrl: null,
    status: 'active',
    lastVerifiedAt: '2026-08-06T00:00:00Z',
  },
  // --- Stress-test contacts ---
  // Long title, unknown-ish role — tests title wrapping/overflow.
  {
    id: 'demo-contact-stress-long-title',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_STRESS_LONG_NAME,
    firstName: 'Alexandra',
    lastName: 'Whitfield-Nakamura',
    title: 'Senior Vice President of Global Strategic Operations and Business Development',
    email: null,
    phone: null,
    linkedinUrl: null,
    status: 'active',
    lastVerifiedAt: '2026-08-01T00:00:00Z',
  },
  // Six stakeholders on one account — tests a long People section.
  {
    id: 'demo-contact-stress-1',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_STRESS_MANY_PEOPLE,
    firstName: 'Marcus',
    lastName: 'Chen',
    title: 'CEO',
    email: null,
    phone: null,
    linkedinUrl: null,
    status: 'active',
    lastVerifiedAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'demo-contact-stress-2',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_STRESS_MANY_PEOPLE,
    firstName: 'Denise',
    lastName: 'Okonkwo',
    title: 'CFO',
    email: null,
    phone: null,
    linkedinUrl: null,
    status: 'active',
    lastVerifiedAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'demo-contact-stress-3',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_STRESS_MANY_PEOPLE,
    firstName: 'Ravi',
    lastName: 'Patel',
    title: 'VP Operations',
    email: null,
    phone: null,
    linkedinUrl: null,
    status: 'active',
    lastVerifiedAt: '2026-07-15T00:00:00Z',
  },
  {
    id: 'demo-contact-stress-4',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_STRESS_MANY_PEOPLE,
    firstName: 'Lisa',
    lastName: 'Tran',
    title: 'IT Director',
    email: null,
    phone: null,
    linkedinUrl: null,
    status: 'active',
    lastVerifiedAt: null,
  },
  {
    id: 'demo-contact-stress-5',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_STRESS_MANY_PEOPLE,
    firstName: 'Unknown',
    lastName: 'Title',
    title: null, // unknown/missing title — tests null rendering
    email: null,
    phone: null,
    linkedinUrl: null,
    status: 'unknown',
    lastVerifiedAt: null,
  },
  {
    id: 'demo-contact-stress-6',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_STRESS_MANY_PEOPLE,
    firstName: 'Priya',
    lastName: 'Sharma',
    title: 'Facilities Manager',
    email: null,
    phone: null,
    linkedinUrl: null,
    status: 'active',
    lastVerifiedAt: '2026-06-01T00:00:00Z',
  },
  // ACC_STRESS_ZERO_DATA and ACC_STRESS_FAILED intentionally have zero
  // contacts — the "no people confidently identified" and "research
  // failed" cases.
];

export const DEMO_ACCOUNT_CONTACT_RELATIONSHIPS: AccountContactRelationship[] = [
  {
    id: 'demo-acr-1',
    accountId: ACC_RIDGELINE,
    contactId: 'demo-contact-maria',
    roleHypothesis: 'decision_maker',
    certaintyType: 'KNOWN',
    isCurrent: true,
    validFrom: '2021-11-04T00:00:00Z',
    validUntil: null,
    sourceKnowledgeItemId: 'demo-ki-ridgeline-2021-note',
  },
  {
    id: 'demo-acr-2',
    accountId: ACC_RIDGELINE,
    contactId: 'demo-contact-david',
    roleHypothesis: 'technical_buyer',
    certaintyType: 'INFERRED',
    isCurrent: true,
    validFrom: '2026-08-01T00:00:00Z',
    validUntil: null,
    sourceKnowledgeItemId: null,
  },
  {
    id: 'demo-acr-3',
    accountId: ACC_ANDERSON,
    contactId: 'demo-contact-priya',
    roleHypothesis: 'champion',
    certaintyType: 'SUGGESTED',
    isCurrent: true,
    validFrom: '2026-08-01T00:00:00Z',
    validUntil: null,
    sourceKnowledgeItemId: null,
  },
  {
    id: 'demo-acr-4',
    accountId: ACC_PACIFIC_RIM,
    contactId: 'demo-contact-tom',
    roleHypothesis: 'decision_maker',
    certaintyType: 'KNOWN',
    isCurrent: true,
    validFrom: '2022-06-01T00:00:00Z',
    validUntil: null,
    sourceKnowledgeItemId: null,
  },
  {
    id: 'demo-acr-5',
    accountId: ACC_NORTHGATE,
    contactId: 'demo-contact-steve',
    roleHypothesis: 'decision_maker',
    certaintyType: 'KNOWN',
    isCurrent: false, // superseded — see call outcome, Steve left the company
    validFrom: '2023-01-01T00:00:00Z',
    validUntil: '2026-08-06T00:00:00Z',
    sourceKnowledgeItemId: null,
  },
  {
    id: 'demo-acr-6',
    accountId: ACC_COASTAL,
    contactId: 'demo-contact-angela',
    roleHypothesis: 'economic_buyer',
    certaintyType: 'KNOWN',
    isCurrent: true,
    validFrom: '2026-07-01T00:00:00Z',
    validUntil: null,
    sourceKnowledgeItemId: null,
  },
  // Conflicting-evidence example — product spec §36. Both rows persist;
  // neither is deleted. See src/domain/source-quality.ts resolveConflict,
  // which is what would decide this in a live pipeline (a 2026 official
  // source outranks a 2022 CRM note for a time-varying fact like "who
  // is CFO now").
  {
    id: 'demo-acr-7',
    accountId: ACC_VANTAGE,
    contactId: 'demo-contact-john-smith',
    roleHypothesis: 'economic_buyer',
    certaintyType: 'KNOWN',
    isCurrent: false,
    validFrom: '2022-09-01T00:00:00Z',
    validUntil: '2026-07-01T00:00:00Z',
    sourceKnowledgeItemId: 'demo-ki-vantage-cfo-2022',
  },
  {
    id: 'demo-acr-8',
    accountId: ACC_VANTAGE,
    contactId: 'demo-contact-sarah-lee',
    roleHypothesis: 'economic_buyer',
    certaintyType: 'KNOWN',
    isCurrent: true,
    validFrom: '2026-07-01T00:00:00Z',
    validUntil: null,
    sourceKnowledgeItemId: null,
  },
  // --- Stress-test relationships ---
  {
    id: 'demo-acr-stress-long-title',
    accountId: ACC_STRESS_LONG_NAME,
    contactId: 'demo-contact-stress-long-title',
    roleHypothesis: 'decision_maker',
    certaintyType: 'INFERRED',
    isCurrent: true,
    validFrom: '2026-08-01T00:00:00Z',
    validUntil: null,
    sourceKnowledgeItemId: null,
  },
  {
    id: 'demo-acr-stress-1',
    accountId: ACC_STRESS_MANY_PEOPLE,
    contactId: 'demo-contact-stress-1',
    roleHypothesis: 'decision_maker',
    certaintyType: 'INFERRED',
    isCurrent: true,
    validFrom: '2026-08-01T00:00:00Z',
    validUntil: null,
    sourceKnowledgeItemId: null,
  },
  {
    id: 'demo-acr-stress-2',
    accountId: ACC_STRESS_MANY_PEOPLE,
    contactId: 'demo-contact-stress-2',
    roleHypothesis: 'economic_buyer',
    certaintyType: 'KNOWN',
    isCurrent: true,
    validFrom: '2026-08-01T00:00:00Z',
    validUntil: null,
    sourceKnowledgeItemId: null,
  },
  {
    id: 'demo-acr-stress-3',
    accountId: ACC_STRESS_MANY_PEOPLE,
    contactId: 'demo-contact-stress-3',
    roleHypothesis: 'influencer',
    certaintyType: 'INFERRED',
    isCurrent: true,
    validFrom: '2026-07-15T00:00:00Z',
    validUntil: null,
    sourceKnowledgeItemId: null,
  },
  {
    id: 'demo-acr-stress-4',
    accountId: ACC_STRESS_MANY_PEOPLE,
    contactId: 'demo-contact-stress-4',
    roleHypothesis: 'technical_buyer',
    certaintyType: 'SUGGESTED',
    isCurrent: true,
    validFrom: '2026-08-01T00:00:00Z',
    validUntil: null,
    sourceKnowledgeItemId: null,
  },
  {
    id: 'demo-acr-stress-5',
    accountId: ACC_STRESS_MANY_PEOPLE,
    contactId: 'demo-contact-stress-5',
    roleHypothesis: 'unknown',
    certaintyType: 'SUGGESTED',
    isCurrent: true,
    validFrom: '2026-08-01T00:00:00Z',
    validUntil: null,
    sourceKnowledgeItemId: null,
  },
  {
    id: 'demo-acr-stress-6',
    accountId: ACC_STRESS_MANY_PEOPLE,
    contactId: 'demo-contact-stress-6',
    roleHypothesis: 'champion',
    certaintyType: 'SUGGESTED',
    isCurrent: true,
    validFrom: '2026-06-01T00:00:00Z',
    validUntil: null,
    sourceKnowledgeItemId: null,
  },
];

// --- Knowledge Items (institutional memory) -------------------------------

export const DEMO_KNOWLEDGE_ITEMS: KnowledgeItem[] = [
  {
    id: 'demo-ki-ridgeline-2021-note',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_RIDGELINE,
    contactId: 'demo-contact-maria',
    type: 'decision_maker',
    content:
      'Maria Chen (VP Operations) confirmed she owns security/facilities vendor decisions above $15K. Prior rep (no longer with company) spoke with her directly in 2021.',
    structuredValue: { role: 'decision_maker', threshold_usd: 15000 },
    origin: 'crm_synced',
    sourceId: null,
    sourceReference: 'CRM note, imported from legacy system',
    sourceUrl: null,
    observedAt: '2021-11-04T00:00:00Z',
    confidence: 0.85,
    certaintyType: 'KNOWN',
    verificationStatus: 'current',
    createdAt: '2021-11-04T00:00:00Z',
  },
  {
    id: 'demo-ki-ridgeline-contract',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_RIDGELINE,
    contactId: null,
    type: 'contract_timing',
    content: 'Current monitoring contract with SecureGuard Systems reported to expire around October 2026.',
    structuredValue: { incumbent_vendor: 'SecureGuard Systems', contract_end_estimate: '2026-10-01' },
    origin: 'imported',
    sourceId: null,
    sourceReference: 'Legacy CRM field: Contract End',
    sourceUrl: null,
    observedAt: '2024-02-01T00:00:00Z',
    confidence: 0.6,
    certaintyType: 'INFERRED',
    verificationStatus: 'current',
    createdAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'demo-ki-delgado-incumbent',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_DELGADO,
    contactId: null,
    type: 'incumbent_vendor',
    content:
      'Delgado switched to SecureGuard Systems in 2024 after citing slow response times on service calls with us.',
    structuredValue: { competitor_name: 'SecureGuard Systems', reason: 'slow_service_response' },
    origin: 'crm_synced',
    sourceId: null,
    sourceReference: 'CRM churn note',
    sourceUrl: null,
    observedAt: '2024-05-12T00:00:00Z',
    confidence: 0.9,
    certaintyType: 'KNOWN',
    verificationStatus: 'current',
    createdAt: '2024-05-12T00:00:00Z',
  },
  // Competitor/incumbent memory pattern — see DATA_MODEL.md "Competitor
  // memory is a query, not a table." These three KnowledgeItems, taken
  // together across accounts, are what that aggregation query surfaces.
  {
    id: 'demo-ki-northgate-incumbent',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_NORTHGATE,
    contactId: null,
    type: 'incumbent_vendor',
    content: 'Northgate mentioned frustration with SecureGuard Systems response times during a 2025 call.',
    structuredValue: { competitor_name: 'SecureGuard Systems', reason: 'slow_service_response' },
    origin: 'user_entered',
    sourceId: null,
    sourceReference: 'Rep call note',
    sourceUrl: null,
    observedAt: '2025-03-10T00:00:00Z',
    confidence: 0.7,
    certaintyType: 'INFERRED',
    verificationStatus: 'current',
    createdAt: '2025-03-10T00:00:00Z',
  },
  {
    id: 'demo-ki-ironclad-incumbent',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_IRONCLAD,
    contactId: null,
    type: 'incumbent_vendor',
    content: 'Ironclad uses SecureGuard Systems, no reported issues, not interested in switching (2026-08).',
    structuredValue: { competitor_name: 'SecureGuard Systems', reason: 'no_issue_reported' },
    origin: 'user_entered',
    sourceId: null,
    sourceReference: 'Rep call note',
    sourceUrl: null,
    observedAt: '2026-08-01T00:00:00Z',
    confidence: 0.8,
    certaintyType: 'KNOWN',
    verificationStatus: 'current',
    createdAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'demo-ki-pacific-rim-existing',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_PACIFIC_RIM,
    contactId: 'demo-contact-tom',
    type: 'relationship',
    content: 'Existing customer since 2022 — currently on our alarm monitoring plan only, not access control.',
    structuredValue: { products: ['alarm_monitoring'] },
    origin: 'crm_synced',
    sourceId: null,
    sourceReference: 'CRM account record',
    sourceUrl: null,
    observedAt: '2022-06-01T00:00:00Z',
    confidence: 0.95,
    certaintyType: 'KNOWN',
    verificationStatus: 'current',
    createdAt: '2022-06-01T00:00:00Z',
  },
  // Conflicting-evidence example (product spec §36) — see the two
  // demo-acr-7/8 relationships above and demo-rf-vantage-cfo-2026
  // below. This item is superseded but never deleted.
  {
    id: 'demo-ki-vantage-cfo-2022',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_VANTAGE,
    contactId: 'demo-contact-john-smith',
    type: 'decision_maker',
    content: 'CRM note (2022): John Smith listed as CFO, involved in vendor decisions above $10K.',
    structuredValue: { role: 'economic_buyer', threshold_usd: 10000 },
    origin: 'crm_synced',
    sourceId: null,
    sourceReference: 'CRM note, imported from legacy system',
    sourceUrl: null,
    observedAt: '2022-09-01T00:00:00Z',
    confidence: 0.85,
    certaintyType: 'KNOWN',
    verificationStatus: 'superseded',
    createdAt: '2022-09-01T00:00:00Z',
  },
];

// --- Research Findings (external evidence, always sourced) ---------------

export const DEMO_RESEARCH_FINDINGS: ResearchFinding[] = [
  {
    id: 'demo-rf-ridgeline-expansion',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_RIDGELINE,
    sourceId: null,
    sourceName: 'Ridgeline Builders — company newsroom',
    findingType: 'expansion',
    content: 'Ridgeline Builders announced a new San Jose regional office opening Q3 2026.',
    url: 'https://example.com/ridgeline-newsroom/san-jose-office',
    retrievedAt: '2026-08-06T00:00:00Z',
    relevantDate: '2026-07-15',
    confidence: 0.9,
    certaintyType: 'KNOWN',
  },
  {
    id: 'demo-rf-anderson-nothing',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_ANDERSON,
    sourceId: null,
    sourceName: 'General web search',
    findingType: 'no_significant_news',
    content: 'No meaningful recent news located in the last 12 months.',
    url: null,
    retrievedAt: '2026-08-05T00:00:00Z',
    relevantDate: null,
    confidence: 1,
    certaintyType: 'KNOWN',
  },
  {
    id: 'demo-rf-bayview-nothing',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_BAYVIEW,
    sourceId: null,
    sourceName: 'General web search',
    findingType: 'no_web_presence',
    content: 'Website unavailable. No meaningful recent news located. Limited public information found.',
    url: null,
    retrievedAt: '2026-08-05T00:00:00Z',
    relevantDate: null,
    confidence: 1,
    certaintyType: 'KNOWN',
  },
  {
    id: 'demo-rf-coastal-hiring',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_COASTAL,
    sourceId: null,
    sourceName: 'Coastal Framing Co — job board posting',
    findingType: 'hiring',
    content: 'Coastal Framing Co posted 3 new site-supervisor roles in the last 30 days, suggesting active growth.',
    url: 'https://example.com/jobs/coastal-framing-co',
    retrievedAt: '2026-08-03T00:00:00Z',
    relevantDate: '2026-07-20',
    confidence: 0.8,
    certaintyType: 'KNOWN',
  },
  // Conflicting-evidence example continued — see demo-ki-vantage-cfo-2022
  // above and demo-acr-7/8. A tier-2 official source (2026) outranks a
  // tier-1 CRM note (2022) for this time-varying fact — see
  // src/domain/source-quality.ts resolveConflict.
  {
    id: 'demo-rf-vantage-cfo-2026',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_VANTAGE,
    sourceId: null,
    sourceName: 'Vantage Point Builders — leadership page',
    findingType: 'leadership_change',
    content: 'Official website (checked 2026-08-06) lists Sarah Lee as Chief Financial Officer.',
    url: 'https://example.com/vantagepointbuilders/leadership',
    retrievedAt: '2026-08-06T00:00:00Z',
    relevantDate: '2026-07-01',
    confidence: 0.9,
    certaintyType: 'KNOWN',
  },
  // --- Stress test: 10 sources on one account (product spec §12) ---
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `demo-rf-stress-${i + 1}`,
    organizationId: DEMO_ORG_ID,
    accountId: ACC_STRESS_LONG_NAME,
    sourceId: null,
    sourceName: `Trade publication ${i + 1}`,
    findingType: i === 0 ? 'expansion' : 'other',
    content:
      i === 0
        ? 'Announced a new integration facility as part of a multi-year capacity expansion.'
        : `Secondary coverage of the same expansion announcement, outlet ${i + 1} of 10 — see deduplication note in SOURCE_MODEL.md.`,
    url: `https://example.com/stress-test/source-${i + 1}`,
    retrievedAt: '2026-08-06T00:00:00Z',
    relevantDate: '2026-07-15',
    confidence: i === 0 ? 0.9 : 0.6,
    certaintyType: i === 0 ? ('KNOWN' as const) : ('INFERRED' as const),
  })),
  // ACC_STRESS_ZERO_DATA and ACC_STRESS_FAILED intentionally have zero
  // findings.
];

// --- Account Scores --------------------------------------------------------

function scoreComponents(icp: number, timing: number, relationship: number, signals: number, historical: number, confidence: number) {
  return [
    { componentType: 'icp_fit' as const, points: icp, maxPoints: 20, evidenceRefs: [] },
    { componentType: 'timing' as const, points: timing, maxPoints: 20, evidenceRefs: [] },
    { componentType: 'relationship' as const, points: relationship, maxPoints: 20, evidenceRefs: [] },
    { componentType: 'signal_strength' as const, points: signals, maxPoints: 20, evidenceRefs: [] },
    { componentType: 'historical_context' as const, points: historical, maxPoints: 15, evidenceRefs: [] },
    { componentType: 'data_confidence' as const, points: confidence, maxPoints: 5, evidenceRefs: [] },
  ];
}

export const DEMO_ACCOUNT_SCORES: AccountScore[] = [
  {
    id: 'demo-score-ridgeline',
    accountId: ACC_RIDGELINE,
    computedAt: '2026-08-07T00:00:00Z',
    components: scoreComponents(18, 18, 16, 15, 12, 5),
    totalScore: 84,
  },
  {
    id: 'demo-score-anderson',
    accountId: ACC_ANDERSON,
    computedAt: '2026-08-07T00:00:00Z',
    components: scoreComponents(15, 8, 10, 3, 5, 4),
    totalScore: 45,
  },
  {
    id: 'demo-score-bayview',
    accountId: ACC_BAYVIEW,
    computedAt: '2026-08-07T00:00:00Z',
    components: scoreComponents(10, 5, 0, 0, 0, 1),
    totalScore: 16,
  },
  {
    id: 'demo-score-coastal',
    accountId: ACC_COASTAL,
    computedAt: '2026-08-07T00:00:00Z',
    components: scoreComponents(17, 16, 14, 16, 8, 5),
    totalScore: 76,
  },
  {
    id: 'demo-score-vantage',
    accountId: ACC_VANTAGE,
    computedAt: '2026-08-07T00:00:00Z',
    components: scoreComponents(14, 10, 5, 6, 4, 4),
    totalScore: 43,
  },
];

// --- Call Outcomes ----------------------------------------------------------

export const DEMO_CALL_OUTCOMES: CallOutcome[] = [
  {
    id: 'demo-outcome-northgate',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_NORTHGATE,
    targetListItemId: 'tli-7',
    contactId: null,
    membershipId: DEMO_MEMBERSHIP_ID,
    outcomeType: 'gatekeeper',
    contactRoleObserved: 'Linda at reception — said Steve Malone left the company in June; Mike now handles ops.',
    occurredAt: '2026-08-06T15:20:00Z',
  },
  {
    id: 'demo-outcome-coastal-meeting',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_COASTAL,
    targetListItemId: 'tli-8',
    contactId: 'demo-contact-angela',
    membershipId: DEMO_MEMBERSHIP_ID,
    outcomeType: 'meeting_booked',
    contactRoleObserved: 'Angela Brooks (Owner) — connected directly.',
    occurredAt: '2026-08-07T10:05:00Z',
  },
  {
    id: 'demo-outcome-ironclad',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_IRONCLAD,
    targetListItemId: 'tli-9',
    contactId: null,
    membershipId: DEMO_MEMBERSHIP_ID,
    outcomeType: 'not_interested',
    contactRoleObserved: null,
    occurredAt: '2026-08-05T13:40:00Z',
  },
  {
    id: 'demo-outcome-turfmasters',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_TURF_MASTERS,
    targetListItemId: 'tli-14',
    contactId: null,
    membershipId: DEMO_MEMBERSHIP_ID,
    outcomeType: 'connected',
    contactRoleObserved: 'Spoke with owner briefly, asked to follow up next month.',
    occurredAt: '2026-08-05T09:15:00Z',
  },
];

// --- Selling Situations ------------------------------------------------------

export const DEMO_SELLING_SITUATIONS: SellingSituation[] = [
  {
    id: 'demo-ss-coastal',
    organizationId: DEMO_ORG_ID,
    accountId: ACC_COASTAL,
    definitionId: DEMO_SELLING_SITUATION_DEFINITION.id,
    createdFromCallOutcomeId: 'demo-outcome-coastal-meeting',
    createdAt: '2026-08-07T10:10:00Z',
    notes: 'Owner engaged directly, hiring/growth signal, meeting booked for next week — real deal, gettable this month.',
  },
];

// --- Post-Call Note (signature experience #4) ---------------------------

export const DEMO_POST_CALL_NOTE: PostCallNote = {
  id: 'demo-pcn-coastal',
  organizationId: DEMO_ORG_ID,
  accountId: ACC_COASTAL,
  callOutcomeId: 'demo-outcome-coastal-meeting',
  membershipId: DEMO_MEMBERSHIP_ID,
  rawInput:
    'talked to angela direct. owner. said theyve been thinking about upgrading cameras on the new sites. meeting weds 2pm. told her id send some info before then',
  cleanNote:
    "Spoke directly with Angela Brooks (Owner). She's been considering a camera upgrade for new job sites. Meeting booked for Wednesday 2:00 PM. Committed to sending overview info before the meeting.",
  proposedAccountUpdates: [
    {
      kind: 'contact_role',
      summary: 'Angela Brooks confirmed as Owner / economic buyer (was already KNOWN — reconfirmed via direct call).',
      certaintyType: 'INFERRED',
    },
    {
      kind: 'knowledge_item',
      summary: 'New signal: actively considering camera upgrade for new job sites.',
      certaintyType: 'SUGGESTED',
    },
  ],
  followUpEmailDraft:
    "Angela — great talking today. Ahead of Wednesday, wanted to send a quick overview of what we typically do for multi-site camera upgrades on active job sites (mobile-friendly setup, works even before permanent power's in). Happy to tailor it once I see the sites you're thinking about. See you at 2.",
  approvedAt: '2026-08-07T10:30:00Z',
  crmWriteStatus: 'written', // simulated — see docs/CRM_WRITEBACK.md, no live CRM connected
};

// --- Analytics Events (event-sourced funnel — see PROSPECTING_ANALYTICS.md) ---

function evt(
  id: string,
  eventType: AnalyticsEvent['eventType'],
  accountId: string | null,
  targetListId: string | null,
  occurredAt: string
): AnalyticsEvent {
  return {
    id,
    organizationId: DEMO_ORG_ID,
    eventType,
    accountId,
    targetListId,
    contactId: null,
    membershipId: DEMO_MEMBERSHIP_ID,
    occurredAt,
  };
}

export const DEMO_ANALYTICS_EVENTS: AnalyticsEvent[] = [
  evt('ae-1', 'call_attempted', ACC_NORTHGATE, 'demo-list-construction', '2026-08-06T15:20:00Z'),
  evt('ae-2', 'call_attempted', ACC_COASTAL, 'demo-list-construction', '2026-08-07T10:05:00Z'),
  evt('ae-3', 'conversation', ACC_COASTAL, 'demo-list-construction', '2026-08-07T10:05:00Z'),
  evt('ae-4', 'target_conversation', ACC_COASTAL, 'demo-list-construction', '2026-08-07T10:05:00Z'),
  evt('ae-5', 'meeting_booked', ACC_COASTAL, 'demo-list-construction', '2026-08-07T10:08:00Z'),
  evt('ae-6', 'selling_situation_created', ACC_COASTAL, 'demo-list-construction', '2026-08-07T10:10:00Z'),
  evt('ae-7', 'email_drafted', ACC_COASTAL, 'demo-list-construction', '2026-08-07T10:28:00Z'),
  evt('ae-8', 'email_sent', ACC_COASTAL, 'demo-list-construction', '2026-08-07T10:31:00Z'),
  evt('ae-9', 'crm_note_created', ACC_COASTAL, 'demo-list-construction', '2026-08-07T10:31:00Z'),
  evt('ae-10', 'call_attempted', ACC_IRONCLAD, 'demo-list-construction', '2026-08-05T13:40:00Z'),
  evt('ae-11', 'conversation', ACC_IRONCLAD, 'demo-list-construction', '2026-08-05T13:40:00Z'),
  evt('ae-12', 'call_attempted', ACC_TURF_MASTERS, 'demo-list-landscaping', '2026-08-05T09:15:00Z'),
  evt('ae-13', 'conversation', ACC_TURF_MASTERS, 'demo-list-landscaping', '2026-08-05T09:15:00Z'),
  evt('ae-14', 'call_attempted', ACC_VANTAGE, 'demo-list-construction', '2026-08-06T11:00:00Z'),
];

// --- Call-Ready Brief narrative content ------------------------------------
// The synthesized parts of a brief (what they do, what matters, talking
// points) — in a live system these come from LLMProvider.summarize/reason
// over the KnowledgeItems + ResearchFindings above. Hand-written here
// since demo mode has no live AI provider connected — see docs/DEMO.md.

export interface AccountBrief {
  whatTheyDo: string;
  whatMatters: string[];
  talkingPoints: string[];
  talkTrack?: string;
  noStrongTrigger?: boolean;
}

export const DEMO_ACCOUNT_BRIEFS: Record<string, AccountBrief> = {
  [ACC_RIDGELINE]: {
    whatTheyDo:
      'Commercial general contractor, 50-200 employees, active across the South Bay on office and light-industrial projects.',
    whatMatters: [
      'New San Jose regional office opening Q3 2026 — new sites mean new security setup decisions.',
      'Current monitoring contract (SecureGuard Systems) estimated to expire around October 2026.',
      'VP Operations (Maria Chen) confirmed to own vendor decisions above $15K.',
      'IT Director (David Okafor) likely involved on the technical side — not yet confirmed directly.',
    ],
    talkingPoints: [
      'New office opening is a natural, low-pressure reason to reach out now, ahead of the contract renewal window.',
      'Ask Maria directly about the October timeline rather than assuming it.',
    ],
    talkTrack:
      "Hey Maria, this is Jordan over at Bay Sentinel — I know this is a cold call so I'll keep it quick. Saw Ridgeline's opening a new San Jose office this quarter, and figured that's probably kicking off a bunch of vendor decisions right now. We do camera and access control for construction and commercial sites around the Bay, and I'd guess you're already thinking about security for the new location — worth 15 minutes to compare notes?",
  },
  [ACC_ANDERSON]: {
    whatTheyDo: 'Mid-size commercial construction company, 20-50 employees, general commercial builds.',
    whatMatters: ['No significant recent news or public developments found in the last 12 months.'],
    talkingPoints: ['No strong current trigger — this is a relationship-building call, not a news-driven one.'],
    noStrongTrigger: true,
  },
  [ACC_PACIFIC_RIM]: {
    whatTheyDo: 'Existing customer since 2022 — commercial contractor currently on our alarm monitoring plan only.',
    whatMatters: [
      'Existing customer relationship — Tom Reilly (Facilities Manager) is the known contact.',
      'Not currently on access control — context only, not a directive to pitch it.',
    ],
    talkingPoints: ['Check in as an existing customer first — any service issues, satisfaction, upcoming site changes.'],
  },
  [ACC_DELGADO]: {
    whatTheyDo: 'Former customer — churned in 2024, switched to SecureGuard Systems.',
    whatMatters: [
      'Left specifically citing slow service response times, not price.',
      "That's a real, documented objection — worth understanding if still true before any win-back attempt.",
    ],
    talkingPoints: ['If re-engaging, lead with what changed on the service side, not a generic win-back pitch.'],
  },
  [ACC_SUMMIT]: {
    whatTheyDo: 'Commercial structural contractor, 20-50 employees.',
    whatMatters: ['Limited additional context available — see match warning above before treating research as fully reliable.'],
    talkingPoints: ['Confirm you have the right company before referencing anything research-specific.'],
  },
  [ACC_BAYVIEW]: {
    whatTheyDo: 'Limited public information found. Website unavailable.',
    whatMatters: ['No meaningful recent news located.'],
    talkingPoints: ['Basic cold-call approach — no research-driven angle available for this one.'],
    noStrongTrigger: true,
  },
  [ACC_NORTHGATE]: {
    whatTheyDo: 'Commercial construction company, 20-50 employees.',
    whatMatters: [
      'Reception confirmed Steve Malone (previous contact) left in June — Mike now handles operations, last name unknown.',
      'Historical note: mentioned frustration with SecureGuard Systems response times in 2025.',
    ],
    talkingPoints: ['Get Mike\'s last name and direct line before the next call — current contact is stale.'],
  },
  [ACC_COASTAL]: {
    whatTheyDo: 'Small commercial framing contractor, 10-20 employees, owner-operated.',
    whatMatters: [
      'Posted 3 new site-supervisor roles in the last 30 days — active growth signal.',
      'Angela Brooks (Owner) is the confirmed decision maker and economic buyer.',
      'Meeting booked for Wednesday 2:00 PM — see post-call note.',
    ],
    talkingPoints: ['Growth signal (hiring) is the strongest current angle — new sites likely need new camera coverage.'],
  },
  [ACC_IRONCLAD]: {
    whatTheyDo: 'Commercial construction company, 50-100 employees.',
    whatMatters: ['Confirmed not interested — currently satisfied with SecureGuard Systems, no reported issues.'],
    talkingPoints: ['Low priority — team already confirmed this is not currently gettable.'],
  },
  [ACC_VANTAGE]: {
    whatTheyDo: 'Commercial construction company, 20-50 employees.',
    whatMatters: [
      'Possible leadership change: CRM (2022) listed John Smith as CFO; the official site (checked 2026-08-06) now lists Sarah Lee. Treating Sarah Lee as current — see full history below.',
      'Currently being worked — no call outcome logged yet.',
    ],
    talkingPoints: ['Confirm Sarah Lee is still the right finance contact before assuming the 2022 note is current.'],
  },
  [ACC_EVERGREEN]: {
    whatTheyDo: 'Commercial landscaping company, 10-20 employees.',
    whatMatters: ['General prospecting context only — see /demo/lists/demo-list-landscaping for list-level focus.'],
    talkingPoints: ['Standard commercial landscaping approach.'],
  },
  [ACC_SUNRISE]: {
    whatTheyDo: 'Limited public information found.',
    whatMatters: ['No meaningful recent news located.'],
    talkingPoints: ['Basic cold-call approach — no research-driven angle available.'],
    noStrongTrigger: true,
  },
  [ACC_GREENSCAPE]: {
    whatTheyDo: 'Commercial landscaping company, 20-50 employees — imported name was shortened ("GreenScape"), matched with moderate confidence.',
    whatMatters: ['Confirm exact company identity before referencing anything research-specific.'],
    talkingPoints: ['Verify company match on the call before going deep on any research angle.'],
  },
  [ACC_TURF_MASTERS]: {
    whatTheyDo: 'Commercial landscaping company, 10-20 employees, owner-operated.',
    whatMatters: ['Spoke with owner briefly — asked to follow up next month.'],
    talkingPoints: ['Respect the requested follow-up timing rather than calling again immediately.'],
  },
  // --- Stress-test briefs ---
  // ACC_STRESS_ZERO_DATA and ACC_STRESS_FAILED intentionally have no
  // entry here — getAccountBrief() returns null, exercising the
  // account page's `{brief && (...)}` guard with real zero-data and
  // failed-research states rather than a synthesized "brief."
  [ACC_STRESS_LONG_NAME]: {
    whatTheyDo:
      'Diversified industrial group spanning manufacturing, systems integration, and third-party logistics across multiple facilities.',
    whatMatters: [
      'Announced a new integration facility as part of a multi-year capacity expansion (10 sources reporting the same event — see Sources).',
      'Long legal name and title fields present — this account exists specifically to verify the UI does not break on realistic worst-case text length.',
    ],
    talkingPoints: ['Confirm which facility/division the expansion news actually affects before referencing it.'],
  },
  [ACC_STRESS_MANY_PEOPLE]: {
    whatTheyDo: 'Industrial services company, 100-250 employees, multiple identified stakeholders.',
    whatMatters: [
      'Six stakeholders identified across decision-maker, economic-buyer, influencer, technical-buyer, champion, and unknown roles — tests a long People section rather than the usual 2-4.',
      'One contact has no confirmed title — tests graceful handling of missing data.',
    ],
    talkingPoints: ['Start with Marcus Chen (CEO) or Denise Okonkwo (CFO) — both are the strongest-certainty contacts.'],
  },
};

// --- Ambiguous match detail text (product spec §15) -----------------------
// The actual warning severity/label comes from Account.identityStatus
// (see src/demo/index.ts's getIdentityWarning) — this map supplies only
// the founder-legible flavor text (what was imported, what it matched
// to) for accounts whose identityStatus isn't 'confirmed'.

export const DEMO_IDENTITY_MATCH_DETAILS: Record<string, { rawImportedName: string; matchedTo: string; matchConfidence: number }> = {
  [ACC_SUMMIT]: {
    rawImportedName: 'Summit Construction',
    matchedTo: 'Summit Structural',
    matchConfidence: 0.55,
  },
  [ACC_GREENSCAPE]: {
    rawImportedName: 'GreenScape',
    matchedTo: 'GreenScape Bay Area',
    matchConfidence: 0.68,
  },
};
