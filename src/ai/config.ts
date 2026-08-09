import { getEnv } from '@/lib/env';

/**
 * Workload-keyed model selection — see docs/AI_ARCHITECTURE.md. Callers
 * ask for a workload ("extraction", "reasoning", ...), never a model
 * name. Swapping vendors or tiers is a config change here, not a
 * refactor of domain code.
 */
export type AIWorkload =
  | 'extraction'
  | 'classification'
  | 'reasoning'
  | 'summarization'
  | 'embedding';

export function getModelForWorkload(workload: AIWorkload): string {
  const env = getEnv();
  const map: Record<AIWorkload, string> = {
    extraction: env.AI_MODEL_EXTRACTION,
    classification: env.AI_MODEL_CLASSIFICATION,
    reasoning: env.AI_MODEL_REASONING,
    summarization: env.AI_MODEL_SUMMARY,
    embedding: env.AI_MODEL_EMBEDDING,
  };
  return map[workload];
}
