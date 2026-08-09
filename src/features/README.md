# src/features

Feature-level composition (a specific page/flow's UI + the domain/
service calls it needs), one directory per feature (e.g.
`daily-plan/`, `account-brain/`, `imports/`). Sits above `src/domain`
and `src/components` — composes them, doesn't duplicate their logic.

Empty — Phase 0 scaffold. First feature is Phase 1's org/auth shell.
