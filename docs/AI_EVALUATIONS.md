# AI Evaluations

## Brief quality lint (implemented, real)

`src/domain/brief-quality.ts`, tested in `tests/brief-quality.test.ts`
(7 tests) — a cheap, repeatable regression net against the specific
failure modes the founder named directly:

- **Hype language** (`lintHypeLanguage`) — flags "innovative,"
  "revolutionary," "cutting-edge," "poised," "synergy," etc. Product
  spec §100's own bad example ("innovative, rapidly evolving market
  leader poised for digital transformation") is a literal test case.
- **Unsupported causality** (`lintUnsupportedCausality`) — flags
  "clearly shows/indicates," "is struggling with," "proves that."
  Product spec §57's disallowed example ("Acme is struggling with its
  MSP" from a fact as thin as "hiring an IT administrator") is a
  literal test case; the hedged, approved version ("this may indicate
  investment in internal IT capacity") is verified to pass clean.
- **Verbosity** (`lintVerbosity`) — flags a "what they do" field over
  ~40 words; that field is supposed to be 1-2 sentences, not a
  biography (product spec §15).

## Golden briefs (product spec §116, implemented)

`tests/brief-quality.test.ts`'s golden-regression suite runs the full
lint against every `whatTheyDo` field in `DEMO_ACCOUNT_BRIEFS`
(`src/demo/fixtures.ts`) and asserts zero issues. This is a real,
running regression test today — if a future prompt/model change starts
producing corporate-hype demo copy, or if a future contributor edits
the fixture content into something verbose, this test fails
immediately. It's small (14 accounts) but genuinely enforced, not
aspirational.

## What a full evaluation harness would add (not built yet)

Product spec §114-115 describes a much larger fixture set (ambiguous
company, no website, leadership change, conflicting sources, provider
failure, etc.) run against live pipeline output, checking: does Scout
invent unsupported pain points, confuse historical/current data,
misattribute sources, mislabel inference as fact, stay concise,
correctly identify relevant people, handle no-data gracefully, respect
Seller Style only in communication output (never bleeding into factual
claims), avoid sensitive-attribute profiling, and handle conflicting
evidence per `SOURCE_MODEL.md`'s rules. Most of these fixture
*scenarios* already exist in `src/demo/fixtures.ts` (ambiguous match,
no-website, conflicting CFO evidence, low-data companies) — what's
missing is a live pipeline to evaluate against them. The lint above is
the evaluation mechanism ready for that; the fixtures are the test
cases ready for that; only the live generation step is missing.

## Prompt and schema versioning (not built yet)

Product spec §117-118: version important prompts and structured-output
schemas, tracked per `ResearchRun`, so "why did research quality change
last Tuesday" is answerable. `src/ai/config.ts`'s workload-keyed model
selection (Phase 1) is the natural place to add a `promptVersion` field
once real prompts exist — no prompts exist yet to version.

## Cost/quality experimentation (not built yet)

Product spec §119: comparing Model A vs. Model B for cost/latency/
quality without rewriting domain code is already structurally possible
— `AIProvider`'s workload-keyed config (`AI_ARCHITECTURE.md`) means
swapping a model for one workload is a config change. No experimentation
*platform* is built, nor should one be yet (§119 explicitly warns
against building this prematurely) — clean configuration and logging
is the right scope for now.
