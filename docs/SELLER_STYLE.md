# Seller Style

## A distinct memory category — do not conflate with Account Memory

`SellerStyleProfile` (`DATA_MODEL.md` Phase 2 Additions,
`supabase/migrations/0002_core_product.sql`) is per-*rep*, not per-
account. Account Brain corrections (a wrong decision-maker, a stale
contact) are facts about a company; style corrections ("stop sounding
corporate," "write this more like me") are facts about how *this
person* communicates. Mixing the two into one correction/memory system
would mean a style fix on one account leaking into how Scout writes for
every other account, and vice versa — a real product bug, not a
nitpick (product spec §70).

## Default: rep controls their own voice

`sample_scripts` / `sample_emails` / `sample_voicemails` /
`tone_notes` seed the profile; the rep should not have to repeat "stop
sounding corporate" every session — once taught, retained (product
spec §28). Demo: `DEMO_SELLER_STYLE` in `src/demo/fixtures.ts` — direct,
conversational, no buzzwords, explicit "never says 'reach out' or
'circle back.'"

## Organization guidance is opt-in, not the default

An org may configure `approved_language` / `compliance_rules` on the
Phase 1 `SalesProfile` — this constrains, it doesn't replace, individual
style (product spec §29). Most orgs shouldn't force every rep into
identical scripts; a SaaS BDR and an outside technology Account Manager
legitimately sound different and should stay that way.

## Where it's used

Talk tracks (`AccountBrief.talkTrack` in `src/demo/fixtures.ts`) and
follow-up email drafts (`PostCallNote.followUpEmailDraft`) both read
from the rep's style profile in the real implementation — the demo
fixtures hand-write style-consistent copy to stand in for that
generation step (no live `AIProvider` connected — see `DEMO.md`).

## What's NOT built yet

The actual `LLMProvider.reason`/`summarize` call that generates a
draft *from* a `SellerStyleProfile` at request time, and the UI for a
rep to add/edit sample scripts. Both are Phase 3+ (`ROADMAP.md`) — this
doc and the data model exist now so that work has a clear target rather
than being designed from scratch later.
