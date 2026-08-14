import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAccount } from '@/data';
import { addNoteAction } from '../../../../actions';
import { Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default async function NewNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = getAccount(id);
  if (!account) notFound();

  const action = addNoteAction.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-xs text-muted">
        <Link href={`/app/accounts/${id}`} className="hover:text-ink">
          {account.name}
        </Link>{' '}
        / Add Note
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Add Note</h1>
      <p className="text-sm text-body">
        Anything you know about this account — what came up on a call, a stakeholder detail, a
        contract timing note. This is what builds the account&rsquo;s knowledge timeline.
      </p>

      <form action={action} className="flex max-w-lg flex-col gap-4">
        <Textarea name="content" required placeholder="What did you learn or discuss?" rows={5} />
        <Button type="submit">Add Note</Button>
      </form>
    </div>
  );
}
