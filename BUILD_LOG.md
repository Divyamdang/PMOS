# PMOS Build Log

Read this first if context has reset. Read [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)
too — it's locked and every UI decision should check against it, not against
"what normal SaaS looks like."

## Stack decisions (deviations from the brief)

- **Prisma 6.19.3, not 7.** Prisma 7's SQLite path requires driver adapters
  (`@prisma/adapter-*`) and moves `datasource.url` out of the schema —
  unnecessary complexity for a local-first single-user app. Pinned to 6.x for
  the standard `prisma-client-js` + `DATABASE_URL` flow. If ever upgrading,
  follow Prisma's v7 migration guide deliberately, not by accident via `npm i
  prisma@latest`.
- **Server Actions instead of a REST API layer.** All mutations live in
  `src/app/actions/*.ts` (`"use server"`), called directly from client
  components. Reads happen directly in Server Components via `src/lib/db.ts`
  (Prisma singleton) or `src/lib/queries/*.ts`. No `/api` routes were built
  for CRUD — keeps the app idiomatic App Router and avoids the infra the
  master prompt says to avoid.
- Package name is `pmos` (the folder name `Product SAAS` isn't
  npm-name-legal, so `create-next-app` was scaffolded elsewhere and copied
  in, then `package.json`'s `name` field fixed).
- `db:seed` / `db:reset` / `db:studio` npm scripts added; `prisma.seed`
  config in `package.json` uses `tsx prisma/seed.ts`.

## Phase 1 — Foundation ✅

Next.js 16 (App Router, TS, Tailwind v4) + shadcn/ui (new-york style) +
Prisma 6 + SQLite. Full schema in `prisma/schema.prisma` covering every
entity in the spec (User, Project, Initiative, Workstream, Task w/
subtasks+dependencies+comments+attachments, Person, Vendor, FollowUp,
WaitingForItem, Meeting+ActionItem, Decision, Risk, Release, Document w/ PRD
fields, Metric, Incident, InboxItem, ActivityEvent, Settings).

App shell: `Sidebar` + `TopBar` + `CommandPalette` (⌘K, cmdk) +
`KeyboardShortcuts` (global C/P/D/F/W/N//) + `QuickCapture` dialog +
`TaskDrawer`, all mounted once in `src/components/layout/app-shell.tsx` via
the `(app)` route group layout. Design tokens live as CSS variables in
`src/app/globals.css`, matching DESIGN_SYSTEM.md exactly (six named accents,
Fraunces/Inter/IBM Plex Mono, light+dark).

Seed script (`prisma/seed.ts`) populates the flagship "Dynamic PG Routing"
(PGR) project plus 4 lighter-seeded projects, 5 people, 5 vendors, a risk, a
waiting-for item, follow-ups, a meeting with action items, a decision, a PRD
document, and a metrics time series — per master prompt Section 7.

Reusable components built so far: `RoutingLine` / `RoutingLineCompact` (the
signature element), `TaskKeyStamp`, `PriorityBadge` / `TaskStatusBadge` /
`ProjectStatusBadge` / `HealthLabel`, `EmptyState` / `LoadingState` /
`ErrorState`, `ProjectCard`, `TaskRow`, `TaskCard`, `KanbanBoard` (generic,
dnd-kit), `TaskDrawer`.

**Known issue fixed during build:** `TaskRow` originally wrapped a `<button>`
around shadcn's `Checkbox` (itself a `<button role="checkbox">`) — invalid
HTML, caused a real hydration crash. Fixed by making the row a
`div[role=button]` with keyboard handling. `TaskCard` has a similar (milder)
issue — it sits inside `KanbanBoard`'s draggable wrapper, which also gets
`role="button"` from dnd-kit's `attributes`, so there are two nested
`role="button"` elements (both real `<div>`s, not real `<button>`s — no HTML
violation, no crash, just a minor a11y redundancy). Not fixed yet; low
priority, revisit during the Phase 7 accessibility pass.

## Phase 2 — Core PM ✅

- **Dashboard** (`src/app/(app)/dashboard/page.tsx`): Fraunces greeting +
  dynamic status line, Routing Line hero (today's active tasks as nodes),
  attention strip, My Day panel, Projects panel, Waiting-for panel, Upcoming
  meetings panel.
- **Projects** list (`/projects`): Kanban (default, drag-and-drop via
  dnd-kit) + list view toggle, search, New Project dialog.
- **Project Cockpit** (`/projects/[key]`): header with health/status
  dropdowns + a "system suggests" health nudge
  (`computeHealthSuggestion`), Routing Line compact progress bar, 8 tabs
  (Overview/Board/Tasks/Timeline/Risks/Decisions/Documents/Activity) all
  wired to real data. Overview matches the DESIGN_SYSTEM.md wireframe: next
  action, blockers, waiting-for, PM work, recent activity.
- **Tasks** (`/tasks`): global board/list toggle, filter chips
  (All/Overdue/Blocked/Today/Mine) wired to `?filter=` from the command
  palette, project filter, sortable list columns, New Task dialog.
- **Task Drawer**: full detail (status/priority/assignee/due date,
  description, subtasks with add, dependencies, comments, activity feed),
  opens from any TaskRow/TaskCard via a Zustand store
  (`src/lib/store/ui-store.ts`), not routing — stays a true drawer per spec.

**Bug fixed during build:** overdue calculations in
`src/lib/queries/project.ts` and `computeHealthSuggestion` originally used
exact-`Date.now()` comparison instead of start-of-day, so a task due "today"
could wrongly appear as overdue/blocking depending on time-of-day the seed
ran. Fixed to use the existing `isOverdue()` helper (calendar-day aware)
consistently everywhere.

**Verified in-browser:** Dashboard, Projects board/list, Project Cockpit
(Overview + Board tabs), Tasks board/list, Task Drawer open/edit/checkbox
toggle — all render correctly, dark theme, no console errors after fixes
above. Kanban drag-and-drop is wired correctly (`onMove` → server action) but
could not be end-to-end verified via the browser automation tool (synthetic
pointer events don't satisfy dnd-kit's activation constraint) — worth a
manual mouse check.

## Phase 3 — PM Workflow ✅

- **My Day** (`/my-day`): added `planBucket`/`planDate`/`planOrder` fields to
  `Task` (migration `my_day_planner`) rather than a join table — simplest
  fit for single-user. Three drag-and-drop buckets (Must do/Should do/If
  time) plus a 4th "Unplanned" pool of candidate tasks (due today, overdue,
  or personal) to drag in; read-only Follow-ups-due-today and
  Meetings-today sections below; completion progress bar.
- **Inbox** (`/inbox`): rapid capture (already had the `QuickCapture`
  dialog + `InboxItem` model from Phase 1) — this phase added the list view
  with per-item Convert-to (Task/Follow-up/Reminder/Meeting/Research/Idea)
  and delete. Verified end-to-end in-browser: capture → toast → convert →
  toast with new task key.
- **My Work** (`/my-work`): isPersonal tasks grouped by type
  (Follow-ups/Communications/Meetings/Calls/etc).
- **Follow-ups** (`/follow-ups`): full CRUD, status pipeline, filter by
  status, linked to Person or Vendor + optional project.
- **Waiting For** (`/waiting-for`): full CRUD, open/resolved split.
- **People** (`/people`, `/people/[id]`): list + profile with interaction
  timeline (logged manually) and open work. Note: a Person's "open work"
  only shows tasks linked via `Task.personId`, not tasks assigned to the
  matching `User` via `Task.assigneeId` — Person (contact) and User
  (assignee) are intentionally separate entities per the data model, so
  e.g. Rahul-the-User's 17 engineering tasks don't appear on
  Rahul-the-Person's profile. Working as modeled, but worth knowing if it
  looks sparse.
- **Vendors** (`/vendors`, `/vendors/[id]`): list + profile linked to
  projects/tasks/follow-ups.
- **Meetings** (`/meetings`): create with participants, add action items
  inline, convert an action item to a task (verified end-to-end — creates
  the task and flips the item to "Task created").

**Two real bugs found and fixed while testing this phase in-browser:**

1. **dnd-kit SSR hydration mismatch.** Every `KanbanBoard` instance's
   internal `DndContext` was generating non-deterministic `aria-describedby`
   ids (server run vs. client run disagreed), which is a documented dnd-kit
   footgun under SSR. Fixed by requiring a stable `id` prop on
   `KanbanBoard` and passing a unique string at each of the four call
   sites (`tasks-board`, `projects-board`, `my-day-board`,
   `project-board-${key}`). If a new Kanban board is added anywhere, it
   needs its own unique `id` too, or this comes back.
2. **`nextTaskKey` collision.** It derived the next task number from
   `count(tasks with this prefix)`, which silently breaks the moment
   there's any gap in the numeric sequence — and there was one, from an
   off-by-one in the seed script's own key counter. Fixed to derive from
   `max(existing numeric suffixes) + 1` instead of a count. Also fixed the
   seed script's off-by-one for cleanliness. If you ever see a
   `Unique constraint failed on the fields: (taskKey)` error, this is the
   class of bug to suspect first.

Both fixes verified in-browser (fresh tab, checked console was clean; then
exercised the actual actions — action-item-to-task conversion, board
navigation across pages).

## Phase 4 — Product Management ✅

- **Initiatives** (`/initiatives`): list + create, projects linked via
  `Project.initiativeId` shown as chips (chip-to-initiative assignment UI
  itself isn't built — projects currently link only if created with one via
  a future edit; the action `assignProjectToInitiative` exists but nothing
  calls it yet from the Projects UI).
- **Risks** (`/risks`) and **Decisions** (`/decisions`) global list pages —
  reused the `NewRiskDialog`/`NewDecisionDialog` already built for the
  Project Cockpit in Phase 2, extended both with an optional `projects`
  prop so they show a project picker when there's no `defaultProjectId`
  (global context) and hide it when there is (cockpit context). Decisions
  render as a timeline (connected dots + line) per spec.
- **Releases** (`/releases`): bundles projects, computed completion %/open
  issues/blocked count live from linked projects' tasks (not stored).
- **Documents** (`/documents`, `/documents/[id]`): list + editor. Non-PRD
  docs get a Tiptap rich-text editor (`RichTextEditor`, bold/italic/h2/
  lists/quote toolbar). PRD-type docs get the full templated field set
  from the spec instead, each auto-saving on blur via a server action.
  "Convert requirements to tasks" splits `prdRequirements` by newline and
  bulk-creates one task per line — verified in-browser (created a task from
  the seeded PRD's requirements field).
- **Metrics** (`/metrics`): manual entry + Recharts line charts grouped by
  metric name, latest value vs. target shown inline.

**Verified in-browser:** all six new list pages load clean (fresh-tab
console check), PRD editor round-trips seeded data correctly, requirement
→task conversion works.

**Tooling note, not a product bug:** the browser automation's `scroll`
action hung/timed out repeatedly on the Documents editor page for no
apparent reason (screenshots and clicks worked fine throughout). Worked
around by resizing the viewport tall instead of scrolling — worth knowing
if a future session hits the same thing, so it doesn't get mistaken for an
app-side infinite-loop or hang.

## Phase 5 — Productivity ✅

- **Calendar** (`/calendar`): month grid (date-fns), tasks/follow-ups/
  meetings plotted by date as colored dots, click a day to see its agenda,
  click an item to open the right thing (task → drawer, follow-up/meeting →
  their list page). Month navigation via `?month=` query param.
- **Analytics** (`/analytics`): personal stats (created/completed,
  completion rate, overdue rate, avg cycle time, follow-ups closed, all
  last-30-days) + a per-project table (progress, blocked count, risk
  count) linking into each Cockpit.
- **Notification Center**: a bell in the TopBar showing live-computed
  alerts (overdue, blocked, follow-ups due, meetings starting within 2h,
  risks due) grouped in a popover. Deliberately *not* a persisted
  notification log — it's recomputed on open from current state, so it's
  non-spammy by construction (spec explicitly asked to "keep it
  non-spammy") and can never accumulate stale entries.
- **Global search**: the command palette's search box now does real
  cross-entity search (tasks/projects/people/vendors/documents/meetings/
  decisions/risks) via a new `searchEverything` action, debounced 150ms,
  shown as grouped results above the static Create/Show-me/Go-to sections.
- **Settings** (`/settings`): General (name, theme, working hours),
  Workspace (live entity counts), AI (key-configured status, read from
  `OPENAI_API_KEY`), Data (export JSON/CSV, create/list/restore local
  SQLite backups under `prisma/backups/`, gitignored).
- Keyboard shortcuts and command palette itself already existed from Phase
  1; the Project Cockpit's Timeline tab already covered per-project
  timeline from Phase 2 — nothing new needed there.

**Two real bugs found and fixed while testing this phase:**

1. **Hydration mismatch on `/settings`.** The theme-selector buttons read
   `useTheme()`'s `theme` value to decide which button looks "active", but
   `next-themes` only knows the real theme after mount (it reads
   `localStorage` client-side) — so the server-rendered button variants
   didn't match the client's. Fixed with the standard next-themes pattern:
   a `mounted` guard state that delays theme-dependent styling until after
   the first client render.
2. **Negative "avg cycle time" in Analytics.** The seed script set
   `completedAt` in the past (e.g. `daysAgo(3)`) while leaving `createdAt`
   at its default (`now()`, i.e. seed-run time) — so `completedAt <
   createdAt` for every "done" seeded task, and cycle time
   (`completedAt - createdAt`) came out negative. Fixed by also
   backdating `createdAt` on those same rows so completion always comes
   after creation, the way it would for real data.

**Operational note, not a bug in the app itself:** running
`prisma migrate reset` while the Next.js dev server still held its Prisma
connection open to the old `dev.db` file corrupted the SQLite file
in-place (`database disk image is malformed`) until the dev server was
restarted — the file itself was fine (`PRAGMA integrity_check` → `ok`
after restart), it was just a stale connection. If a future session needs
to reset the dev database, restart the dev server immediately after.
Also: `prisma migrate reset`/`db:reset` is a destructive action Prisma's
CLI itself refuses to run for an AI agent without explicit per-invocation
user consent (via `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`) — asked
the user before running it here; do the same next time rather than trying
to work around the guard.

## Phase 6 — AI layer ✅

Service abstraction in `src/lib/ai/` — `client.ts` (`isAIEnabled()` reads
`OPENAI_API_KEY` from the environment only, never DB/client-exposed;
`getAIClient()` lazily constructs the OpenAI SDK client), `service.ts`
(seven feature functions, each a single `chat.completions.create` call with
`response_format: json_object` and a tightly-scoped prompt). Every feature
is exposed through `src/app/actions/ai.ts`, wrapped in a `guarded()` helper
that returns `{ok:true,data}` or `{ok:false,reason}` instead of throwing —
so the UI never crashes when no key is configured, it just shows "AI
features are unavailable until an API key is configured." (verified
in-browser, see below).

All seven spec features, each wired into an existing screen rather than a
separate "AI page":

1. **Task creation from text** — Inbox item dropdown → "Draft task with AI"
   → `AITaskDraftDialog` (editable preview: title/type/priority/
   description/subtasks/project) → confirm creates the task via
   `convertInboxItemWithDraft`. Nothing is written before confirmation.
2. **Meeting notes → tasks** — Meetings page, "Extract action items with
   AI" (shown when a meeting has notes) → `AIActionItemsDialog` with a
   checklist (owner + due date shown per item, all pre-checked, editable) →
   confirm creates only the checked ones as real tasks.
3. **Project summary** — Cockpit Overview tab, `AISummaryCard` (read-only,
   no write, so no confirm step needed) — hides itself entirely when AI
   isn't configured rather than cluttering the cockpit with a dead button.
4. **Weekly stakeholder update** — Dashboard "AI tools" menu → dialog with
   copy-to-clipboard output.
5. **"What am I forgetting?"** — Dashboard "AI tools" menu. Deliberately
   built AI-optional: the underlying scan (overdue/blocked/follow-ups-due/
   waiting-for-due/stale-projects/risks-due) is plain DB queries and always
   returns real linked items; the LLM only adds a prioritized narrative on
   top. Verified in-browser with no key configured — shows "AI narrative
   unavailable — here's the raw scan." plus the real, clickable item list.
   This is the one feature that stays substantively useful with zero AI
   configured, by design.
6. **PRD generator** — New Document dialog, type=PRD shows an optional
   "Generate from a one-line idea" field; drafts all PRD sections before
   the document is even created.
7. **NL search** — Command palette: typing 3+ characters shows an
   "Ask AI: '<query>'" item that translates the query into
   `{statusFilter, projectKeyword, assigneeKeyword, textKeyword}` and
   navigates to `/tasks` with those applied — translates to structured
   filter params only, the model never generates or runs a DB query itself
   (`TasksView` gained `initialQuery`/`initialProject` props to receive
   them).

**Verified in-browser** (no `OPENAI_API_KEY` set in this environment, which
is the realistic state for most people trying this out fresh): every entry
point above was clicked and showed the correct unavailable-message or
graceful-fallback behavior, no console errors, no crashes. Have not been
able to verify the actual OpenAI-backed happy path (structured JSON
parsing, prompt quality) since no key is configured — that needs a real
key and a pass through each of the 7 flows before trusting the output
quality blindly.

## Not started yet

Phase 7 (polish/QA/acceptance test).

`/settings` Notifications sub-tab from the original spec wasn't built as a
separate settings surface — the Notification Center itself (bell +
popover) covers the functional need; there's no per-category on/off
toggling yet. Workstreams have no dedicated UI (the `Workstream` model and
`createWorkstream` action exist; nothing surfaces them — low priority,
task creation doesn't require one).
