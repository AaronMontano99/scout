import type { z } from 'zod';

/**
 * See docs/AI_ARCHITECTURE.md. No file outside src/ai/providers/*
 * may import a model vendor SDK directly — everything else calls
 * this interface. Model/provider selection is workload-keyed config
 * (src/ai/config.ts), never hardcoded at call sites.
 */

export interface ExtractionInput<T> {
  content: string;
  schema: z.ZodType<T>;
  instructions?: string;
}

export interface StructuredResult<T> {
  data: T;
  confidence: number;
  modelUsed: string;
}

export interface ClassificationInput {
  content: string;
  categories: string[];
  instructions?: string;
}

export interface ClassificationResult {
  category: string;
  confidence: number;
  modelUsed: string;
}

export interface ReasoningInput {
  context: string;
  question: string;
  evidenceRefs: { type: string; id: string; excerpt: string }[];
}

export interface ReasoningResult {
  answer: string;
  evidenceRefs: { type: string; id: string; excerpt: string }[];
  confidence: 'low' | 'medium' | 'high';
  modelUsed: string;
}

export interface SummarizationInput {
  content: string;
  maxLength?: number;
}

export interface SummaryResult {
  summary: string;
  modelUsed: string;
}

export interface GenerationInput {
  /** Instructions/persona/rules — kept separate from userPrompt so a provider can put it in the right slot (e.g. Ollama's system role). */
  systemPrompt: string;
  /** The actual request + structured context to write from. */
  userPrompt: string;
}

export interface GenerationResult {
  text: string;
  modelUsed: string;
}

export interface AIProvider {
  classify(input: ClassificationInput): Promise<ClassificationResult>;
  extractStructuredData<T>(input: ExtractionInput<T>): Promise<StructuredResult<T>>;
  reason(input: ReasoningInput): Promise<ReasoningResult>;
  summarize(input: SummarizationInput): Promise<SummaryResult>;
  /** Free-form generation from an explicit system+user prompt pair — see src/ai/seller-voice/ for the primary consumer (call scripts, emails, voicemails). Distinct from summarize/reason, which shape their inputs around an existing text to condense or a question to answer. */
  generate(input: GenerationInput): Promise<GenerationResult>;
  embed(input: string | string[]): Promise<number[][]>;
}
