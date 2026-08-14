import Link from 'next/link';
import { createAccountAction } from '../../actions';
import { Input, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function NewAccountPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-xs text-muted">
        <Link href="/app" className="hover:text-ink">
          My Workspace
        </Link>{' '}
        / Add Account
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Add Account</h1>

      <form action={createAccountAction} className="flex max-w-md flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-body">
          Company name
          <Input name="name" required placeholder="Acme Corp" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-body">
          Domain
          <Input name="primaryDomain" placeholder="acme.com" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-body">
          Industry
          <Input name="industry" placeholder="Commercial construction" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-body">
          Employee count
          <Input name="employeeCountRange" placeholder="50-200" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-body">
          Relationship
          <Select name="relationshipStatus" defaultValue="prospect">
            <option value="prospect">Prospect</option>
            <option value="current_customer">Current Customer</option>
            <option value="former_customer">Former Customer</option>
            <option value="partner">Partner</option>
            <option value="unknown">Unknown</option>
          </Select>
        </label>
        <Button type="submit">Add Account</Button>
      </form>
    </div>
  );
}
