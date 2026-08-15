import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { OllamaProvider, checkOllamaStatus } from '@/ai/providers/ollama-provider';

// No live Ollama server touched — fetch is mocked throughout. See
// docs/AI_ARCHITECTURE.md's "no vendor SDK outside providers/*" rule;
// this is that provider's own test, everything else in the app should
// never need to know it's Ollama under the hood.

const originalFetch = global.fetch;

function mockFetchOnce(response: unknown, ok = true, status = 200) {
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok,
    status,
    text: async () => JSON.stringify(response),
    json: async () => response,
  }) as unknown as typeof fetch;
}

beforeEach(() => {
  process.env.OLLAMA_HOST = 'http://localhost:11434';
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('OllamaProvider.classify', () => {
  it('returns the model-chosen category with higher confidence when it is one of the offered categories', async () => {
    mockFetchOnce({ message: { content: '{"category":"positive"}' } });
    const provider = new OllamaProvider('llama3.2');
    const result = await provider.classify({ content: 'Great product!', categories: ['positive', 'negative'] });
    expect(result.category).toBe('positive');
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.modelUsed).toBe('llama3.2');
  });

  it('falls back to the first category with low confidence if the model returns something outside the offered set', async () => {
    mockFetchOnce({ message: { content: '{"category":"neither"}' } });
    const provider = new OllamaProvider('llama3.2');
    const result = await provider.classify({ content: 'Meh', categories: ['positive', 'negative'] });
    expect(result.category).toBe('positive');
    expect(result.confidence).toBeLessThan(0.5);
  });
});

describe('OllamaProvider.extractStructuredData', () => {
  const schema = z.object({ whatTheyDo: z.string(), whatMatters: z.array(z.string()) });

  it('parses and validates well-formed JSON against the caller-provided schema', async () => {
    mockFetchOnce({ message: { content: '{"whatTheyDo":"They make widgets.","whatMatters":["Fact one","Fact two"]}' } });
    const provider = new OllamaProvider('llama3.2');
    const result = await provider.extractStructuredData({ content: 'raw text', schema });
    expect(result.data.whatTheyDo).toBe('They make widgets.');
    expect(result.data.whatMatters).toEqual(['Fact one', 'Fact two']);
  });

  it('throws rather than returning fabricated data when the model output does not match the schema', async () => {
    mockFetchOnce({ message: { content: '{"somethingElse": true}' } });
    const provider = new OllamaProvider('llama3.2');
    await expect(provider.extractStructuredData({ content: 'raw text', schema })).rejects.toThrow();
  });

  it('throws when the model does not return valid JSON at all', async () => {
    mockFetchOnce({ message: { content: 'not json' } });
    const provider = new OllamaProvider('llama3.2');
    await expect(provider.extractStructuredData({ content: 'raw text', schema })).rejects.toThrow(/valid JSON/);
  });
});

describe('OllamaProvider.summarize', () => {
  it('returns the model text, trimmed and length-capped', async () => {
    mockFetchOnce({ message: { content: '  A concise summary.  ' } });
    const provider = new OllamaProvider('llama3.2');
    const result = await provider.summarize({ content: 'long text', maxLength: 100 });
    expect(result.summary).toBe('A concise summary.');
  });
});

describe('checkOllamaStatus', () => {
  it('reports unavailable with a clear reason when the server is unreachable', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('ECONNREFUSED')) as unknown as typeof fetch;
    const status = await checkOllamaStatus('llama3.2');
    expect(status.available).toBe(false);
    expect(status.reason).toMatch(/not running/i);
  });

  it('reports unavailable with a "pull the model" reason when Ollama is up but the model is not present', async () => {
    mockFetchOnce({ models: [{ name: 'other-model:latest' }] });
    const status = await checkOllamaStatus('llama3.2');
    expect(status.available).toBe(false);
    expect(status.reason).toMatch(/ollama pull llama3\.2/);
  });

  it('reports available when the server is up and the model is present', async () => {
    mockFetchOnce({ models: [{ name: 'llama3.2:latest' }] });
    const status = await checkOllamaStatus('llama3.2');
    expect(status.available).toBe(true);
  });
});
