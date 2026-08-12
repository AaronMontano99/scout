'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { SUPPORT_EMAIL } from '@/lib/branding';
import { ScoutLogo } from '@/components/marketing/logo';

// See DESIGN.md "top-nav" + AMENDMENT 2026-08-12 — canvas background,
// ink text, height 64px. Adaptive: transparent over the hero, gains a
// solid background + soft shadow once the page has scrolled past it —
// a real, functional cue (not decorative motion) that tracks scroll
// position via IntersectionObserver rather than a continuous scroll
// listener. Center links point at real in-page sections that actually
// exist (no Pricing/Resources/Customers pages built yet, so those
// mockup nav items aren't included) — same discipline as the in-app
// nav (src/app/demo/layout.tsx). No "Log in" link either: there's no
// authenticated product to log into yet (see README "What's NOT here
// yet").

const NAV_LINKS = [
  { href: '#product', label: 'Product' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#certainty', label: 'Why Scout' },
];

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(entry ? !entry.isIntersecting : false),
      {
        threshold: 0,
      }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} className="absolute top-0 h-px w-full" aria-hidden="true" />
      <header
        className={`sticky top-0 z-20 flex h-16 items-center justify-between px-6 transition-colors duration-200 sm:px-10 ${
          scrolled
            ? 'border-hairline bg-canvas/95 border-b shadow-[0_1px_0_0_rgba(0,0,0,0.04)] backdrop-blur'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <ScoutLogo />

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-body hover:text-ink text-sm font-medium"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          <Link
            href="/demo"
            className="text-body hover:text-ink hidden text-sm font-medium sm:inline"
          >
            Explore the demo
          </Link>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="bg-primary text-on-primary hover:bg-primary-active inline-flex h-11 items-center gap-2.5 rounded-full py-0 pr-4 pl-5 text-sm font-medium"
          >
            Book a Demo
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[11px]">
              →
            </span>
          </a>
        </div>
      </header>
    </>
  );
}
