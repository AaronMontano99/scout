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

Talk tracks (`AccountBrief.talkTrack`), the three Account page
generators (call script / voicemail / email — `src/components/
communication-generator.tsx`), and post-call follow-up email drafts
(`PostCallNote.followUpEmailDraft`) all read from the rep's real style
profile and call the live `AIProvider.generate()` (Ollama, local —
`src/ai/providers/ollama-provider.ts`). Nothing here is demo fixture
copy; `src/demo/*` remains structurally separate per `DEMO.md`.

## How generation actually works

`src/ai/seller-voice/compose-prompt.ts` is the one place a seller-
voice prompt gets assembled, in strict priority order (highest wins on
conflict):

1. one-time explicit instruction for this request only (never saved
   unless the rep checks "remember this," which routes through
   `addStyleRule` — see below)
2. the rep's saved `SellerStyleProfile` (tone notes, explicit rules,
   phrases to avoid, and up to 3 real sample scripts/emails/voicemails
   matched to the communication type being generated)
3. thin org context (`whatYouSell` / `idealBuyerRoles` / `callStyle`
   from Settings)
4. Scout's default seller voice (`src/ai/seller-voice/default-style.ts`)
   — the fallback for a rep who hasn't taught anything yet

`src/ai/seller-voice/generate.ts` composes the prompt, calls
`AIProvider.generate()`, lints the result against the hard rules in
`src/domain/seller-voice-quality.ts` (no cold-call acknowledgment, no
permission openers, no corporate jargon/AI filler, no em-dashes), and
does one bounded retry if a hard rule is violated — kept only if
strictly cleaner than the first attempt. Any surviving lint issues are
surfaced in the UI as a warning, never silently hidden.

`src/data/seller-style.ts` persists tone notes, rules, phrases, and
samples against the existing `seller_style_profiles` table (extended
with one migrated `style_rules` column — see `applyColumnMigrations()`
in `src/db/client.ts`). Editable at `/app/settings/seller-style`. A
rep teaches this once; it is loaded on every future generation without
being repeated.

Generated call scripts/voicemails/emails are persisted per-account via
`saveGeneratedCommunication` (same supersession pattern as
`replaceAiSynthesis` — superseded, not deleted), always tagged
`SUGGESTED` certainty. All generation calls are best-effort and
non-blocking: a local Ollama call can take up to ~2 minutes for these
longer prompts, so nothing on the critical path (form submits,
redirects) ever awaits one directly.

## Known limitation: local model instruction-following

Verified live against `llama3.2` (a small, local model — see
`AI_ARCHITECTURE.md`): hard rules enforced by the lint pass (no
cold-call acknowledgment, no permission openers, no invented facts or
customer names) hold reliably. Softer, free-text taught rules (e.g.
"always open calls with a specific phrase") are included in the prompt
correctly but are not mechanically enforced, so a small local model may
not follow them to the letter every time. This is a model-capability
ceiling, not a gap in the composition or persistence logic — a larger
model swapped in behind the same `AIProvider` interface would follow
free-text style rules more closely without any code change here.
