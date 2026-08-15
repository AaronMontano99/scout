import Link from 'next/link';
import { getAccountsOverview } from '@/data';
import { AccountsBrowser } from '@/components/accounts-browser';
import { EmptyState } from '@/components/states';

// Accounts — the primary account browser, real accounts only. See
// docs/PRODUCT_UX.md.

export default function AccountsPage() {
  const rows = getAccountsOverview();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Accounts</h1>
          <p className="mt-1 text-sm text-body">{rows.length} accounts in your workspace.</p>
        </div>
        <Link href="/app/accounts/new" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary">
          + Add Account
        </Link>
      </header>

      {rows.length === 0 ? (
        <EmptyState
          title="No accounts yet"
          body="Add your first account by hand, or import a spreadsheet of accounts you already track."
          ctaLabel="Add Account"
          ctaHref="/app/accounts/new"
        />
      ) : (
        <AccountsBrowser rows={rows} />
      )}
    </div>
  );
}
