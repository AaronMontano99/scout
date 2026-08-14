import { z } from 'zod';

/**
 * Validated environment access. No file should read process.env
 * directly outside this module — see docs/SECURITY.md (secrets
 * discipline) and docs/ARCHITECTURE.md.
 */
const envSchema = z.object({
  // AI provider — entirely optional in local-first mode (see
  // docs/LOCAL_MODE.md). Model names are config, never hardcoded in
  // business logic — see docs/AI_ARCHITECTURE.md.
  AI_MODEL_EXTRACTION: z.string().min(1).default('placeholder-extraction-model'),
  AI_MODEL_CLASSIFICATION: z
    .string()
    .min(1)
    .default('placeholder-classification-model'),
  AI_MODEL_REASONING: z.string().min(1).default('placeholder-reasoning-model'),
  AI_MODEL_SUMMARY: z.string().min(1).default('placeholder-summary-model'),
  AI_MODEL_EMBEDDING: z.string().min(1).default('placeholder-embedding-model'),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
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
