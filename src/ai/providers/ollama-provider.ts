import { getEnv } from '@/lib/env';
import type {
  AIProvider,
  ClassificationInput,
  ClassificationResult,
  ExtractionInput,
  StructuredResult,
  ReasoningInput,
  ReasoningResult,
  SummarizationInput,
  SummaryResult,
  GenerationInput,
  GenerationResult,
} from '../provider';

/**
 * Real AIProvider implementation backed by a locally-running Ollama
 * server — see docs/AI_ARCHITECTURE.md's "no vendor SDK outside
 * src/ai/providers/*" rule (this is that one file for Ollama). Chosen
 * specifically because it matches Local Mode: no API key, no signup,
 * no data leaving the machine — the model runs on localhost.
 *
 * This is optional, not a requirement to run Scout — every call site
 * that uses it wraps calls best-effort and degrades to "nothing
 * generated" rather than failing the surrounding feature. See
 * checkOllamaStatus() for the honest availability check Settings uses.
 */

// Seller-voice generation prompts (full style profile + samples + org
// context) are much longer than the classify/summarize/reason prompts
// this was originally tuned for, and local llama3.2 can take well over
// two minutes to process them depending on machine load — observed as
// low as ~14s for a one-sentence prompt and 120s+ for a full seller-
// voice prompt on the same machine. Every call site using this
// provider is either fire-and-forget or handles a timeout as a normal,
// user-visible outcome (never an uncaught crash), so a generous
// ceiling here costs nothing.
const REQUEST_TIMEOUT_MS = 180_000;

function ollamaHost(): string {
  return getEnv().OLLAMA_HOST;
}

async function ollamaFetch(path: string, body: unknown): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${ollamaHost()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Ollama returned ${res.status}: ${await res.text().catch(() => '')}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function chat(model: string, systemPrompt: string, userPrompt: string, json: boolean): Promise<string> {
  const result = (await ollamaFetch('/api/chat', {
    model,
    stream: false,
    ...(json ? { format: 'json' } : {}),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  })) as { message?: { content?: string } };
  const content = result.message?.content;
  if (!content) throw new Error('Ollama returned an empty response');
  return content;
}

/** Live reachability + model-presence check — what Settings actually shows, never a static "Available" claim. */
export async function checkOllamaStatus(model: string): Promise<{ available: boolean; reason?: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${ollamaHost()}/api/tags`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return { available: false, reason: `Ollama server responded ${res.status}` };
    const data = (await res.json()) as { models?: { name: string }[] };
    const names = (data.models ?? []).map((m) => m.name);
    const hasModel = names.some((n) => n === model || n.startsWith(`${model}:`));
    if (!hasModel) {
      return { available: false, reason: `Model "${model}" not pulled — run: ollama pull ${model}` };
    }
    return { available: true };
  } catch {
    return { available: false, reason: 'Ollama is not running — run: ollama serve' };
  }
}

export class OllamaProvider implements AIProvider {
  constructor(private readonly model: string) {}

  async classify(input: ClassificationInput): Promise<ClassificationResult> {
    const system = `You classify text into exactly one of the given categories. Respond with JSON: {"category": "<one of the categories, verbatim>"}.`;
    const user = [
      input.instructions ? `Instructions: ${input.instructions}` : null,
      `Categories: ${input.categories.join(', ')}`,
      `Content:\n${input.content}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    const raw = await chat(this.model, system, user, true);
    const parsed = JSON.parse(raw) as { category?: string };
    const category = input.categories.includes(parsed.category ?? '') ? parsed.category! : input.categories[0]!;
    return { category, confidence: input.categories.includes(parsed.category ?? '') ? 0.7 : 0.3, modelUsed: this.model };
  }

  async extractStructuredData<T>(input: ExtractionInput<T>): Promise<StructuredResult<T>> {
    const system = [
      'You extract structured information from text and respond with JSON only.',
      'Only include facts that are actually present in the provided content — never invent, guess, or add outside knowledge.',
      'If a field cannot be determined from the content, omit it or use an empty value rather than fabricating one.',
      input.instructions ?? '',
    ]
      .filter(Boolean)
      .join(' ');

    const raw = await chat(this.model, system, input.content, true);
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      throw new Error('Model did not return valid JSON');
    }

    const result = input.schema.safeParse(parsedJson);
    if (!result.success) {
      throw new Error(`Model output did not match the expected shape: ${result.error.message}`);
    }
    return { data: result.data, confidence: 0.6, modelUsed: this.model };
  }

  async reason(input: ReasoningInput): Promise<ReasoningResult> {
    const system =
      'Answer the question using only the provided context and evidence. If the evidence is insufficient, say so plainly rather than guessing.';
    const evidenceText = input.evidenceRefs.map((e) => `[${e.type}:${e.id}] ${e.excerpt}`).join('\n');
    const user = `Context:\n${input.context}\n\nEvidence:\n${evidenceText}\n\nQuestion: ${input.question}`;
    const answer = await chat(this.model, system, user, false);
    return { answer: answer.trim(), evidenceRefs: input.evidenceRefs, confidence: 'medium', modelUsed: this.model };
  }

  async summarize(input: SummarizationInput): Promise<SummaryResult> {
    const system = `Summarize the provided text factually and concisely${input.maxLength ? `, in under ${input.maxLength} characters` : ''}. Only state what the text actually says — never add outside information.`;
    const summary = await chat(this.model, system, input.content, false);
    return { summary: summary.trim().slice(0, input.maxLength ?? 4000), modelUsed: this.model };
  }

  async generate(input: GenerationInput): Promise<GenerationResult> {
    const text = await chat(this.model, input.systemPrompt, input.userPrompt, false);
    return { text: text.trim(), modelUsed: this.model };
  }

  async embed(input: string | string[]): Promise<number[][]> {
    const texts = Array.isArray(input) ? input : [input];
    const vectors: number[][] = [];
    for (const text of texts) {
      const result = (await ollamaFetch('/api/embeddings', { model: this.model, prompt: text })) as { embedding?: number[] };
      vectors.push(result.embedding ?? []);
    }
    return vectors;
  }
}
