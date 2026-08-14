import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTargetList, getListRows, listAccounts } from '@/data';
import { addAccountToListAction } from '../../../actions';
import { Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default async function AddAccountToListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const list = getTargetList(id);
  if (!list) notFound();

  const alreadyOnList = new Set(getListRows(id).map((r) => r.account.id));
  const available = listAccounts().filter((a) => !alreadyOnList.has(a.id));
  const action = addAccountToListAction.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-xs text-muted">
        <Link href={`/app/lists/${id}`} className="hover:text-ink">
          {list.name}
        </Link>{' '}
        / Add Account
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Add Account to List</h1>

      {available.length === 0 ? (
        <p className="text-sm text-muted">
          {listAccounts().length === 0 ? (
            <>
              You haven&rsquo;t added any accounts yet.{' '}
              <Link href="/app/accounts/new" className="text-text-link hover:underline">
                Add one →
              </Link>
            </>
          ) : (
            'Every account you have is already on this list.'
          )}
        </p>
      ) : (
        <form action={action} className="flex max-w-md flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-body">
            Account
            <Select name="accountId" required>
              {available.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </label>
          <Button type="submit">Add to List</Button>
        </form>
      )}
    </div>
  );
}
