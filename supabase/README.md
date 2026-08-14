# supabase/ — historical reference only

Local-first mode (see [`docs/LOCAL_MODE.md`](../docs/LOCAL_MODE.md))
runs on a local SQLite file, not a hosted Supabase/Postgres project.
[`db/schema.sql`](../db/schema.sql) is the schema actually in use — it
was flattened from the migrations in this directory, with the
multi-tenant scaffolding (`organizations`, `memberships`, `app_users`,
`audit_log`, RLS) dropped, since a local single-user tool has exactly
one implicit workspace.

This directory is kept, unmodified, as the source-of-truth entity
design `db/schema.sql` was derived from — useful lineage if a hosted/
multi-tenant mode is ever revisited, but not applied to anything at
runtime today.
