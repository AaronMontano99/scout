import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Runs Claude through the locally installed Claude Code CLI in
 * headless mode (`claude -p`). It authenticates with whatever the CLI
 * is logged into (a claude.ai Pro/Max membership on this machine), so
 * Ferret needs no API key and no per-call billing. It also gets Claude
 * Code's built-in WebSearch/WebFetch tools, which is what makes live
 * signal research possible (see src/ai/sdr/engine.ts).
 *
 * Each call is isolated from the rep's own Claude Code setup: no user
 * settings/hooks, no MCP servers, no slash commands, no saved session,
 * and it runs from a dedicated empty working directory so no
 * CLAUDE.md is picked up. ANTHROPIC_API_KEY is stripped from the
 * child env so it can never silently switch to API billing.
 */

const DEFAULT_TIMEOUT_MS = 300_000;
const WORKDIR = path.join(process.cwd(), 'data', 'ai-workdir');

function resolveClaudeBin(): string {
  const fromEnv = process.env.SCOUT_CLAUDE_BIN;
  if (fromEnv) return fromEnv;
  const local = path.join(os.homedir(), '.local', 'bin', 'claude');
  return fs.existsSync(local) ? local : 'claude';
}

export interface ClaudeRunInput {
  systemPrompt: string;
  prompt: string;
  /** JSON Schema the final answer must match — returned parsed as `data`. */
  jsonSchema?: Record<string, unknown>;
  /** Allow live WebSearch/WebFetch. Off means no tools at all (faster). */
  webSearch?: boolean;
  model?: string;
  timeoutMs?: number;
}

export interface ClaudeRunResult {
  text: string;
  data: unknown;
  model: string;
  durationMs: number;
}

export class ClaudeCliError extends Error {
  constructor(
    message: string,
    readonly kind: 'not_installed' | 'not_logged_in' | 'timeout' | 'usage_limit' | 'failed'
  ) {
    super(message);
    this.name = 'ClaudeCliError';
  }
}

function childEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  delete env.ANTHROPIC_API_KEY;
  // Next's dev server env can leak into the child; keep it from thinking it's inside another Claude Code session.
  delete env.CLAUDECODE;
  delete env.CLAUDE_CODE_ENTRYPOINT;
  return env;
}

export async function runClaude(input: ClaudeRunInput): Promise<ClaudeRunResult> {
  fs.mkdirSync(WORKDIR, { recursive: true });
  const model = input.model ?? 'sonnet';
  const tools = input.webSearch ? 'WebSearch,WebFetch' : '';
  const args = [
    '-p',
    '--output-format',
    'json',
    '--model',
    model,
    '--system-prompt',
    input.systemPrompt,
    '--tools',
    tools,
    '--setting-sources',
    '',
    '--strict-mcp-config',
    '--disable-slash-commands',
    '--no-session-persistence',
  ];
  if (tools) args.push('--allowedTools', tools);
  if (input.jsonSchema) args.push('--json-schema', JSON.stringify(input.jsonSchema));

  const started = Date.now();
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const { stdout, stderr, code, timedOut } = await new Promise<{ stdout: string; stderr: string; code: number | null; timedOut: boolean }>(
    (resolve, reject) => {
      const child = spawn(resolveClaudeBin(), args, { cwd: WORKDIR, env: childEnv(), stdio: ['pipe', 'pipe', 'pipe'] });
      let out = '';
      let err = '';
      let killed = false;
      const timer = setTimeout(() => {
        killed = true;
        child.kill('SIGTERM');
      }, timeoutMs);
      child.stdout.on('data', (d: Buffer) => (out += d.toString()));
      child.stderr.on('data', (d: Buffer) => (err += d.toString()));
      child.on('error', (e: NodeJS.ErrnoException) => {
        clearTimeout(timer);
        if (e.code === 'ENOENT') reject(new ClaudeCliError('Claude Code CLI not found. Install it from claude.com/claude-code.', 'not_installed'));
        else reject(e);
      });
      child.on('close', (c) => {
        clearTimeout(timer);
        resolve({ stdout: out, stderr: err, code: c, timedOut: killed });
      });
      child.stdin.end(input.prompt);
    }
  );

  if (timedOut) throw new ClaudeCliError(`Claude took longer than ${Math.round(timeoutMs / 1000)}s. Try again.`, 'timeout');

  let parsed: { result?: string; structured_output?: unknown; is_error?: boolean; subtype?: string } | null = null;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    parsed = null;
  }

  const combined = `${stdout}\n${stderr}`;
  if (!parsed || parsed.is_error || code !== 0) {
    if (/not logged in|please run \/login|invalid api key|authentication/i.test(combined)) {
      throw new ClaudeCliError('Claude Code is not logged in. Run `claude` in a terminal and log in with your Claude account.', 'not_logged_in');
    }
    if (/usage limit|rate limit|limit reached/i.test(combined)) {
      throw new ClaudeCliError('Your Claude usage limit was reached. It resets on its own; try again later.', 'usage_limit');
    }
    const detail = (parsed?.result ?? stderr ?? '').toString().trim().slice(0, 300);
    throw new ClaudeCliError(`Claude couldn't finish this one${detail ? `: ${detail}` : '.'}`, 'failed');
  }

  let data: unknown = parsed.structured_output ?? null;
  if (input.jsonSchema && data == null && parsed.result) {
    data = extractJson(parsed.result);
  }
  if (input.jsonSchema && data == null) {
    throw new ClaudeCliError("Claude answered, but not in the expected format. Try again.", 'failed');
  }

  return { text: (parsed.result ?? '').trim(), data, model, durationMs: Date.now() - started };
}

/** Fallback for when structured_output is missing: pull the first JSON object out of the text answer. */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1]! : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

/** Live login check — what Settings shows, never a static claim. */
export async function checkClaudeCliStatus(): Promise<{ available: boolean; reason?: string; account?: string }> {
  return new Promise((resolve) => {
    const child = spawn(resolveClaudeBin(), ['auth', 'status'], { env: childEnv(), stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    const timer = setTimeout(() => child.kill('SIGTERM'), 10_000);
    child.stdout.on('data', (d: Buffer) => (out += d.toString()));
    child.on('error', () => {
      clearTimeout(timer);
      resolve({ available: false, reason: 'Claude Code CLI not found. Install it from claude.com/claude-code.' });
    });
    child.on('close', () => {
      clearTimeout(timer);
      try {
        const status = JSON.parse(out) as { loggedIn?: boolean; authMethod?: string; email?: string };
        if (!status.loggedIn) resolve({ available: false, reason: 'Not logged in. Run `claude` in a terminal and log in.' });
        else resolve({ available: true, account: status.email });
      } catch {
        resolve({ available: false, reason: "Couldn't read Claude Code login status." });
      }
    });
  });
}
