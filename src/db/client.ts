import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getEnv } from '@/lib/env';
import type { Database } from './types';

/**
 * All Supabase client construction is centralized here — no other file
 * should import @supabase/supabase-js or @supabase/ssr directly
 * (enforced by eslint.config.mjs's no-restricted-imports rule). This
 * is what makes ADR-0002's auth-portability mitigation real rather
 * than aspirational: callers depend on these functions, not on
 * Supabase's client shape.
 */

/** Browser-side client, respects the signed-in user's session + RLS. */
export function createBrowserSupabaseClient() {
  const env = getEnv();
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Server-side client (route handlers, server components), respects RLS. */
export async function createServerSupabaseClient() {
  const env = getEnv();
  const cookieStore = await cookies();
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

/**
 * Service-role client — BYPASSES Row-Level Security. Only for trusted
 * server-side contexts that have already done their own authorization
 * check (e.g. background jobs acting on behalf of a verified org).
 * Never expose this client to a request path driven directly by
 * unvalidated user input. See docs/SECURITY.md §Defense in depth.
 */
export function createServiceRoleSupabaseClient() {
  const env = getEnv();
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}
