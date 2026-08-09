# Research Security

Extends `SECURITY.md` with the specific hazards of fetching and
processing external content. Implementation: `src/domain/research-security.ts`,
tested in `tests/research-security.test.ts` (13 tests).

## SSRF defense (product spec §85)

`isSafeSourceUrl()` rejects, before any server-side fetch is attempted:
non-http(s) schemes (`javascript:`, `file:`, `ftp:`), embedded
credentials, and private/internal targets — RFC 1918 ranges
(`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), loopback
(`127.0.0.0/8`), link-local including the cloud-metadata endpoint
`169.254.169.254` (the single most common real-world SSRF target),
`localhost`, and known internal hostnames. This is a **necessary but
not sufficient** layer — the stronger defense, once real fetching
exists, is network-level egress control (a fetch proxy that structurally
cannot reach internal IP ranges). This function catches the obvious
cases before a request is ever attempted; it does not replace that
infrastructure-level control.

## Prompt injection (product spec §83)

Fetched web content is untrusted data, never instructions.
`wrapUntrustedContent()` delimits any external content included in an
AI prompt with an explicit `<untrusted_source>` block and an
instruction that anything resembling a command inside it must be
treated as ordinary content. `detectPromptInjectionSignals()` is a
best-effort scanner (common phrases like "ignore previous
instructions," "you are now") for logging/monitoring — a real
defense-in-depth signal, not a guarantee; the structural delimiting is
the actual control, the scanner just flags pages worth extra scrutiny.

## HTML/script safety (product spec §84)

`stripHtml()` removes script/style blocks and all tags before any
fallback text rendering. Fetched HTML must never be rendered directly
(no `dangerouslySetInnerHTML` on external content, ever) — always
normalize to text first.

## Access restrictions (product spec §86)

No bypassing authentication, paywalls, robots.txt, CAPTCHAs, or private
sessions — ever, regardless of technical feasibility. This is
consistent with the hard LinkedIn-scraping prohibition already in
`PRODUCT_CONSTITUTION.md` and `INTEGRATIONS.md`, generalized to every
source: if there's no permitted/approved access path, the answer is
"Scout doesn't have this," not "find a workaround."

## Data minimization (product spec §81-82)

Only the minimum context needed for a specific task goes to any AI
provider or external service. Summarizing Acme sends Acme's relevant
evidence — never the organization's entire CRM. This is a cost,
security, and accuracy control simultaneously (`AI_ARCHITECTURE.md`
already establishes this principle; Phase 3 applies it specifically to
research-stage prompts).

## Tenant isolation in research jobs

Never mix one organization's notes into another's research, cross-search
private embeddings across tenants, or let one tenant's internal notes
improve research for a different tenant without an explicit future
opt-in policy (product spec §81, `SECURITY.md`'s existing dual-layer
model already enforces this at the data layer — research jobs must
respect it at the application layer too, e.g. never constructing a
cross-org query for "efficiency").

## What's NOT built yet

No live fetch infrastructure exists — these functions are ready for a
real pipeline to call but have never processed a real external
response. Network-level SSRF egress controls (the stronger defense
layer) don't exist yet either; `isSafeSourceUrl()` alone is not
sufficient for production use without them.
