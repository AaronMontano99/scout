import { OutreachPage } from '@/components/sdr/outreach-page';

export const dynamic = 'force-dynamic';

export default async function CallsPage({ searchParams }: { searchParams: Promise<{ a?: string; go?: string; i?: string }> }) {
  const { a, go, i } = await searchParams;
  return <OutreachPage kind="call" accountId={a} go={go === '1'} instruction={i} />;
}
