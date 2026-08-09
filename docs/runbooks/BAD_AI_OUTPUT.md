# Runbook: Bad AI Output

Symptom: a generated brief reads as hype-y, verbose, invents
unsupported claims, or otherwise fails the quality bar — reported by a
rep via "Report Bad Data" or noticed during founder quality review.

## Diagnose

1. **Run the brief-quality lint against the actual output** —
   `lintWhatTheyDo()`/`lintBullets()` (`src/domain/brief-quality.ts`,
   see `AI_EVALUATIONS.md`). If it flags real issues, this confirms a
   generation-quality problem, not a one-off perception issue.
2. **Check for schema validation failures** — if the AI output didn't
   validate against its expected schema (`AI_ARCHITECTURE.md`), it
   should never have reached the user at all; if it did, that's a more
   serious bug in the validation gate itself, not just a prompt-quality
   issue.
3. **Check whether the underlying evidence actually supports the
   claim** — per `EVIDENCE_MODEL.md`, an inference should trace back to
   real evidence. If the brief states something with no supporting
   `KnowledgeItem`/`ResearchFinding`, that's a fabrication, not just
   awkward phrasing — treat it more seriously (see `AI_ARCHITECTURE.md`'s
   trust rules — this is the failure mode the whole evidence model
   exists to prevent).
4. **Check certainty labeling** — is an `INFERRED`/`SUGGESTED` claim
   being presented with the confidence of a `KNOWN` one?

## Fix

- Prompt/extraction bug: fix the generation logic, don't just patch the
  one bad output.
- Isolated bad luck (model produced an outlier): note it, move on — not
  every bad output is a systemic problem.
- Recurring pattern: add the failing case to the golden-brief regression
  set (`AI_EVALUATIONS.md`) so it's caught automatically going forward,
  not just fixed once.

## Founder quality review (product spec §113)

Periodically sample real generated briefs and categorize: Good / Needs
Improvement / Bad Match / Bad Data / Too Verbose / Weak People Data /
Missing Source. This is qualitative, human judgment — the lint catches
mechanical issues (hype words, verbosity), not "is this actually
useful," which only a human review catches early in the product's
life.

## What's NOT built yet

No live AI generation exists yet — this runbook is written ahead of
need, same as most Phase 3 runbooks (see `RESEARCH_FAILURE.md`'s
sibling runbooks).
