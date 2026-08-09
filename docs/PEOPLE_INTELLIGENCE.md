# People Intelligence

## Multiple people, not one magic contact

Every account can surface several relevant people — primary target,
secondary target, potential champion, potential economic buyer — never
a single assumed "the contact" (product spec §23). Demo: Ridgeline
Builders shows both Maria Chen (KNOWN decision maker) and David Okafor
(INFERRED technical buyer) simultaneously.

## Buying role × certainty is a 2-axis system, always both

`BuyingRole` (`decision_maker | economic_buyer | champion | influencer
| technical_buyer | blocker | unknown`) and `CertaintyType` (`KNOWN |
INFERRED | SUGGESTED`) are independent axes — see `DATA_MODEL.md`
§AccountContactRelationship and `AI_ARCHITECTURE.md`'s trust rules. UI
rule, enforced in `src/components/badges.tsx`: `RoleBadge` is never
rendered without an adjacent `CertaintyBadge`. A role without visible
certainty is exactly the "inference presented as fact" failure mode
the whole product architecture exists to prevent.

## Direct contact info is nice, not required

Scout's value is answering *who matters*, not necessarily supplying a
verified direct line — reps are expected to still use reception,
existing enrichment tools, or the CRM to actually reach someone
(product spec §23). The Account Brain works even when a rep ends up
talking to whoever picks up, not just the suggested contact — see
`ACCOUNT_BRAIN.md` and product spec §26.

## Professional context, not profiling

Legitimate: leadership priorities, public business commentary,
operational focus, growth/efficiency/technology posture — anything
that helps frame a *business* conversation. Explicitly out of bounds,
always: religion, political belief, health, sexuality, or any other
sensitive personal characteristic (product spec §25). This is a hard
constraint on any future research/extraction prompt, not a style
preference — a violation here is a product-safety bug, not a tone
miss.

## Post-call discovery without a form

"Linda at reception said Mike handles IT" should become usable
knowledge without forcing the rep through a full contact-entry form —
see `POST_CALL_WORKFLOW.md`. Demo: the Northgate call outcome captures
exactly this pattern in `contactRoleObserved`
(`src/demo/fixtures.ts`).

## Gatekeepers are a sales-skill problem, not a Scout problem

Scout prepares the rep with enough company-level context to have a
useful conversation with *whoever* answers — reception, an office
manager, a random staffer — not just the ideal contact (product spec
§26). No elaborate gatekeeper-navigation scripting is built into V1,
by design.
