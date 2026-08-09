import Link from 'next/link';
import { PRODUCT_NAME, SUPPORT_EMAIL } from '@/lib/branding';

// See DESIGN.md "top-nav" — canvas background, ink text, height 64px.
// Trimmed to routes that actually exist (no Pricing/Resources pages
// built yet) rather than linking nowhere — same discipline as the
// in-app nav (src/app/demo/layout.tsx).

export function MarketingNav() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-hairline bg-canvas px-6 sm:px-10">
      <span className="text-sm font-semibold tracking-tight text-ink">{PRODUCT_NAME}</span>
      <nav className="flex items-center gap-6">
        <Link href="/demo" className="hidden text-sm text-body hover:text-ink sm:inline">
          Explore the demo
        </Link>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="inline-flex items-center justify-center rounded-md bg-primary px-[18px] py-[10px] text-sm font-medium text-on-primary hover:bg-primary-active"
        >
          Request a Demo
        </a>
      </nav>
    </header>
  );
}
