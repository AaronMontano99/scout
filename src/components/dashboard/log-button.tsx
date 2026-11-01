'use client';

import { Send } from 'lucide-react';
import { useShell } from '@/components/shell/shell';
import { Button } from '@/components/ui/button';

export function LogButton({ company }: { company?: string }) {
  const { open } = useShell();
  return (
    <Button type="button" onClick={() => open({ type: 'log', draft: company ? { company } : undefined })}>
      <Send size={15} />
      Log a touch
    </Button>
  );
}
