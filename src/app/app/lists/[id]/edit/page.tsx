import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTargetList } from '@/data';
import { updateTargetListAction } from '../../../actions';
import { Input, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default async function EditListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const list = getTargetList(id);
  if (!list) notFound();

  const action = updateTargetListAction.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-xs text-muted">
        <Link href={`/app/lists/${id}`} className="hover:text-ink">
          {list.name}
        </Link>{' '}
        / Edit
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Edit List</h1>

      <form action={action} className="flex max-w-md flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-body">
          List name
          <Input name="name" required defaultValue={list.name} />
        </label>
        <label className="flex flex-col gap-1 text-sm text-body">
          Description
          <Textarea name="description" defaultValue={list.description ?? ''} />
        </label>
        <label className="flex flex-col gap-1 text-sm text-body">
          Research focus
          <Input name="researchFocus" defaultValue={list.researchFocus ?? ''} placeholder="e.g. Commercial construction" />
        </label>
        <Button type="submit">Save Changes</Button>
      </form>
    </div>
  );
}
