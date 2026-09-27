import { getSettings } from '@/data/settings';
import { checkClaudeCliStatus } from '@/ai/providers/claude-cli-provider';
import { PageHeader } from '@/components/ui/page-header';
import { SettingsForm } from '@/components/shell/settings-form';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = getSettings();
  const status = await checkClaudeCliStatus();
  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-2">
      <PageHeader title="Settings" subtitle="Who's calling, the number for voicemails, and which Claude model does the work." />
      <SettingsForm settings={settings} status={status} />
    </div>
  );
}
