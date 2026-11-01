import { getHotList } from '@/data/sdr';
import { getTasks } from '@/data/tasks';
import { ymd } from '@/domain/hot-list';
import { buildSchedule } from '@/domain/schedule';
import { SchedulePage } from '@/components/dashboard/schedule';

export const dynamic = 'force-dynamic';

export default function Page() {
  return <SchedulePage items={buildSchedule(getTasks(), getHotList())} today={ymd(new Date())} />;
}
