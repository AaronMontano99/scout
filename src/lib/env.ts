import { z } from 'zod';

/**
 * Validated environment access. No file should read process.env
 * directly outside this module — see docs/SECURITY.md (secrets
 * discipline) and docs/ARCHITECTURE.md.
 */
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // AI provider — see docs/AI_ARCHITECTURE.md. Model names are config,
  // never hardcoded in business logic.
  AI_MODEL_EXTRACTION: z.string().min(1).default('placeholder-extraction-model'),
  AI_MODEL_CLASSIFICATION: z
    .string()
    .min(1)
    .default('placeholder-classification-model'),
  AI_MODEL_REASONING: z.string().min(1).default('placeholder-reasoning-model'),
  AI_MODEL_SUMMARY: z.string().min(1).default('placeholder-summary-model'),
  AI_MODEL_EMBEDDING: z.string().min(1).default('placeholder-embedding-model'),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),

  // Background jobs — see docs/JOBS_ARCHITECTURE.md
  TRIGGER_API_KEY: z.string().min(1).optional(),

  // Billing — see docs/COST_MODEL.md, architected for, not wired in Phase 0
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/**
 * Lazily validated so Phase 0 (no real env values yet) doesn't crash
 * every import — but any code path that actually needs env fails loud
 * and specific, not with a vague "undefined" downstream.
 */
export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      `Invalid/missing environment variables: ${parsed.error.issues
        .map((i) => i.path.join('.'))
        .join(', ')}. See .env.example.`
    );
  }
  cached = parsed.data;
  return cached;
}
