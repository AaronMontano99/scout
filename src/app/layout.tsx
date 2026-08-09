import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { PRODUCT_NAME } from '@/lib/branding';
import './globals.css';

// See DESIGN.md — Inter is the single sans family, JetBrains
// Mono carries every technical data surface. CSS variables consumed by
// --font-sans / --font-mono in globals.css.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: PRODUCT_NAME,
  description: 'Sales intelligence layer for B2B sales teams.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
