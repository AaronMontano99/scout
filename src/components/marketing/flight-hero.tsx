'use client';

import { useEffect, useRef } from 'react';
import { SUPPORT_EMAIL } from '@/lib/branding';

// Scroll-scrubbed flight hero — DESIGN.md's `hero-band` + `field-dashboard-card`,
// extended into a seven-beat camera move. Scroll position *is* the camera: nothing
// autoplays, nothing loops, and the whole thing is inert without user scroll — which
// keeps it on the right side of the anti-slop rule against "constant page-wide
// parallax" while still giving the hero the product tour it needs.
//
// Built with CSS 3D transforms (perspective + translate3d), not WebGL — same
// simplicity principle as ProductComposite, no new dependency.
//
// Every surface shown is the real Bay Sentinel / Coastal Framing demo fixture data
// already used in /demo. No fabricated screens, no invented metrics (product spec §52).
//
// Accessibility: `prefers-reduced-motion` and viewports under 900px skip the flight
// entirely and render the Call-Ready Brief surface statically.

const SCENE_COUNT = 7;
const SPACING = 2400;
const HOME_X = [0, -150, 200, -100, 180, -80, 0];
const HOME_Y = [0, 40, -20, 30, 40, -30, 0];
const DWELL = 0.22;

const RAIL = ['List', 'Workspace', 'Research', 'Brief', 'Post-call', 'Memory', 'Scout'];

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const smooth = (t: number) => t * t * (3 - 2 * t);

export function FlightHero() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<HTMLDivElement>(null);
  const skyOutRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const stage = stageRef.current;
    if (!wrap || !stage) return;

    const scenes = Array.from(wrap.querySelectorAll<HTMLElement>('[data-scene]'));
    const copies = Array.from(wrap.querySelectorAll<HTMLElement>('[data-copy]'));
    const dots = Array.from(wrap.querySelectorAll<HTMLElement>('[data-dot]'));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let lastP = -1;
    let lastW = -1;
    let cur: number | null = null;

    function goTo(i: number) {
      const total = wrap!.offsetHeight - window.innerHeight;
      const p = clamp(i / (SCENE_COUNT - 1), 0, 1);
      const base = window.scrollY + wrap!.getBoundingClientRect().top;
      window.scrollTo({ top: base + total * p, behavior: 'smooth' });
    }

    const onDot = dots.map((row, i) => {
      const h = () => goTo(i);
      row.style.cursor = 'pointer';
      row.addEventListener('click', h);
      return h;
    });

    function onKey(e: KeyboardEvent) {
      if (reduced) return;
      const r = wrap!.getBoundingClientRect();
      if (r.top > 4 || r.bottom < window.innerHeight - 4) return;
      const at = Math.round(cur ?? 0);
      const k = e.key;
      if (k === 'ArrowDown' || k === 'PageDown' || k === ' ' || k === 'ArrowRight') {
        if (at >= SCENE_COUNT - 1) return;
        e.preventDefault();
        goTo(at + 1);
      } else if (k === 'ArrowUp' || k === 'PageUp' || k === 'ArrowLeft') {
        if (at <= 0) return;
        e.preventDefault();
        goTo(at - 1);
      } else if (k === 'Home') {
        e.preventDefault();
        goTo(0);
      }
    }
    window.addEventListener('keydown', onKey);

    function camIndex(p: number) {
      const t = p * (SCENE_COUNT - 1);
      const seg = clamp(Math.floor(t), 0, SCENE_COUNT - 2);
      const f = clamp(t - seg, 0, 1);
      const fe = smooth(clamp((f - DWELL / 2) / (1 - DWELL), 0, 1));
      return { seg, fe, v: seg + fe };
    }

    function update() {
      if (!wrap || !stage) return;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const rect = wrap.getBoundingClientRect();
      const p = clamp(-rect.top / (wrap.offsetHeight - vh || 1), 0, 1);
      // Damp the camera toward the scroll target so wheel/trackpad jitter and
      // keyboard jumps both read as one smooth move rather than a hard cut.
      const target = camIndex(p).v;
      if (cur === null) cur = target;
      const delta = target - cur;
      cur = Math.abs(delta) < 0.0008 ? target : cur + delta * 0.16;
      if (cur === target && p === lastP && vw === lastW) return;
      lastP = p;
      lastW = vw;

      if (reduced || vw < 900) {
        const s = Math.min(1, vw / 820, vh / 620);
        scenes.forEach((el, i) => {
          el.style.transform = 'translate(-50%,-50%)';
          el.style.opacity = i === 3 ? '1' : '0';
          el.style.visibility = i === 3 ? 'visible' : 'hidden';
        });
        copies.forEach((el, i) => {
          el.style.opacity = i === 0 ? '1' : '0';
          el.style.visibility = i === 0 ? 'visible' : 'hidden';
        });
        stage.style.transform = `scale(${s.toFixed(3)}) translateY(180px)`;
        if (railRef.current) railRef.current.style.display = 'none';
        if (hintRef.current) hintRef.current.style.opacity = '0';
        return;
      }

      const v = cur;
      const fit = Math.min(1, vh / 800, vw / 1150);
      // Beat 0 sits low in frame so the hero copy owns the top of the screen;
      // the world rises into place as the camera leaves for beat 1.
      const bias = (1 - clamp(v, 0, 1)) * Math.min(vh * 0.34, 290);
      const seg = clamp(Math.floor(v), 0, SCENE_COUNT - 2);
      const fe = clamp(v - seg, 0, 1);
      const camX = HOME_X[seg]! + (HOME_X[seg + 1]! - HOME_X[seg]!) * fe;
      const camY = HOME_Y[seg]! + (HOME_Y[seg + 1]! - HOME_Y[seg]!) * fe;
      const bell = Math.sin(clamp(fe, 0, 1) * Math.PI);
      const bank = ((HOME_X[seg + 1]! - HOME_X[seg]!) / 340) * bell * -2.6;
      const pitch = ((HOME_Y[seg + 1]! - HOME_Y[seg]!) / 340) * bell * 1.4;

      stage.style.transform = `translateY(${bias.toFixed(1)}px) scale(${fit.toFixed(3)}) rotateY(${bank.toFixed(3)}deg) rotateX(${pitch.toFixed(3)}deg)`;

      scenes.forEach((el, i) => {
        const dist = (i - v) * SPACING;
        let o: number;
        if (dist > 2300) o = 0;
        else if (dist > 700) o = smooth(1 - (dist - 700) / 1600);
        else if (dist < -800) o = 0;
        else if (dist < 0) o = smooth(1 + dist / 800);
        else o = 1;
        el.style.opacity = o.toFixed(3);
        el.style.visibility = o < 0.005 ? 'hidden' : 'visible';
        const x = HOME_X[i]! - camX;
        const y = HOME_Y[i]! - camY;
        el.style.transform = `translate(-50%,-50%) translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${(-dist).toFixed(1)}px)`;
      });

      copies.forEach((el, i) => {
        const o = clamp(1 - Math.abs(v - i) / 0.62, 0, 1);
        el.style.opacity = smooth(o).toFixed(3);
        el.style.visibility = o < 0.005 ? 'hidden' : 'visible';
        el.style.transform = `translateY(${((v - i) * 26).toFixed(1)}px)`;
        el.style.pointerEvents = o > 0.9 ? 'auto' : 'none';
      });

      dots.forEach((row, i) => {
        const active = Math.abs(v - i) < 0.5;
        const dot = row.firstElementChild as HTMLElement;
        const label = row.lastElementChild as HTMLElement;
        dot.style.background = active ? '#171717' : '#dcdee0';
        dot.style.transform = active ? 'scale(1.7)' : 'scale(1)';
        label.style.color = active ? '#171717' : '#cccccc';
      });

      if (skyRef.current)
        skyRef.current.style.opacity = clamp(1 - v / 1.1, 0, 1).toFixed(3);
      if (skyOutRef.current)
        skyOutRef.current.style.opacity = clamp((v - 4.6) / 1.4, 0, 1).toFixed(3);
      if (hintRef.current)
        hintRef.current.style.opacity = clamp(1 - v * 4, 0, 1).toFixed(3);
    }

    const loop = () => {
      update();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      dots.forEach((row, i) => {
        const h = onDot[i];
        if (h) row.removeEventListener('click', h);
      });
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative h-[700vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div
          ref={skyRef}
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 78% 58% at 50% -12%, var(--color-gradient-sky-light), transparent 68%)',
          }}
        />
        <div
          ref={skyOutRef}
          className="pointer-events-none absolute inset-0 opacity-0"
          style={{
            background:
              'radial-gradient(ellipse 88% 66% at 50% 112%, var(--color-gradient-sky-mid), transparent 62%)',
          }}
        />

        <div className="absolute inset-0" style={{ perspective: '1500px' }}>
          <div
            ref={stageRef}
            className="absolute top-1/2 left-1/2 h-0 w-0 will-change-transform"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <Scene index={0} className="w-[560px] overflow-hidden rounded-lg">
              <Spreadsheet />
            </Scene>
            <Scene index={1} className="w-[620px] overflow-hidden rounded-lg">
              <TargetList />
            </Scene>
            <Scene index={2} className="w-[700px]" bare>
              <Sources />
            </Scene>
            <Scene index={3} className="w-[720px] overflow-hidden rounded-xl">
              <Brief />
            </Scene>
            <Scene index={4} className="w-[640px] rounded-lg p-[30px]">
              <PostCall />
            </Scene>
            <Scene index={5} className="w-[780px]" bare>
              <Memory />
            </Scene>
            <Scene
              index={6}
              className="bg-surface-dark text-on-dark w-[700px] rounded-xl p-14"
              bare
            >
              <Positioning />
            </Scene>
          </div>
        </div>

        <div
          data-copy="0"
          className="absolute inset-x-0 flex flex-col items-center px-6 text-center will-change-transform"
          style={{ top: 'calc(64px + 5vh)' }}
        >
          <div className="text-muted font-mono text-[11px] font-medium tracking-[0.88px] uppercase">
            Field intelligence for sales teams
          </div>
          <h1
            className="text-ink mt-[18px] max-w-[880px] leading-[1.05] font-semibold tracking-[-0.03em]"
            style={{ fontSize: 'clamp(36px, 4.8vw, 64px)' }}
          >
            Turn your target list into a prospecting plan.
          </h1>
          <p className="text-body mt-5 max-w-[560px] text-base leading-relaxed">
            Scout researches the companies your reps want to target, surfaces the people
            and context that matter, organizes what your team already knows, and gives
            reps what they need to start calling.
          </p>
          <div className="mt-7 flex items-center gap-5">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="bg-primary text-on-primary hover:bg-primary-active inline-flex h-10 items-center rounded-md px-[18px] text-sm font-medium"
            >
              Request a Demo
            </a>
            <a
              href="#how-it-works"
              className="text-text-link text-sm font-medium hover:underline"
            >
              See how Scout works
            </a>
          </div>
          <div
            ref={hintRef}
            className="text-muted-soft mt-8 font-mono text-[11px] tracking-[0.88px] uppercase"
          >
            Scroll to fly in
          </div>
        </div>

        <Copy
          index={1}
          eyebrow="01 — Bring your list"
          title="The list becomes a workspace."
          body="Upload Excel or connect your existing system. Accounts become usable as soon as they're ready, not after the whole list finishes."
        />
        <Copy
          index={2}
          eyebrow="02 — Scout does the homework"
          title="Scattered signals, one page."
          body="Company websites, recent developments, relevant people, internal sales memory. Every claim keeps the source it came from."
        />
        <Copy
          index={3}
          eyebrow="03 — Start calling"
          title="30 seconds to call-ready."
          body="Everything important in one concise workspace — no five open tabs. What's known and what's inferred stay visibly different."
        />
        <Copy
          index={4}
          eyebrow="04 — Record what happened"
          title="One pass, not duplicate entry."
          body="Log the outcome, jot a rough note — Scout drafts the clean version, the account update and the follow-up together."
        />
        <Copy
          index={5}
          eyebrow="05 — Scout remembers"
          title="Memory that survives turnover."
          body="A departed rep's notes don't disappear with them. The next person picks up exactly where the account left off."
        />

        <div
          data-copy="6"
          className="absolute inset-x-0 bottom-[12vh] flex flex-col items-center text-center opacity-0 will-change-transform"
        >
          <div
            className="text-ink leading-[1.15] font-semibold tracking-[-0.03em]"
            style={{ fontSize: 'clamp(26px, 2.9vw, 36px)' }}
          >
            See it working on your own accounts.
          </div>
          <div className="mt-6 flex items-center gap-5">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="bg-primary text-on-primary hover:bg-primary-active inline-flex h-10 items-center rounded-md px-[18px] text-sm font-medium"
            >
              Request a Demo
            </a>
            <a
              href="/demo"
              className="text-text-link text-sm font-medium hover:underline"
            >
              Explore the demo workspace →
            </a>
          </div>
        </div>

        <div
          ref={railRef}
          className="absolute top-1/2 left-10 flex -translate-y-1/2 flex-col gap-4"
        >
          {RAIL.map((label, i) => (
            <div key={label} data-dot={i} className="flex items-center gap-3">
              <span className="bg-hairline-strong h-[5px] w-[5px] rounded-full transition-transform duration-300" />
              <span className="text-muted-soft font-mono text-[10px] tracking-[0.7px] uppercase transition-colors duration-300">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Scene({
  index,
  className,
  bare,
  children,
}: {
  index: number;
  className?: string;
  bare?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      data-scene={index}
      className={`absolute top-0 left-0 will-change-transform ${
        bare ? '' : 'border-hairline-strong bg-surface-card border'
      } ${className ?? ''}`}
      style={{
        transformStyle: 'preserve-3d',
        boxShadow: bare ? undefined : '0 34px 80px -36px rgba(23,23,23,0.32)',
      }}
    >
      {children}
    </div>
  );
}

function Copy({
  index,
  eyebrow,
  title,
  body,
}: {
  index: number;
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div
      data-copy={index}
      className="absolute bottom-[14vh] left-[7vw] max-w-[380px] opacity-0 will-change-transform"
    >
      <div className="text-muted font-mono text-[11px] tracking-[0.88px] uppercase">
        {eyebrow}
      </div>
      <div
        className="text-ink mt-[14px] leading-[1.15] font-semibold tracking-[-0.03em]"
        style={{ fontSize: 'clamp(26px, 2.9vw, 36px)' }}
      >
        {title}
      </div>
      <p className="text-body mt-[14px] text-base leading-relaxed">{body}</p>
    </div>
  );
}

const SHEET_ROWS = [
  ['1', 'Ridgeline Builders', 'Oakland', 'Construction'],
  ['2', 'Coastal Framing Co', 'San Mateo', 'Construction'],
  ['3', 'Anderson & Sons Construction', 'Hayward', 'Construction'],
];

function Spreadsheet() {
  return (
    <>
      <div className="border-hairline bg-canvas-soft flex items-center justify-between border-b px-4 py-[11px]">
        <span className="text-muted font-mono text-[11px]">target-accounts.xlsx</span>
        <span className="text-muted-soft font-mono text-[11px]">197 rows</span>
      </div>
      <div className="text-body grid grid-cols-[34px_1fr_130px_118px] font-mono text-[11px]">
        {['', 'Company', 'City', 'Segment'].map((h, i) => (
          <div
            key={i}
            className="border-hairline bg-canvas-soft text-muted border-b px-3 py-[7px]"
          >
            {h}
          </div>
        ))}
        {SHEET_ROWS.map((r) => (
          <Fragmentish key={r[0]} row={r} />
        ))}
        <div className="bg-canvas-soft text-muted-soft px-2 py-[9px]">4</div>
        <div className="text-muted-soft px-3 py-[9px]">…194 more rows</div>
        <div className="px-3 py-[9px]" />
        <div className="px-3 py-[9px]" />
      </div>
    </>
  );
}

function Fragmentish({ row }: { row: string[] }) {
  return (
    <>
      <div className="border-hairline-soft bg-canvas-soft text-muted-soft border-b px-2 py-[9px]">
        {row[0]}
      </div>
      <div className="border-hairline-soft text-ink border-b px-3 py-[9px]">{row[1]}</div>
      <div className="border-hairline-soft border-b px-3 py-[9px]">{row[2]}</div>
      <div className="border-hairline-soft border-b px-3 py-[9px]">{row[3]}</div>
    </>
  );
}

const ACCOUNTS = [
  {
    name: 'Ridgeline Builders',
    meta: 'Oakland, CA · updated 3 days ago',
    tag: 'Strong Context',
    dot: 'bg-semantic-success',
  },
  {
    name: 'Coastal Framing Co',
    meta: 'San Mateo, CA · checked today',
    tag: 'Strong Context',
    dot: 'bg-semantic-success',
  },
  {
    name: 'Anderson & Sons Construction',
    meta: 'Hayward, CA · updated 8 days ago',
    tag: 'Useful Context',
    dot: 'bg-text-link',
  },
  {
    name: 'Harbor Point Mechanical',
    meta: 'Richmond, CA · processing',
    tag: 'Limited Data',
    dot: 'bg-muted',
  },
];

function TargetList() {
  return (
    <>
      <div className="border-hairline flex items-center justify-between border-b px-[22px] py-4">
        <div className="text-muted font-mono text-[11px] tracking-[0.88px] uppercase">
          Construction — Bay Area
        </div>
        <div className="text-body font-mono text-[11px]">
          83 / 197 worked · 17 ready · 12 processing
        </div>
      </div>
      {ACCOUNTS.map((a, i) => (
        <div
          key={a.name}
          className={`flex items-center justify-between px-[22px] py-[14px] ${
            i < ACCOUNTS.length - 1 ? 'border-hairline border-b' : ''
          } ${i === 1 ? 'bg-canvas-soft' : ''}`}
        >
          <div className="flex flex-col gap-[3px]">
            <span className="text-ink text-base font-semibold">{a.name}</span>
            <span className="text-muted text-[13px]">{a.meta}</span>
          </div>
          <span className="text-body flex items-center gap-[7px] text-[13px]">
            <span className={`h-1.5 w-1.5 rounded-full ${a.dot}`} />
            {a.tag}
          </span>
        </div>
      ))}
    </>
  );
}

const SOURCES = [
  {
    title: 'Job board posting',
    body: '3 site-supervisor roles opened in 30 days.',
    shift: '-30px',
  },
  {
    title: 'Company newsroom',
    body: 'New Bay Area office announced for Q3.',
    shift: '26px',
  },
  {
    title: 'CRM account record',
    body: 'Contract renewal lands around October.',
    shift: '-14px',
  },
];

function Sources() {
  return (
    <>
      <div className="grid grid-cols-3 gap-[18px]">
        {SOURCES.map((s) => (
          <div
            key={s.title}
            className="border-hairline-strong bg-surface-card rounded-lg border p-5"
            style={{
              transform: `translateY(${s.shift})`,
              boxShadow: '0 20px 50px -28px rgba(23,23,23,0.26)',
            }}
          >
            <div className="text-muted font-mono text-[11px] tracking-[0.88px] uppercase">
              Source
            </div>
            <div className="text-ink mt-2.5 text-base font-semibold">{s.title}</div>
            <div className="text-body mt-1.5 text-sm leading-relaxed">{s.body}</div>
          </div>
        ))}
      </div>
      <div className="mt-[30px] flex justify-center">
        <div className="bg-surface-dark text-on-dark min-w-[360px] rounded-lg px-[26px] py-[22px]">
          <div className="text-on-dark-soft font-mono text-[11px] tracking-[0.88px] uppercase">
            What Matters
          </div>
          <ul className="mt-3 flex list-none flex-col gap-2 p-0 font-mono text-[13px] leading-relaxed">
            <li>· Posted 3 new site-supervisor roles in 30 days</li>
            <li>· New Bay Area office, Q3</li>
            <li>· Contract renewal ~Oct</li>
          </ul>
        </div>
      </div>
    </>
  );
}

function Brief() {
  return (
    <>
      <div className="border-hairline bg-canvas-soft flex items-center gap-[7px] border-b px-[18px] py-3">
        <span className="bg-hairline-strong h-2 w-2 rounded-full" />
        <span className="bg-hairline-strong h-2 w-2 rounded-full" />
        <span className="bg-hairline-strong h-2 w-2 rounded-full" />
        <span className="text-muted ml-3 font-mono text-[11px]">
          scout.app/accounts/coastal-framing
        </span>
      </div>
      <div className="px-[34px] pt-[30px] pb-[34px]">
        <div className="text-ink text-[28px] font-semibold tracking-[-0.84px]">
          Coastal Framing Co
        </div>
        <div className="text-body mt-[5px] text-sm">
          San Mateo, CA · coastalframing.com · checked today
        </div>

        <SectionLabel className="mt-[26px]">What They Do</SectionLabel>
        <div className="text-ink mt-2 max-w-[560px] text-base leading-relaxed">
          Small commercial framing contractor, 10–20 employees, owner-operated.
        </div>

        <SectionLabel className="mt-6">People</SectionLabel>
        <div className="mt-2.5 flex items-center gap-2.5">
          <span className="text-ink text-base font-semibold">Angela Brooks</span>
          <Pill>DECISION MAKER</Pill>
          <Pill>KNOWN</Pill>
        </div>
        <div className="mt-[9px] flex items-center gap-2.5">
          <span className="text-ink text-base font-semibold">Marcus Reed</span>
          <Pill>INFLUENCER</Pill>
          <Pill variant="outline">INFERRED</Pill>
        </div>

        <SectionLabel className="mt-6">Sources</SectionLabel>
        <div className="text-text-link mt-2 flex gap-4 text-[13px]">
          <span>Job board posting ↗</span>
          <span>Company newsroom ↗</span>
          <span>CRM account record ↗</span>
        </div>
      </div>
    </>
  );
}

function PostCall() {
  return (
    <>
      <SectionLabel>What You Typed</SectionLabel>
      <div className="bg-surface-strong text-ink mt-2.5 rounded-md px-[18px] py-4 font-mono text-[13px] leading-relaxed">
        talked to angela direct. owner. said theyve been thinking about upgrading cameras
        across new job sites. meeting wed 2pm
      </div>
      <div className="text-muted-soft mt-[18px] text-center font-mono text-[11px] tracking-[0.88px] uppercase">
        Scout cleans this up
      </div>
      <SectionLabel className="mt-[18px]">Clean CRM Note</SectionLabel>
      <div className="border-hairline-strong text-body mt-2.5 rounded-md border px-[18px] py-4 text-[15px] leading-relaxed">
        Spoke directly with Angela Brooks (Owner). Considering a camera upgrade across new
        job sites. Meeting booked Wednesday 2:00pm.
      </div>
      <div className="mt-[18px] flex gap-2">
        <span className="bg-surface-strong text-semantic-success rounded-full px-2.5 py-[3px] font-mono text-[11px] tracking-[0.88px]">
          MEETING BOOKED
        </span>
        <Pill>FOLLOW-UP DRAFTED</Pill>
      </div>
    </>
  );
}

const MEMORY = [
  ['Coastal Framing Co', '4 notes · 2 reps'],
  ['Ridgeline Builders', '7 notes · 3 reps'],
  ['Anderson & Sons', '2 notes · 1 rep'],
  ['Harbor Point Mech.', '1 note · 1 rep'],
  ['Bay Sentinel Security', '9 notes · 4 reps'],
  ['Delta Interiors', '3 notes · 2 reps'],
  ['Marin Glassworks', '5 notes · 2 reps'],
  ['Peninsula Roofing', '2 notes · 1 rep'],
];

function Memory() {
  return (
    <>
      <div className="grid grid-cols-4 gap-[14px]">
        {MEMORY.map(([name, meta], i) => (
          <div
            key={name}
            className={`rounded-md p-[14px] ${
              i < 4
                ? 'border-hairline-strong bg-surface-card border'
                : 'border-hairline bg-canvas-soft border'
            }`}
          >
            <div
              className={`text-[13px] font-semibold ${i < 4 ? 'text-ink' : 'text-body'}`}
            >
              {name}
            </div>
            <div
              className={`mt-[5px] font-mono text-[11px] ${i < 4 ? 'text-muted' : 'text-muted-soft'}`}
            >
              {meta}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-[14px] grid grid-cols-4 gap-[14px] opacity-45">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="border-hairline-soft bg-canvas-soft h-[58px] rounded-md border"
          />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-4 gap-[14px] opacity-[0.18]">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="border-hairline-soft bg-canvas-soft h-[46px] rounded-md border"
          />
        ))}
      </div>
    </>
  );
}

function Positioning() {
  return (
    <>
      <div className="text-on-dark-soft font-mono text-[11px] tracking-[0.88px] uppercase">
        Built for work around the call
      </div>
      <div className="mt-5 font-mono text-[22px] leading-[1.7]">
        Spend less time researching accounts and writing notes. Spend more time selling.
      </div>
    </>
  );
}

function SectionLabel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`text-muted font-mono text-[11px] tracking-[0.88px] uppercase ${className}`}
    >
      {children}
    </div>
  );
}

function Pill({
  children,
  variant = 'solid',
}: {
  children: React.ReactNode;
  variant?: 'solid' | 'outline';
}) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 font-mono text-[11px] tracking-[0.88px] ${
        variant === 'outline'
          ? 'border-hairline-strong text-body border'
          : 'bg-surface-strong text-ink'
      }`}
    >
      {children}
    </span>
  );
}
