import { PRODUCT_NAME } from '@/lib/branding';

// Placeholder root page — Phase 0 scaffold only. Real marketing/app
// routes are Phase 1+, see docs/ROADMAP.md. Do not build product pages
// here yet per the architecture-first mandate. Using a couple of the
// DESIGN.md tokens here only to confirm they resolve.
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-canvas p-8 text-ink">
      <h1 className="text-2xl font-semibold tracking-tight">{PRODUCT_NAME}</h1>
      <p className="text-sm text-body">
        Phase 0 foundation. See /docs for architecture.
      </p>
    </main>
  );
}
