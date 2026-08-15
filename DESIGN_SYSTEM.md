# WTS Design System

Locked before any component code, per the design directive. Every future
session/subagent touching UI reads this file first — check it in explicitly,
don't re-derive "what looks reasonable" from scratch.

## Grounding (Section 3)

**Subject:** a fintech product team's command center, where the real content
is routing, settlement, and approval flows moving through states — not
generic tickets in a generic tracker.
**Audience:** a small product team (PM plus the people they work with day to
day), opening this every morning before anything else. Personal views (My
Day, My Work, Inbox) stay scoped to whoever's signed in; everything else
(Projects, Tasks, People, Vendors) is shared across the team.
**Dashboard's single job:** answer "what needs me right now," calmly — not a
trading-floor wall, not an alarm panel.

## What we are deliberately not (Sections 1–2)

- **Not Jira** — no saturated corporate blue (#0052CC-class) as a dominant
  fill, no boxy dense card grids, no avatar-chip clusters, no blue "Create"
  button pinned top-left, no table-as-default-view.
- **Not Slack** — no aubergine/purple, no rounded chat-bubble surfaces, no
  hash-channel sidebar pattern, no "friendly rounded sans everywhere," no
  thread-in-right-panel as the universal detail view.
- **Not Salesforce** — no corporate blue/white, no stacks of nested cards,
  no breadcrumb-heavy nav, no tab-strip-over-everything.
- **Not generic-AI default #1** (cream bg + serif display + terracotta) —
  we're dark-first graphite, not cream; accent is blue/green/amber/coral,
  not terracotta; the serif is restrained to one moment, not the display
  voice throughout.
- **Not generic-AI default #2** (near-black + single acid accent, no other
  structure) — we have real structure: a 4-color semantic system, a
  dedicated numeric face, and a signature flow visualization. One accent
  color alone would be a tell; we deliberately have more going on than that.
- **Not generic-AI default #3** (newspaper hairlines, zero border-radius) —
  we use soft-rounded surfaces and generous whitespace deliberately, the
  opposite of that look.

## Color

90% neutral / 10% accent. Six named hex values; surfaces and muted text are
derived from these two via opacity, not separately named tokens.

| Name | Hex | Role |
|---|---|---|
| Graphite | `#14161B` | Base background. Near-black with a faint cool blue-violet undertone — never pure `#000`. Surfaces are Bone at ~4–6% laid over this. |
| Bone | `#EDEAE1` | Primary text / foreground. Warm off-white, not stark white. Muted text is Bone at ~55–65% opacity. |
| Route | `#4C7EF0` | The "in motion" accent — active states, primary actions, links, focus rings, and the traveling dots in the Routing Line. Indigo-leaning on purpose, used sparingly as line/dot/text, never as a large saturated fill (that's the thing that would read as Jira). |
| Settled | `#34C77E` | Healthy / on-track / completed. |
| Signal Amber | `#EFA23D` | At-risk. Used only for that state — not a general "warning" color elsewhere. |
| Ledger Coral | `#EA5B4B` | Blocked / critical. Warmer than alarm-red on purpose — keeps the "personal console" tone instead of a NOC wall. |

## Type

Three faces, three jobs — never interchange them.

- **Display — Fraunces** (variable). Used with real restraint: the dashboard
  greeting and section-opening moments only. This is the one place character
  shows; if it starts showing up in buttons or table headers, pull it back.
- **Body — Inter.** Everything functional: labels, nav, body copy, form
  fields.
- **Numeric / Data — IBM Plex Mono**, tabular figures. Every number that
  matters — currency, percentages, success rates, dates in dense tables —
  and task/project keys render in this face, never the body font. This is
  the typographic expression of Section 3: numbers are the actual subject
  matter here, so they look different from prose.

## Layout concept

**Dashboard — "the morning ledger."** One sentence of Fraunces greeting with
a real status line (not "Good afternoon" alone), then the Routing Line hero,
then an attention strip, then sections in descending priority. No uniform
grid of identical stat cards as the first thing you see.

```
┌────────────────────────────────────────────────────────────┐
│  Good afternoon, Divyam.                        [⌘K]  [+]   │
│  Fraunces, 32px — "3 things are waiting on you today."      │
│                                                               │
│  ── THE ROUTING LINE ──────────────────────────────────────  │
│  Backlog ○──○──○━━●───○──○  In Motion  ⋯  Waiting  ⋯  Done   │
│  (today's work as traveling nodes, colored by health)        │
│                                                               │
│  ⚠ ATTENTION   3 overdue · 2 follow-ups due · 1 blocked      │
│  ─────────────────────────────────────────────────────────  │
│  MY DAY                    │  PROJECTS                       │
│  Must do (3)                │  Dynamic PG Routing  ●68% ROUTE │
│  Should do (2)               │  Reconciliation Eng. ●42% AMBR │
│  ─────────────────────────────────────────────────────────  │
│  WAITING FOR          UPCOMING                                │
└────────────────────────────────────────────────────────────┘
```

**Project Cockpit — a full workspace, not a drawer.**

```
┌────────────────────────────────────────────────────────────┐
│  ← Projects                                                  │
│  Dynamic PG Routing                          PGR   [On Track]│
│  Fraunces name · Plex Mono key stamped bottom-left           │
│  ○──○──○──●━━━○──○  68%  (Routing Line, project-scoped)      │
│  ─────────────────────────────────────────────────────────  │
│  Overview  Board  Tasks  Timeline  Risks  Decisions  Docs  ⋯ │
│  ─────────────────────────────────────────────────────────  │
│  Next action        Blockers        Waiting for               │
│  Team                Recent activity  PM work (this project)  │
└────────────────────────────────────────────────────────────┘
```

## Signature element (Section 5): the Routing Line

One bold, deliberate risk, everything else stays quiet around it.

A horizontal flow/stage visualization — stations connected by a line, with
small nodes traveling along it, colored by health (Route/Settled/Amber/
Coral). It replaces **two** generic defaults at once:

1. The dashboard hero stat-card row → becomes a live view of today's work
   actually moving through states (To Do → In Motion → Waiting → Done).
2. The colored-dot / badge health indicator used everywhere else → becomes
   a compact line segment (a short arc showing position + health color)
   wherever project/task health appears — project cards, the Cockpit
   header, list rows.

This is directly grounded in Section 3: routing and state transitions are
literally what this PM's job is about, so the dashboard's one bold gesture
is that mechanism made visible, not a decorative flourish.

**Task/project keys** (`PGR-114`) get a matching "stamped ledger" treatment
instead of the standard gray monospace chip: Plex Mono, wide letter-spacing,
a thin baseline rule underneath like a receipt line-item, Route-colored on
hover — a small typographic signature, not a badge component.

## Motion

One orchestrated moment > many micro-animations. The Routing Line's nodes
animate deliberately (state transitions, task completion) — that's where
motion budget goes. Page transitions and everything else are quiet CSS
transitions (150–200ms). `prefers-reduced-motion` disables node travel
animation and falls back to static position. No scattered hover-bounce,
no confetti, no per-card entrance stagger — those read as AI-generated
by default now.

## Restraint rules

- Palette stays ~90% neutral / 10% accent — verify this per-screen, not just
  in the token file.
- Keyboard focus states visible throughout (Route-colored ring).
- Responsive down to laptop width; desktop-primary, not mobile-first.

## Copy voice (Section 7)

- Name things by what the PM controls: "Follow-ups," not "webhook triggers."
- Active voice, consistent verbs end-to-end: "Archive task" → toast reads
  "Task archived. Undo" — never "Item removed."
- Empty states are invitations with a real next step, warm but specific —
  never "No data found."
- Errors say what happened and how to fix it, in-voice — never a raw stack
  trace, never apologetic filler.

## Screen self-audit log (Section 8)

Done as a full visual pass at the end of Phase 7, after every screen in the
build was working, rather than screen-by-screen during the build — in
practice each screen was checked against this file's tokens as it was
built (six named colors, three type roles, Routing Line as the one bold
element), and this is the final audit against Sections 1/2/5 specifically.

**Dashboard.** Not Jira/Slack/Salesforce — no saturated blue block, no
avatar-chip cluster, no breadcrumb/tab chrome; the first thing after the
greeting is the Routing Line, not a stat-card grid. Not a generic-AI
default — dark graphite (not cream), Route/Settled/Amber/Coral are all
visible in one view (blocked chip, follow-up chip, project health dots),
soft-rounded cards (not newspaper hairlines). Boldness is concentrated in
the Routing Line; everything below it (My Day list, project cards,
waiting-for) is deliberately quiet. Distinctive at a glance — the Routing
Line hero and stamped task keys aren't something a generic SaaS dashboard
has.

**Project Cockpit.** The tab strip is real risk territory for reading as
Salesforce, but it's contained to exactly one screen (per spec's own
allowance) rather than the navigation pattern for the whole app. Health/
status render as colored dropdown chips + a compact Routing Line progress
bar, not Jira-style badges. The "System suggests: At risk — reason. Apply?"
nudge is a WTS-specific touch no generic tracker has. Boldness stays
subdued here (thin compact Routing Line, not the full hero) — correct,
since the Dashboard already spent that budget.

**Task Kanban (Tasks board / Cockpit board tab).** The most honest area of
residual resemblance: a column board of cards is structurally a Kanban
board, and Kanban-as-a-pattern is Jira/Trello's home turf — this isn't
fixable without dropping Kanban entirely, which the master prompt
explicitly requires ("Task Kanban" is a named deliverable). Mitigated
rather than eliminated: task keys use the stamped-ledger mono treatment
instead of the standard gray chip, priority renders as a colored dot pill,
columns use the semantic Route/Amber/Coral palette instead of generic
gray/blue. Boldness is deliberately absent here — no Routing Line inside
the board — which is correct restraint, but it does mean this screen relies
entirely on the smaller signature touches (key stamp, priority dot) to
stay distinctive. Verdict: acceptable given the pattern is spec-mandated,
but it's the screen an outside reviewer is most likely to say "this is a
kanban board" about, and that's a fair read.

**Task Drawer.** A right-side drawer is a common shape across Linear/Jira/
Notion, but the field layout (inline selects for status/priority/assignee/
due, not a dense form grid) and the stamped key at the top keep it from
reading as a Jira issue modal specifically. Quiet by design — detail views
shouldn't compete with the Routing Line — with the key stamp as the one
distinctive touch.

**Command Palette.** Followed Section 5's explicit allowance to use the
Raycast/Linear pattern well rather than reinvent it — cmdk styled with our
tokens (Route accent, Plex Mono shortcut hints). The "Ask AI: '<query>'"
entry and the "Show me" quick-filters (Overdue/Blocked/Waiting/Due today)
are WTS-specific additions on top of the standard pattern, not a generic
Raycast clone.

**Overall:** the palette stays roughly 90/10 neutral-to-accent across every
screen checked, the Routing Line is the only screen element that gets the
"bold" treatment, and nothing here would be mistaken for Jira, Slack, or
Salesforce in a specific, nameable way — with the one caveat that the
Kanban board, taken in isolation, reads as "a kanban board" the way any
Kanban board does, which is inherent to the pattern rather than a lapse in
execution.
