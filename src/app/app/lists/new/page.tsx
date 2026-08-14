import Link from 'next/link';
import { createTargetListAction } from '../../actions';
import { Input, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function NewListPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-xs text-muted">
        <Link href="/app/lists" className="hover:text-ink">
          My Lists
        </Link>{' '}
        / New List
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Create Target List</h1>

      <form action={createTargetListAction} className="flex max-w-md flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-body">
          List name
          <Input name="name" required placeholder="Q3 Construction Prospects" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-body">
          Description
          <Textarea name="description" placeholder="Optional" />
        </label>
        <Button type="submit">Create List</Button>
      </form>
    </div>
  );
}
