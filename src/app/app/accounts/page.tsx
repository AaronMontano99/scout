import Link from 'next/link';
import { getAccountsOverview } from '@/data';
import { AccountsBrowser } from '@/components/accounts-browser';
import { EmptyState } from '@/components/states';
import { PageHeader } from '@/components/ui/page-header';
import { Panel } from '@/components/ui/panel';
import { Button } from '@/components/ui/button';

// Accounts — the primary account browser, real accounts only. See
// docs/PRODUCT_UX.md.

export default function AccountsPage() {
  const rows = getAccountsOverview();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Accounts"
        subtitle="What Scout knows about every company you have ever worked. Nothing here expires."
        actions={
          <Link href="/app/accounts/new">
            <Button className="!px-[18px] !py-[11px] !text-[13.5px]">Add account</Button>
          </Link>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No accounts yet"
          body="Add your first account by hand, or import a spreadsheet of accounts you already track."
          ctaLabel="Add Account"
          ctaHref="/app/accounts/new"
        />
      ) : (
        <div className="flex items-start gap-5">
          <AccountsBrowser rows={rows} />
          <Panel className="flex min-h-[300px] flex-1 items-center justify-center px-6 py-10 text-center">
            <p className="text-sm text-muted">Select an account on the left to open its Call-Ready Brief.</p>
          </Panel>
        </div>
      )}
    </div>
  );
}
