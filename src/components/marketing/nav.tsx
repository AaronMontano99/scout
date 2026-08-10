'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { PRODUCT_NAME, SUPPORT_EMAIL } from '@/lib/branding';

// See DESIGN.md "top-nav" — canvas background, ink text, height 64px.
// Adaptive: transparent over the hero, gains a solid background + soft
// shadow once the page has scrolled past it — a real, functional cue
// (not decorative motion) that tracks scroll position via
// IntersectionObserver rather than a continuous scroll listener.
// Trimmed to routes that actually exist (no Pricing/Resources pages
// built yet) rather than linking nowhere — same discipline as the
// in-app nav (src/app/demo/layout.tsx).

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
        <span className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10.25" stroke="#171717" strokeWidth="1.5" />
            <path
              d="M12 4.6 13.55 10.45 19.4 12 13.55 13.55 12 19.4 10.45 13.55 4.6 12 10.45 10.45Z"
              fill="#2f6fed"
            />
          </svg>
          <span className="text-ink text-[17px] font-semibold tracking-tight">
            {PRODUCT_NAME}
          </span>
        </span>
        <nav className="flex items-center gap-6">
          <Link
            href="/demo"
            className="text-body hover:text-ink hidden text-sm sm:inline"
          >
            Explore the demo
          </Link>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-on-primary inline-flex h-11 items-center gap-2.5 rounded-full bg-[#2f6fed] py-0 pr-4 pl-5 text-sm font-medium shadow-[0_8px_20px_-10px_rgba(47,111,237,0.9)] hover:bg-[#2761d8]"
          >
            Request a Demo
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[11px]">
              →
            </span>
          </a>
        </nav>
      </header>
    </>
  );
}
