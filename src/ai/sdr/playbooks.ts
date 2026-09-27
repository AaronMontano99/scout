/**
 * Loads the prospecting content Scout runs on: the playbooks
 * (non-negotiable, used word for word) and the reference material
 * (workflow rules, vertical playbook, objections, real session
 * examples, training-packet question topics).
 *
 * This content is private and is NEVER committed. It lives in
 * `private/` at the repo root (git-ignored) or wherever
 * SCOUT_PRIVATE_DIR points:
 *
 *   private/playbooks/{calls,emails,hotlist,examples}.md
 *   private/reference/{workflow,verticals,objections,sessions,training}.md
 *
 * Files are read verbatim (only the final newline is dropped), and
 * tests/sdr-rules.test.ts pins their exact text, so they can't drift.
 */
import fs from 'node:fs';
import path from 'node:path';

export const PLAYBOOK_FILES = {
  calls: 'playbooks/calls.md',
  emails: 'playbooks/emails.md',
  hotlist: 'playbooks/hotlist.md',
  examples: 'playbooks/examples.md',
} as const;

export const REFERENCE_FILES = {
  workflow: 'reference/workflow.md',
  verticals: 'reference/verticals.md',
  objections: 'reference/objections.md',
  sessions: 'reference/sessions.md',
  training: 'reference/training.md',
} as const;

export type PlaybookName = keyof typeof PLAYBOOK_FILES;
export type ReferenceName = keyof typeof REFERENCE_FILES;

export class PrivateContentMissingError extends Error {
  constructor(file: string, dir: string) {
    super(`Scout's private playbooks are missing (${file}). Put them in ${dir}. They are never committed to git.`);
    this.name = 'PrivateContentMissingError';
  }
}

export function privateDir(): string {
  return process.env.SCOUT_PRIVATE_DIR ?? path.join(process.cwd(), 'private');
}

const cache = new Map<string, string>();

function read(rel: string): string {
  const dir = privateDir();
  const key = `${dir}:${rel}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const file = path.join(dir, rel);
  if (!fs.existsSync(file)) throw new PrivateContentMissingError(rel, dir);
  const text = fs.readFileSync(file, 'utf-8').replace(/\r\n/g, '\n').replace(/\n$/, '');
  cache.set(key, text);
  return text;
}

export function getPlaybook(name: PlaybookName): string {
  return read(PLAYBOOK_FILES[name]);
}

export function getReference(name: ReferenceName): string {
  return read(REFERENCE_FILES[name]);
}

export function hasPrivateContent(): boolean {
  const dir = privateDir();
  return [...Object.values(PLAYBOOK_FILES), ...Object.values(REFERENCE_FILES)].every((f) => fs.existsSync(path.join(dir, f)));
}
