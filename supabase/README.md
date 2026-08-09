# /supabase

`migrations/0001_init_tenancy.sql` — Phase 0/1 core tenancy tables
(`organizations`, `app_users`, `memberships`, `sales_profiles`,
`audit_log`) with read-only RLS policies. See `docs/DATA_MODEL.md` for
the full target schema and `docs/SECURITY.md` for the dual-layer
authorization rationale.

Not yet applied to a real Supabase project — no project is provisioned
yet. To apply once one exists:

```
supabase link --project-ref <ref>
supabase db push
```

Write (insert/update/delete) RLS policies are deliberately deferred to
Phase 1, built alongside `src/auth/permissions.ts` so the two stay in
sync rather than drifting — see the migration file's closing comment.

`supabase gen types typescript --linked > src/db/types.ts` should be
run after linking a real project, replacing the placeholder in
`src/db/types.ts`.
