import { getAccountDirectory } from '@/data/sdr';
import { AccountDirectory } from '@/components/dashboard/account-directory';

export const dynamic = 'force-dynamic';

export default function AccountsPage() {
  return <AccountDirectory rows={getAccountDirectory()} now={new Date().toISOString()} />;
}
