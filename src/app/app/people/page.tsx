import { getPeopleOverview } from '@/data';
import { PeopleBrowser } from '@/components/people-browser';
import { EmptyState } from '@/components/states';
import { PageHeader } from '@/components/ui/page-header';

// People — real contacts and account-contact relationships only. Role
// is never shown without certainty — see docs/PEOPLE_INTELLIGENCE.md.

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string }>;
}) {
  const { account } = await searchParams;
  const rows = getPeopleOverview();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="People"
        subtitle="Who matters across the accounts you are working. Role and certainty are always shown together."
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No people yet"
          body="Add a contact from an account page, or import a spreadsheet that includes contact names."
          ctaLabel="Open Accounts"
          ctaHref="/app/accounts"
        />
      ) : (
        <PeopleBrowser rows={rows} initialAccountId={account} />
      )}
    </div>
  );
}
