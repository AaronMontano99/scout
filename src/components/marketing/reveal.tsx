'use client';

import { motion, type Variants } from 'framer-motion';

// Scroll reveal — see DESIGN.md AMENDMENT 2026-08-12. Sections fade +
// slide in once as they cross into view (IntersectionObserver-backed
// via framer-motion's whileInView, `once: true`). This is the
// "scroll skill" carried over from FlightHero's scroll-driven feel,
// scaled down to a one-shot reveal rather than continuous
// scroll-scrubbing — stays inside the anti-slop "no constant page-wide
// parallax" rule (a rule that only bans motion that never stops, not
// motion that resolves once and holds).

const variants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={variants}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
