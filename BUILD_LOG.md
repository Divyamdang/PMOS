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

## Not started yet

Phase 4 (Initiatives, Workstreams list/detail, Risks list page, Decisions
list page, Releases, Documents editor, PRD builder, Metrics), Phase 5
(Calendar, Timeline view, Analytics, Backup/restore/import/export — command
palette and keyboard shortcuts already exist from Phase 1), Phase 6 (AI
layer), Phase 7 (polish/QA/acceptance test).

Nav links to `/calendar`, `/initiatives`, `/risks`, `/decisions`,
`/releases`, `/documents`, `/metrics`, `/analytics`, `/settings` currently
404 — building these is Phase 4/5. (Risk/Decision *creation* already works
from inside a Project Cockpit — `NewRiskDialog`/`NewDecisionDialog` — what's
missing is the standalone list pages.)
