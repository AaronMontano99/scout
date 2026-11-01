# Scout

**A Lead SDR for calls and emails.** Before you pick up the phone or hit
send, Scout does the intelligence work, so there's a real reason you're
reaching out, not just calling to call.

It runs your own prospecting playbooks word for word on your Claude
membership, with live web research.

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

Scout researches the company first (the local office and ZIP, who
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
Type **"I'm emailing ___"** and paste your notes. Scout finds the real
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
Every company Scout knows, as a grid or table: contact, stage, signal, last
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

Scout remembers each company's notes, research, and history so the next
touch builds on the last one.

---

## Private content (never in git)

Everything specific to you stays on your machine:

- **`private/`** (git-ignored) holds your playbooks and reference
  material, which Scout loads word for word:
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

Scout calls the [Claude Code](https://claude.com/claude-code) CLI in
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
