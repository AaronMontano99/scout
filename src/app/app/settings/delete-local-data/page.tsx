import Link from 'next/link';
import { deleteLocalDataAction } from '../actions';
import { Input } from '@/components/ui/input';

export default function DeleteLocalDataPage() {
  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div className="text-xs text-muted">
        <Link href="/app/settings" className="hover:text-ink">
          Settings
        </Link>{' '}
        / Delete Local Data
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Delete all local data</h1>
      <p className="text-sm text-body">
        This permanently deletes every account, contact, note, list, call outcome, and setting in this workspace.
        It cannot be undone. Consider exporting or backing up first from Settings.
      </p>

      <form action={deleteLocalDataAction} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-body">
          Type <span className="font-mono font-semibold text-ink">DELETE</span> to confirm
          <Input name="confirmation" required placeholder="DELETE" autoComplete="off" />
        </label>
        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-md bg-semantic-error px-4 py-2 text-sm font-medium text-on-primary"
          >
            Permanently Delete Everything
          </button>
          <Link href="/app/settings" className="rounded-md border border-hairline-strong bg-surface-card px-4 py-2 text-sm font-medium text-ink hover:bg-canvas-soft">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
