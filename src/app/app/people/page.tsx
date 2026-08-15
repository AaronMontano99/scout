import { getPeopleOverview } from '@/data';
import { PeopleBrowser } from '@/components/people-browser';
import { EmptyState } from '@/components/states';

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
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">People</h1>
        <p className="mt-1 text-sm text-body">{rows.length} people across your accounts.</p>
      </header>

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
