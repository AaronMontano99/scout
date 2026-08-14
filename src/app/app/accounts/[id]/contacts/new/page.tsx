import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAccount } from '@/data';
import { createContactAction } from '../../../../actions';
import { Input, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default async function NewContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = getAccount(id);
  if (!account) notFound();

  const action = createContactAction.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <div className="text-xs text-muted">
        <Link href={`/app/accounts/${id}`} className="hover:text-ink">
          {account.name}
        </Link>{' '}
        / Add Contact
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Add Contact</h1>

      <form action={action} className="flex max-w-md flex-col gap-4">
        <div className="flex gap-4">
          <label className="flex flex-1 flex-col gap-1 text-sm text-body">
            First name
            <Input name="firstName" placeholder="Jane" />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm text-body">
            Last name
            <Input name="lastName" placeholder="Doe" />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm text-body">
          Title
          <Input name="title" placeholder="VP Operations" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-body">
          Email
          <Input name="email" type="email" placeholder="jane@acme.com" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-body">
          Phone
          <Input name="phone" type="tel" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-body">
          LinkedIn URL
          <Input name="linkedinUrl" type="url" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-body">
          Buying role
          <Select name="roleHypothesis" defaultValue="unknown">
            <option value="decision_maker">Decision Maker</option>
            <option value="economic_buyer">Economic Buyer</option>
            <option value="champion">Champion</option>
            <option value="influencer">Influencer</option>
            <option value="technical_buyer">Technical Buyer</option>
            <option value="blocker">Blocker</option>
            <option value="unknown">Unknown</option>
          </Select>
        </label>
        <Button type="submit">Add Contact</Button>
      </form>
    </div>
  );
}
