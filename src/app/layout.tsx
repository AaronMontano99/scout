import type { Metadata } from 'next';
import Script from 'next/script';
import { Bricolage_Grotesque, Hanken_Grotesk, JetBrains_Mono, Outfit, Sora } from 'next/font/google';
import { getAccountDirectory, getEmailLog, getHotList } from '@/data/sdr';
import { getSettings } from '@/data/settings';
import { getTasks } from '@/data/tasks';
import { buildAlerts } from '@/domain/alerts';
import { ymd } from '@/domain/hot-list';
import { buildSchedule } from '@/domain/schedule';
import { Shell } from '@/components/shell/shell';
import './globals.css';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' });
const sora = Sora({ subsets: ['latin'], variable: '--font-sora', display: 'swap' });
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage', display: 'swap' });
const body = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono', display: 'swap' });

export const metadata: Metadata = {
  title: 'Scout',
  description: 'Lead SDR for calls and emails: a real reason to reach out, every time.',
};

// The shell reads the local database (the bell, search), so nothing here can be prerendered.
export const dynamic = 'force-dynamic';

// Runs before first paint so a saved look never flashes the default one.
const RESTORE_LOOK = `try{var l=JSON.parse(localStorage.getItem('scout-look')||'{}'),d=document.documentElement;if(l.look)d.dataset.look=l.look;if(l.accent)d.dataset.accent=l.accent;if(l.head)d.dataset.head=l.head;if(l.art)d.dataset.art=l.art;if(l.blur)d.style.setProperty('--blur',l.blur+'px')}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = getSettings();
  const today = ymd(new Date());
  const alerts = buildAlerts({ items: buildSchedule(getTasks(), getHotList()), emailRows: getEmailLog(), today });
  const accounts = getAccountDirectory().map((a) => ({ id: a.id, name: a.name, contact: a.contact }));

  return (
    <html lang="en" className={`${outfit.variable} ${sora.variable} ${bricolage.variable} ${body.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen text-[14px] text-ink">
        <Script id="restore-look" strategy="beforeInteractive">
          {RESTORE_LOOK}
        </Script>
        <Shell alerts={alerts} accounts={accounts} ownerName={settings.ownerName}>
          {children}
        </Shell>
      </body>
    </html>
  );
}
