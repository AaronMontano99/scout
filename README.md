# Ferret

**Try the live demo: [ferret-demo.vercel.app](https://ferret-demo.vercel.app)**

Every company in the demo is made up, and nothing you do there is saved, so click around and break things. Want your own? Jump to [Build your own Ferret](#build-your-own-ferret).

## Why it's called Ferret

Ferrets have an incredible sense of smell. They can sniff out just about anything, and finding leads is basically that: digging around until you find the one thing worth following. So a CRM that sniffs out leads got named after a ferret. It's a funny name, and it fits.

## Why I built it

I work in technology sales and prospecting is most of my week. I wanted a real reason to reach out to someone, not just calling to call, and I wanted one place to see what I'm working on and what to do next.

So I built my own. Ferret started as call prep, then grew into a full CRM with dashboards, a board for hot accounts, a calendar, and reports on what's actually working. Every number in it is a count of what you logged. Nothing is scored or estimated.

If you don't have anything in place for your own business, or what you have doesn't fit how you work, you can use this as a starting point.

> Prospect = worth contacting. Lead = meeting booked. The first sale is the meeting.

---

## How it works

### Overview
The home page: this week against last, your last 8 weeks of work, what to do
next, your hottest accounts, your call funnel, and recent activity. **Every
number is a count of what you logged.** Nothing is scored, and a rate with
nothing to divide by shows a dash, not 0%.

Press **⌘K** anywhere to jump to an account or do anything, or use the dock at
the bottom. **Log a touch** takes about ten seconds and needs no AI run.

### Calls
Type **"I'm calling ___"**, paste your CRM notes if you have any, and add
anything else ("calling the local office, not the old contact").

Ferret researches the company first (the local office and ZIP, who
decides, dated signals like hiring, new leaders, moves, acquisitions),
labels the reason to call **HARD SIGNAL / SOFT SIGNAL / NO RECENT
SIGNAL** with an honest "why now", reads your notes, and hands back the
**call card**:

`REASON · HYPOTHESIS · PRIMARY QUESTION · FOLLOW-UP · LISTEN FOR · ANGLE · MEETING BRIDGE · MEETING ASK`

plus the opening line, if/then branches, a 20-40 second voicemail, what
to ask a gatekeeper, the 10-minute meeting to earn, and what to do if
nobody picks up.

**After the call**, paste what happened for sales-manager coaching,
bullet CRM notes, a post-call email when there's a real reason, and the
Hot List update. "No answer" / "Left VM" are one tap and give you a
tracker line; repeated no-pickups move the account to walk-in.

**Today's leads** lives on the Calls tab: net-new accounts in your ZIPs
with a dated reason to call. It never repeats one and never pads a weak
batch.

### Emails
Type **"I'm emailing ___"** and paste your notes. Ferret finds the real
signal for **why now**, reopens the exact unfinished thread (or leads
with a signal for net-new), and writes the email: 60-100 words, one
angle, one 15-minute ask. When more information is needed first, it
writes a question-first email instead; when email is the wrong move
(the contact left), it says call first.

The **email log** shows every company you've emailed: status (sent and
awaiting reply, replied, meeting booked, call first, skipped), whether
it's **qualified IN or OUT** and why, and the next step. Mark accounts
in or out yourself with a reason.

### Hot List
Your Qualified-IN accounts: worth working, no meeting yet. It updates
itself from calls, emails, and pasted notes. Each row answers *what did
I learn last time, and what do I need to learn next to earn the
meeting?* ACT NOW / DUE / UPCOMING / LATER flags keep today on top.
Drag cards across the board, switch to the list view, and export to Excel
with filter dropdowns. Dragging to Meeting booked asks you to log the meeting,
because a meeting has to be logged to count.

### Accounts
Every company Ferret knows, as a grid or table: contact, stage, signal, last
contact, touches. Star the ones you care about, filter, search, export CSV.
Each account has its own page with interaction history, tasks, research, and
notes.

### Schedule
Month and week calendar, today's agenda, and overdue work. Tasks you add sit
next to Hot List next touches, which show up on their own. Reschedule from the
`...` menu, or move the whole backlog to today, with Undo on all of it.

### Reports
4, 12, 26, or 52 weeks: activity by channel, call and email funnels, connect
rate by week, when people pick up, where meetings come from, and your
most-worked accounts. Exports to CSV.

### Day finished
A tracker-ready breakdown of only what you logged (dials, connects, DM
conversations, meeting asks, meetings, emails, replies), prospecting vs
admin, with a funnel read.

Ferret remembers each company's notes, research, and history so the next
touch builds on the last one.

---

## Build your own Ferret

Ferret is meant to be customized. Copy it, then change it until it fits how you sell.

**1. Get it running.** You need [Node 22+](https://nodejs.org).

```bash
git clone https://github.com/AaronMontano99/ferret.git my-crm
cd my-crm
npm install
npm run demo
```

Open **http://localhost:3001** to see it full of made-up companies. It's a local copy, so go ahead and experiment.

**2. Make it yours.** Everything you'd want to change first lives in one place:

| You want to change | Edit this |
|---|---|
| Colors, backgrounds, fonts | [`src/app/globals.css`](./src/app/globals.css), or the sliders icon in the app to try them live |
| Your name, territory, goals | Settings, inside the app |
| The tabs at the top | [`src/components/shell/nav.tsx`](./src/components/shell/nav.tsx) |
| Pipeline stages | [`src/domain/hot-list.ts`](./src/domain/hot-list.ts) |
| What counts as a call outcome | [`src/domain/quick-log.ts`](./src/domain/quick-log.ts) |
| Dashboard numbers | [`src/domain/metrics.ts`](./src/domain/metrics.ts) |
| The demo's fake companies | [`src/demo/seed.ts`](./src/demo/seed.ts) |
| How the AI thinks and writes | Your own playbooks in `private/`, see [Private content](#private-content-never-in-git) |

**3. Use it for real.** Run `npm run dev` and open **http://localhost:3000**. Your data stays in a file on your computer, in `data/`, which never goes to git.

The dashboards, Hot List, Accounts, Schedule, and logging all work without AI. Call cards and emails need the [Claude Code](https://claude.com/claude-code) CLI plus your own playbooks, because mine are private and aren't in this repo.

**4. Keep iterating.** The fastest way is to open the project in Claude Code and describe what you want: "my pipeline has these five stages", "I sell to dentists", "add a tab for renewals". Try something, look at it, change it again.

**5. Put up your own demo (optional).** Deploy to Vercel with `NEXT_PUBLIC_SCOUT_DEMO=1` set. That runs on made-up data in memory, with saving and AI turned off, so your real data never goes online.

## Private content (never in git)

Everything specific to you stays on your machine:

- **`private/`** (git-ignored) holds your playbooks and reference
  material, which Ferret loads word for word. You write your own, and
  these are the files it looks for:
  - `private/playbooks/calls.md`, `emails.md`, `hotlist.md`, `examples.md`
  - `private/reference/workflow.md`, `verticals.md`, `objections.md`, `sessions.md`, `training.md`

  Point `SCOUT_PRIVATE_DIR` somewhere else to keep them outside the repo.
  A test pins their exact text, so they can't change by accident.
- **Settings** (stored in the local database) hold your name, company,
  city, territory ZIPs, and callback number. The rules below use them.
- **`data/`** (git-ignored) holds the SQLite database: accounts, notes,
  research, drafts, activity.

## Rules enforced in code

What can be checked is enforced on every output, not just requested
from the AI. Anything that fails gets one automatic rewrite, and the
screen shows a ✓ or exactly what's off:

- **Emails** ([`email-style.ts`](./src/domain/email-style.ts)): your
  greeting and sign-off, 60-100 words, one closing 15-minute ask (or a
  question-first email), no dashes, bullets, or exclamation points, one
  angle, a plain subject, and no filler like "hope this finds you well",
  "just following up", "touching base", "quick chat".
- **Call cards** ([`call-style.ts`](./src/domain/call-style.ts)): your
  opening ("[Name], [you] with [company] here in [city]. Reason for my
  call..."), one primary question, max one follow-up, a low-risk
  10-minute ask (never "assessment"), 20-40 second voicemails, gatekeeper
  questions that route to the owner, no permission openers.
- **Territory** ([`territory.ts`](./src/domain/territory.ts)): computed
  from the actual ZIP against your Settings.
- **Never invented**: phones, emails, people, headcount, revenue,
  signals, pain, or referrals. Estimates say "est.", shaky facts say
  "unverified", and claims link to sources.

---

## Run it

```bash
npm install
npm run dev
```

Open **http://localhost:3000**, then fill in Settings (the gear).

Ferret calls the [Claude Code](https://claude.com/claude-code) CLI in
headless mode (`claude -p`) with web search, so it runs on whatever
Claude account the CLI is logged into. No API key; `ANTHROPIC_API_KEY`
is stripped so it never switches to API billing, and each call is
isolated from your own Claude Code setup. Pick Sonnet (faster) or Opus
(strongest writing) in Settings. A first call card or email takes about
a minute because it researches live; after that, research is reused for
14 days. Every run counts toward your Claude usage limits.

To see the dashboards full, run `npm run demo` and open
**http://localhost:3001**. It seeds a separate `data/demo.db` with made-up
companies and never touches your real database. Make the look your own with
the sliders icon in the dock: three looks, three backgrounds (surf penguins
included), four accents, three heading fonts.

The public demo runs from this same code with `NEXT_PUBLIC_SCOUT_DEMO=1`
([`src/demo/`](./src/demo)): made-up companies in an in-memory database, all
saving and AI turned off. It never reads `data/` or `private/`.

## Commands

```bash
npm run dev          # http://localhost:3000
npm run demo         # http://localhost:3001, made-up data
npm run build
npm run lint
npm run typecheck
npm run test         # needs Node 22+; on older Node: npx -y node@22 node_modules/vitest/vitest.mjs run
```

## How it's built

Next.js 16 + React 19, SQLite via `sql.js` (WASM), zod-validated AI output.

```
src/
  ai/providers/claude-cli-provider.ts  headless `claude -p` runner (web search, JSON schema output)
  ai/sdr/playbooks.ts                  loads the private playbooks + reference
  ai/sdr/prompts.ts                    playbooks + enforced rules → prompts
  ai/sdr/engine.ts                     research, call cards, emails, coaching, Hot List, leads
  ai/sdr/schemas.ts                    output shapes
  app/calls, app/emails                "I'm calling / emailing X"
  app/page.tsx, app/hot-list, app/accounts, app/schedule, app/reports
  app/day, app/settings
  app/api/sdr/route.ts                 long AI runs (never block the UI)
  app/actions.ts                       quick saves
  components/sdr/                      call card, email + log, after-the-call, Hot List, research, leads
  components/dashboard/                Overview, charts, accounts, schedule
  components/shell/                    nav, dock, search, sheets, toasts, look tweaks
  data/                                accounts, notes, research, drafts, activity, Hot List, settings
  domain/                              email + call rules, territory, identity, Hot List, email log, day summary,
                                       metrics, schedule, alerts, quick log
db/schema.sql                          schema, applied at startup
scripts/                               demo data
tests/                                 rules, Hot List, email log, day summary, data layer, schema
```
