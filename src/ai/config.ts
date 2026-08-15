import { getEnv } from '@/lib/env';
import { OllamaProvider, checkOllamaStatus } from './providers/ollama-provider';
import type { AIProvider } from './provider';

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

/**
 * The one place outside src/ai/providers/* that's allowed to know
 * which concrete provider backs AIProvider — everything else (Post-
 * Call, Research synthesis, ...) calls this and stays vendor-agnostic.
 * Currently always Ollama; swapping vendors later is a change here
 * only. Never throws — every real call site wraps use best-effort
 * anyway, but this keeps that contract explicit at the source.
 */
export function getAIProvider(workload: AIWorkload = 'extraction'): AIProvider {
  return new OllamaProvider(getModelForWorkload(workload));
}

export interface AIProviderStatus {
  available: boolean;
  provider: string;
  model: string;
  reason?: string;
}

/** Live check — see docs/PRODUCT_UX.md's "never a fake connection" rule. Settings calls this, not a static claim. */
export async function getAIProviderStatus(): Promise<AIProviderStatus> {
  const model = getModelForWorkload('extraction');
  const result = await checkOllamaStatus(model);
  return { available: result.available, provider: 'Ollama', model, reason: result.reason };
}
