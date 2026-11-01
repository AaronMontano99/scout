import { NextResponse } from 'next/server';
import { z } from 'zod';
import { assessHotList, coachNotes, findLeads, generateCallCard, generateEmail, reviseDraft } from '@/ai/sdr/engine';
import { getJob, jobKey, runJob } from '@/ai/sdr/jobs';
import { DEMO, DEMO_AI_MESSAGE } from '@/demo/mode';

/**
 * Long-running Lead SDR AI work (live research, call cards, emails,
 * coaching, lead finding). A Route Handler rather than Server Actions
 * because Next dispatches Server Actions one at a time per client — a
 * minute-long research run would otherwise block every other click on
 * the page. Local single-user app: no auth layer, same as the rest of
 * /app (see src/auth/index.ts).
 */

export const dynamic = 'force-dynamic';

const requestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('call_card'), accountId: z.string(), instruction: z.string().optional(), refreshResearch: z.boolean().optional() }),
  z.object({ action: z.literal('email'), accountId: z.string(), instruction: z.string().optional(), refreshResearch: z.boolean().optional() }),
  z.object({ action: z.literal('revise'), accountId: z.string(), kind: z.enum(['call_card', 'email']), instruction: z.string().min(1) }),
  z.object({ action: z.literal('hotlist_assess'), accountId: z.string() }),
  z.object({ action: z.literal('coach'), accountId: z.string(), notes: z.string().min(1), channel: z.string() }),
  z.object({
    action: z.literal('find_leads'),
    zips: z.array(z.string()).min(1),
    industries: z.array(z.string()),
    count: z.number().int().min(1).max(30),
    focus: z.string().optional(),
  }),
]);

export async function POST(request: Request) {
  if (DEMO) return NextResponse.json({ error: DEMO_AI_MESSAGE }, { status: 403 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  const input = parsed.data;

  try {
    switch (input.action) {
      case 'call_card':
        return NextResponse.json(
          await runJob(jobKey('call_card', input.accountId), () =>
            generateCallCard(input.accountId, { instruction: input.instruction || undefined, refreshResearch: input.refreshResearch })
          )
        );
      case 'email':
        return NextResponse.json(
          await runJob(jobKey('email', input.accountId), () =>
            generateEmail(input.accountId, { instruction: input.instruction || undefined, refreshResearch: input.refreshResearch })
          )
        );
      case 'revise':
        return NextResponse.json(await runJob(jobKey(input.kind, input.accountId), () => reviseDraft(input.accountId, input.kind, input.instruction)));
      case 'hotlist_assess':
        return NextResponse.json(await runJob(jobKey('hotlist', input.accountId), () => assessHotList(input.accountId)));
      case 'coach':
        return NextResponse.json(await runJob(jobKey('coach', input.accountId), () => coachNotes(input.accountId, input.notes, input.channel)));
      case 'find_leads':
        return NextResponse.json(
          await runJob(jobKey('find_leads', 'all'), () =>
            findLeads({ zips: input.zips, industries: input.industries, count: input.count, focus: input.focus || undefined })
          )
        );
    }
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Something went wrong.' }, { status: 500 });
  }
}

/** Status of a running job, e.g. ?key=call_card:<accountId> — lets a reopened page know work is still in flight. */
export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get('key');
  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 });
  return NextResponse.json({ job: getJob(key) });
}
