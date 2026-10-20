# Project Portal — Design Specification (Command Center)

> **Status:** approved design to implement (chosen from the UI prototype — Variant A "Command Center").
> **Scope:** the Project Portal module (`/project/*`): Project Dashboard, Projects, My Tasks, Project Groups.
> **Purpose of this file:** the single source of truth for how the portal looks, behaves, and scales.
> Add a new page to this portal by following [§12 — Adding a new page](#12-adding-a-new-page-checklist).
>
> Prototype variants (A/B/C + switcher) are preserved on the throwaway branch
> `prototype/project-portal-variants` — this document describes only what ships to `main`.

---

## 1. Design identity

The portal uses the app-wide **"Golden White Glassmorphism"** system — the same one the
People Portal uses. Never introduce a new palette.

| Principle | Meaning |
| --- | --- |
| **Token-only colors** | Every color comes from a Tailwind token (`brand`, `surface`, `heading`, `muted`, `success`, …). No raw hex, no `slate-*`, no `bg-green-100`. This is what guarantees light + dark + theme-selector support for free. |
| **Glass panels** | Content lives in `.glass-card` panels (translucent white/gold blur) or `bg-surface` cards inside them. |
| **Uppercase micro-labels** | Titles/subtitles/labels are small, bold, uppercase, tracked (`text-[10px] font-black uppercase tracking-widest`). Numbers are `font-black tabular-nums`. |
| **Dense, not cramped** | Command-center density: compact rows, hairline dividers (`divide-border-subtle`), generous hit targets (≥ 40px) for touch. |
| **Honest data** | Every number/bar renders real backend data or a documented fallback. No decorative fake values. |

---

## 2. Design tokens (source of truth: `frontend/src/index.css` + `frontend/tailwind.config.js`)

### 2.1 Colors — use the class, never the hex

| Token class | Meaning | Light | Dark |
| --- | --- | --- | --- |
| `bg-app` | App background behind panels | `#F5F3E9` | `#0f172a` |
| `bg-surface` | Primary panel / row background | `#FFFFFF` | `#1e293b` |
| `bg-card` | Secondary surface (table head, footers, chips) | `rgba(255,255,255,.75)` | `rgba(30,41,59,.7)` |
| `bg-card-hover` | Hover wash | gold 10% | gold 14% |
| `text-heading` | Headings / numbers | `#0f172a` | `#ffffff` |
| `text-main` | Body | `#1e293b` | `#f8fafc` |
| `text-muted` | Secondary / micro-labels | `#94a3b8` | `#8a96a8` |
| `text-brand-text` | Readable gold text | `#92590c` | `#FCD34D` |
| `bg-brand` / `text-brand` | Brand gold | `#D4AF37` | `#FBBF24` |
| `border-border-subtle` → `border-border-subtle` | Hairlines | 4% black | 8% white |
| `border-border-accent` | Gold accent border | gold 30% | gold 40% |
| `text-on-brand` | Text on gold fills | `#ffffff` | `#1a1205` |
| status: `success / warning / danger / info / neutral` + `-bg` + `-border` | Status pills (semantic, theme-aware) | — | — |

> ⚠️ **Alpha rule:** Tailwind opacity modifiers (`bg-brand/10`) do **not** work on `var()`-based
> tokens. For brand tints use the `amber-*` scale (it is remapped to brand tokens in
> `tailwind.config.js`): `bg-amber-50` (25% tint), `bg-amber-100` (light gold), `bg-amber-500`
> (= brand), `bg-amber-600` (= accent). Alpha modifiers are safe on built-in colors (`bg-white/20`).

### 2.2 Typography

| Use | Classes |
| --- | --- |
| Page title (header card) | `text-base font-bold text-heading uppercase tracking-tight` |
| Page subtitle | `text-muted text-[10px] sm:text-xs font-medium uppercase tracking-wide mt-1` |
| Big display title (header row variant) | `text-2xl sm:text-3xl font-black text-heading tracking-tight` |
| Eyebrow (gold) | `text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-brand-text` |
| Panel title | `text-sm font-black text-heading uppercase tracking-wider` |
| Panel subtitle | `text-[10px] uppercase tracking-widest text-muted` |
| KPI number | `text-xl sm:text-2xl font-black text-heading tabular-nums leading-none` |
| Table header | `text-[10px] font-black uppercase tracking-widest text-muted` |
| Body/table cell | `text-sm` (`text-heading` for primary, `text-muted`/`text-main` for secondary) |
| Micro label / footer | `text-[10px] font-black uppercase tracking-widest text-muted` |

Font: Inter (`--font-family-sans`), set globally. Never go below `text-[10px]`.

### 2.3 Shape & elevation

- Panel radius: `rounded-2xl` (`.glass-card` already sets it); page-level hero: `rounded-[1.75rem]`.
- Chips/buttons: `rounded-lg`; segmented pills: `rounded-full`.
- Panel shadow: provided by `.glass-card` (`0 8px 32px rgba(218,165,32,.1)`); don't invent shadows except `shadow-[0_4px_15px_rgba(212,175,55,0.3)]` on primary CTAs (that's the brand glow).

### 2.4 Breakpoints (Tailwind defaults — the repo defines no others; never add custom ones)

| Alias | px | Portal behavior |
| --- | --- | --- |
| *(base)* | < 640 | Phone. Everything stacked; tables column-reduced; chips scroll horizontally. |
| `sm` | 640 | Large phones / small tablets: 2-col KPIs, side-by-side header actions. |
| `md` | 768 | Tablets: full sidebar visible (existing layout), 2-col bento, more table columns. |
| `lg` | 1024 | Laptops: 3-col bento, all standard table columns, toolbar inline. |
| `xl` | 1280 | Desktop: full table (ID, team, description), 4-col KPI ribbon. |
| `2xl` | 1536 | Large desktop: extra card columns where useful. |

---

## 3. Layout architecture

```
AppLayout (existing, unchanged)
├── icon rail (NavbarVertical) + module sub-nav (SubNavbarVertical)   ← mobile: hamburger drawer
├── main panel  <main class="… bg-surface rounded-[1.5rem]…">          ← pages render inside (p-3 md:p-4, scrolls)
│   └── <Page />   ← our pages
└── RightSidebar (people portal only — not shown for /project)
```

**Page root pattern (all four pages):**

```jsx
<div className="flex flex-col gap-4">   {/* mobile-first stack; gap-4 = spacing system */}
  <PortalHeader … />                    {/* §6.1 */}
  …content panels…
</div>
```

Spacing system: `gap-4` between panels, `p-4 sm:p-5` inside panels, `py-3` between rows.
On desktop use the extra room for columns, not bigger fonts.

---

## 4. Responsive rules (mandatory, per element)

| Element | Phone (base) | Tablet (`md`) | Desktop (`lg`/`xl`) |
| --- | --- | --- | --- |
| Header card | stacked: title → subtitle → actions full-width | actions inline right | inline |
| Search input | full width | fixed `sm:w-64` in toolbar | inline |
| Primary buttons | full-width or `self-start` (never overflow) | auto | inline |
| Filter chips | horizontal scroll (`overflow-x-auto no-scrollbar`), never wrap into rows | scroll | scroll |
| KPI ribbon | 2 × 2 grid inside one card | — | 4 across (`lg:grid-cols-4`) |
| Bento panels | stacked (1 col) | 2 cols (`sm:grid-cols-2`) | 3 cols + wide panel `lg:col-span-2` |
| Tables | column prioritization via `hideBelow` + inner `overflow-x-auto` (tables may scroll horizontally, **pages never**) | + md columns | full |
| Modals (`GlassModal`) | `max-h-[90vh]`, internal scroll, footer buttons stack (`flex-col-reverse sm:flex-row`), never wider than viewport | same | centered `max-w-*` |
| Drawers/panels | full-width card, fields stack `grid-cols-1 sm:grid-cols-2` | 2-col fields | 2-col fields |
| Bar charts | flex children `flex-1 min-w-0`, fixed pixel bar heights | same | same |
| Touch targets | ≥ 40px (`py-2.5 px-4` buttons, `py-2` chips, `p-2` icon buttons) | same | same |

**Overflow audit before merging any portal page:** no `body` horizontal scroll; only
`overflow-x-auto` inside table/board wrappers; no fixed `w-[Npx]` containers (use `max-w`/`min-w-0`);
all flex children that hold text get `min-w-0` + `truncate`.

---

## 5. Backend contracts (what every page renders)

Base URL `/api/v1`. Axios (`src/axios.js`) auto-unwraps `{success, data}` → `data`.

| Page | Endpoint | State | Notes |
| --- | --- | --- | --- |
| Dashboard | `GET /projects/dashboard` | `state.projects.dashboardData` | shape below |
| Projects | `GET /projects?limit=1000` | `useProjects()` hook | full list client-side (search/filter/sort/page) |
| My Tasks | `GET /tasks/user` | `state.tasks.tasks` | all tasks where `team` includes me |
| Project Groups | `GET /project-groups` | `state.projectGroups.groups` | `projects` comes populated (`title,status,dueDate`) |

Mutations (all already exist and must stay wired):

| Action | Call | UI |
| --- | --- | --- |
| Create project | `POST /projects` | New Project drawer |
| Update project | `PUT /projects/:id` | Edit row action → same drawer in edit mode |
| Delete project | `DELETE /projects/:id` | row action → `useConfirm()` → 400 if it has tasks (surface the message) |
| Create task | `POST /tasks` | New Task modal |
| Update task status | `PUT /tasks/:id` | inline status select in My Tasks table |
| Update task delivery details | `PUT /tasks/:id` | completion %, estimated/worked hours, and dependencies in task detail |
| Create group | `POST /project-groups` | New Group modal |
| Delete group | `DELETE /project-groups/:id` | row action → `useConfirm()` |

### 5.1 Enums (Joi schema and Mongoose model are now aligned — keep them in sync!)

| Entity | Field | Values | Default |
| --- | --- | --- | --- |
| Project | `status` | `Planning`, `Active`, `On Hold`, `Completed`, `Cancelled` | `Planning` |
| Task | `status` | `Todo`, `In Progress`, `In Review`, `Done`, `Blocked` | `Todo` |
| Task | `priority` | `Low`, `Medium`, `High` | `Medium` |

**Pill tone maps** (`components/projectPortal/Pill.jsx`) — the only place tone is decided:

| Project status | tone | Task status | tone | Priority | tone |
| --- | --- | --- | --- | --- | --- |
| Planning | info | Todo | neutral | Low | neutral |
| Active | success | In Progress | info | Medium | warning |
| On Hold | warning | In Review | warning | High | danger |
| Completed | neutral | Done | success | | |
| Cancelled | danger | Blocked | danger | | |

### 5.2 `GET /projects/dashboard` response

```jsonc
{
  "activeProjects": 3,              // status ∈ [Active, In Progress] & owner/team = me
  "completedProjects": 2,
  "openTasks": 7,                   // status ≠ Done & team = me
  "projectGroups": 2,               // count of ProjectGroup documents (fixed — was projects count)
  "recentProjects": [{ "title": "…", "status": "Active", "dueDate": "…",
                       "progress": 62 /* avg task completionPercent; absent if project has no tasks */ }],
  "recentTasks":    [{ "title": "…", "status": "Todo", "dueDate": "…", "project": { "title": "…" } }],
  "upcomingDeadlines": [{ "task": "…", "project": "…", "dueDate": "…",
                          "status": "Todo", "completion": 40 /* = task.completionPercent (was random) */ }],
  "teamMembers":   [{ "name": "Jane Doe", "email": "…", "role": "Manager", "avatar": "…" }], // fixed — was "undefined undefined"
  "timeTracking":  { "totalHours": 12, "targetHours": 40,
                     "dailyBreakdown": [{ "day": "Mon", "hours": 3 }, …Mon–Fri] }
}
```

**Progress rule (single definition, used everywhere):**
`progress = average(task.completionPercent) over the project's tasks`.
If a project has **no tasks**, the field is absent and the UI shows a documented
status-based estimate (`Completed→100, Active→50, On Hold→30, Planning→15, else 20`).
Task progress is always the real `completionPercent` (0–100).

Project detail responses also include a derived `health` object:
`{ status: "On Track" | "Watch" | "At Risk", score, reasons, activeTasks }`.
Health is calculated from blocked tasks, overdue tasks, project due dates, and current
progress; it is not stored separately. Projects may include editable `milestones` with
`title`, `dueDate`, and `status` (`Planned`, `In Progress`, or `Completed`).

### 5.3 Error handling

- Backend errors: `{ success:false, status, message }` → surfaces via `toast.error(message)`.
- Permission denial must be 403 (`ForbiddenError` imported in `projectService`/`taskService`).
- Mutations that can fail (create/update/delete) always: `try → toast.success → refetch/normalise
  state → catch → toast.error(err.message)`.

---

## 6. Component kit — `frontend/src/components/projectPortal/`

All portal pages are assembled **only** from these + `.glass-card` / `.btn` / `.glass-input`.
Never copy-paste table/header markup between pages.

### 6.1 `PortalHeader`

```jsx
<PortalHeader
  title="Projects"                       // uppercase page title
  subtitle="Manage and track company projects"
  actions={<><ToolbarSearch …/><button className="btn btn-primary …">…</button></>}
>
  <FilterChips … />                       {/* optional second row (filters) */}
</PortalHeader>
```
Renders one `.glass-card`: top row `flex-col sm:flex-row justify-between` (title block left,
`actions` right, wraps on phones), optional children row below.

### 6.2 `ToolbarSearch`

```jsx
<ToolbarSearch value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects..." />
```
`relative` wrapper + `MagnifyingGlassIcon` + input `.glass-input !pl-9 w-full`.
Controlled; filtering happens in the page (client-side over the full list).

### 6.3 `FilterChips`

```jsx
<FilterChips
  value={status} onChange={setStatus}
  options={[{ value: "All", label: "All", count: 12 }, …]}
/>
```
Horizontal, scroll-x, never wraps: active chip = `bg-brand text-on-brand` + gold glow; inactive =
`bg-card text-muted border border-border-subtle` → `hover:border-border-accent`. Each chip ≥ 36px tall.

### 6.4 `Pill`

```jsx
import Pill, { PROJECT_STATUS_TONE, TASK_STATUS_TONE, PRIORITY_TONE } from "…/Pill";
<Pill tone={PROJECT_STATUS_TONE[project.status]}>{project.status}</Pill>
```
Compact bordered pill with leading dot; tone→classes mapping lives only here (§5.1).
Unknown value renders `neutral` — never crash on unexpected enum.

### 6.5 `Progress`

```jsx
<Progress value={62} />          // clamps 0–100, h-1.5 track (bg-border-subtle), bg-brand fill
```
Always pair with a numeric label: `<span className="text-[10px] font-bold text-muted tabular-nums">{pct}%</span>`.

### 6.6 `PanelHead`

```jsx
<PanelHead title="Active Projects" subtitle="Ongoing work & status"
           action={<button …>View all</button>} />
```
Panel title block used at the top of every `.glass-card` section.

### 6.7 `EmptyState`

```jsx
<EmptyState title="No projects yet" hint="Create your first project to get started." />
```
Centered, gold-accent icon block. **Every data list must render one** (with copy that says what
belongs there and how to create it).

### 6.8 `PortalTable` — the data table (replaces `TableWithPagination` **for this portal only**)

```jsx
<PortalTable
  columns={[
    { key: "projectID", label: "ID", hideBelow: "xl" },
    { key: "title", label: "Project", render: (v, row) => (…) },   // primary column: truncate
    { key: "owner", label: "Owner", hideBelow: "lg", render: … },
    { key: "status", label: "Status", render: (v) => <Pill …/> },
    { key: "dueDate", label: "End", hideBelow: "md", render: … },
    { key: "_progress", label: "Progress", sortable: false, render: … }, // derived → sortable:false or render-only
  ]}
  data={rows}                                  // already filtered by the page
  sort={sort} onSortChange={setSort}           // controlled (omit both → internal, seeded by defaultSort)
  defaultSort={{ key: "createdAt", direction: "desc" }}
  loading={loading} error={error}
  onRowClick={(row) => navigate(…)}            // optional; rows get cursor-pointer
  actions={[                                   // optional; icon buttons, stopPropagation
    { title: "Edit", icon: PencilIcon, onClick: (row) => openEdit(row) },
    { title: "Delete", icon: TrashIcon, danger: true, onClick: (row) => confirmDelete(row) },
  ]}
  rowsPerPage={10}                             // client pagination: [10,20,50,100] select + Prev/Next
  emptyTitle="No matching projects" emptyHint="Try a different search or status filter."
  footerNote={<span>…</span>}                  // optional extra footer content
/>
```

Behavior guarantees:
- Real `<table>` inside `overflow-x-auto` (the **only** permitted horizontal scroll).
- Sortable headers show ▲/▼ (active direction `text-brand`); comparison handles strings
  (case-insensitive, numeric-aware), dates (ISO/date-like), numbers, populated objects
  (`name/title/email`), nulls last.
- **Column prioritization:** `hideBelow: "sm" | "md" | "lg" | "xl"` → `hidden md:table-cell` etc.
  Identity + Status + Actions stay visible at every width.
- Row click optional; action buttons always `stopPropagation`.
- Loading → centered `Loader`; error → `bg-danger-bg border-danger-border` panel with message;
  empty → `EmptyState`. Footer: `Showing X–Y of Z` + pagination, `bg-card`, micro-labels.

> `TableWithPagination` stays untouched — it is shared by 21 other pages across the app.

### 6.9 Shared dialogs (existing, restyled to theme — see §7)

`GlassModal` (all dialogs), `ModernSelect` (single select, portal dropdown),
`ModernDatePicker` (date, portaled), `GlassButton` (`primary | secondary | danger | ghost`),
`.glass-input` (+ `.is-error`), `useConfirm()` (destructive actions), `react-toastify` (feedback).

---

## 7. Modal & drawer rules (theme-exact)

Every portal dialog follows this anatomy (all of it is `GlassModal`):

1. **Backdrop** — `var(--color-overlay)` + blur; **panel** — `bg-card` translucent + `backdrop-blur-xl`
   + `border-border-subtle`, `rounded-xl`, theme-aware (light *and* dark), enters with the
   existing `fadeIn`/`slideInUp` keyframes. (No dead `animate-in` classes — that plugin doesn't exist.)
2. **Header** — `PanelHead`-style title (`text-heading`) + `description` (`text-muted`) +
   close button: `p-2 rounded-lg text-muted hover:text-heading hover:bg-card-hover`, `aria-label="Close"`.
3. **Body** — `flex-1 overflow-y-auto`; form grid `grid grid-cols-1 sm:grid-cols-2 gap-4`
   (fields always stack on phones); labels `text-[10px] font-black uppercase tracking-widest text-muted mb-1.5`.
4. **Inputs** — `.glass-input` or `ModernSelect`/`ModernDatePicker` only. Validation:
   required attr + inline message `text-danger text-xs mt-1` + `.glass-input.is-error` border.
   **Never silent no-op:** a blocked submit shows a message.
5. **Footer** — `GlassButton variant="secondary"` Cancel + `GlassButton variant="primary"` Submit
   (uppercase labels). `GlassModal` stacks them on phones automatically.
6. **State resets** when the dialog opens (no stale values between opens).
7. Date pickers must use `ModernDatePicker` (portaled to `#portal-root`) — never an
   un-portaled `react-datepicker` inside a scrolling modal.

Two portal dialogs exist:
- **`NewProjectDrawer`** — create *and* edit (prefills + `PUT /projects/:id`). Fields:
  Title*, Status (enum §5.1), Owner*, Department*, Start/End date, Team (multi), Description.
- **`addTaskModal` (New Task)** — real submit (never `console.log`). Fields:
  Task Name*, Project* (select from `/projects`), Assign To* (select from `/users`, defaults to
  current user), Priority (default Medium), Status (default Todo), Due Date, Description.
  Payload matches `TaskJoiSchema` exactly.

---

## 8. States (every async surface)

| State | Rule |
| --- | --- |
| Loading | Page-level: centered `Loader` with text. Table-level: `PortalTable loading` keeps the card, shows `Loader` in body. |
| Empty (never any data) | `EmptyState` with actionable copy ("Create your first project…"). |
| Empty (filtered to nothing) | `EmptyState` with "Try a different search / filter" copy. |
| Error | Inline `bg-danger-bg border-danger-border text-danger` panel (list fetch) or `toast.error` (mutation). |
| Success mutation | `toast.success("…")` + state update/refetch. |
| Destructive confirm | `useConfirm()` modal — never delete on first click. |
| Optimistic UI | Not used. After mutations: update local list (slice) or `refetch()`. |

---

## 9. Per-page specification

### 9.1 Project Dashboard (`/project/projectDashboard`)
- **Header card**: title `Project Command Center`, subtitle, right side = today's date (`text-brand-text`).
- **KPI ribbon**: one `.glass-card`, `grid grid-cols-2 lg:grid-cols-4 gap-px bg-border-subtle`,
  tiles `bg-surface` — Active Projects / Completed / Open Tasks / Project Groups
  (icon chip `bg-amber-50 border-border-accent text-brand-text` + value + micro label).
- **Bento** (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`):
  1. **Active Projects** (`sm:col-span-2 lg:col-span-2`) — rows: title + status pill, progress + % + due; `View all →` → `/project/projects`.
  2. **Task Priorities** — breakdown of active tasks by priority (High / Medium / Low) with percentage bars, count badges, and an overdue / deadline health alert bar.
  3. **Open Tasks** — list rows + status pill, `View all →` → `/project/myTasks`.
  4. **Upcoming Deadlines** — day badge (month/day stacked; red variant when overdue) + task/project.
  5. **Team Members** — avatar + name + role (scrollable list).
- All sections render `EmptyState` when their array is empty.

### 9.2 Projects (`/project/projects`)
`PortalHeader` (search + **New Project**) → `FilterChips` (All + 5 statuses with live counts) →
`PortalTable`: ID(`xl`), Project (title + description), Owner(`lg`), Team(`xl`), Status, Start(`md`),
End(`md`), Progress (bar + %), Actions (Edit, Delete). Default sort `createdAt desc`.
Row click → `/project/projectDetailed/:id`. Client-side search + status filter.

### 9.3 My Tasks (`/project/myTasks`)
`PortalHeader` (search + **Sort by** cycle button + **New Task**) → `FilterChips`
(All + 5 statuses with counts) → `PortalTable`: Task (title + project micro-label), Project(`md`),
Priority(`lg`, Pill), Due (overdue → `text-danger` + "Overdue" micro label), Status
(**inline functional select** → `PUT /tasks/:id`), Progress (real `completionPercent`),
Actions (view). Row click → `TaskDetailModal`. Default sort `dueDate asc`.

### 9.4 Project Groups (`/project/projectGroups`)
`PortalHeader` (search + **New Group**) → **summary strip** (3 mini stats in one card:
Total Groups / Projects Covered / Group Owners) → `PortalTable`: Group (name),
Description(`lg`), Owner(`md`), Projects (count chip), Created(`xl`), Actions (Delete → confirm).
Default sort `createdAt desc`.

---

## 10. Interaction, accessibility, quality bar

- Focus: never remove focus rings without replacement (`focus-visible:ring-brand`).
- Icons: `@heroicons/react/24/outline` (or the icon lib already used on the page); every
  icon-only button gets `title` + `aria-label`.
- Keyboard: table rows that navigate are `<tr onClick>` — provide the same affordance via the
  row action icon; dialogs close on Escape (GlassModal) and trap scroll.
- Text never below `text-[10px]`; primary text ≥ `text-sm`.
- Dark mode + each predefined theme must be checked (tokens guarantee it — just never hardcode).
- The switcher/`?variant=` infrastructure must NOT exist in `main` (prototype only).

---

## 11. Known issues / follow-ups (outside this spec's implementation)

| Item | Status |
| --- | --- |
| `App.jsx` blocks real touch devices ≤1024px via `MobileBlock` | Portal is mobile-ready, but phones show the block page until that gate is replaced (implementation decision). |
| `ProjectDetail` (`/project/projectDetailed/:id`) now uses Redux-backed project/task data, persists Kanban status changes, exposes task delivery details and attachments, and includes activity, dependencies, milestones, and derived project health. |
| Backend `GET /projects` caps at 20 rows | Portal calls it with `?limit=1000` (documented in §5); server-side pagination remains available for other consumers. |
| `TaskStatusDropDown` / `MyTaskTable` / `ProjectsTable` legacy components | Superseded by this spec for the portal; left in place for their other importers until cleaned up. |

---

## 12. Adding a new page to the Project Portal (checklist)

1. **Route** — in `frontend/src/App.jsx`, inside the `/project/*` block:
   ```jsx
   <Route path="myNewPage" element={<MyNewPage />} />
   ```
2. **Sidebar link** — in `frontend/src/routeConfig.jsx` → `moduleConfigs.project.links`:
   ```jsx
   { name: "My New Page", path: "/project/myNewPage", roles: ["All"] },
   ```
   (icons come from the shared `iconMap` in `SubNavbarVertical.jsx` — add an entry if it needs one.)
3. **Page file** — `frontend/src/pages/projects/MyNewPage.jsx`:
   ```jsx
   import { useState } from "react";
   import PortalHeader from "../../components/projectPortal/PortalHeader";
   import ToolbarSearch from "../../components/projectPortal/ToolbarSearch";
   import FilterChips from "../../components/projectPortal/FilterChips";
   import PortalTable from "../../components/projectPortal/PortalTable";
   import Pill, { PROJECT_STATUS_TONE } from "../../components/projectPortal/Pill";
   import Progress from "../../components/projectPortal/Progress";
   import EmptyState from "../../components/projectPortal/EmptyState";
   import { FaPlus } from "react-icons/fa";

   export default function MyNewPage() {
     const [query, setQuery] = useState("");
     const [status, setStatus] = useState("All");
     const [sort, setSort] = useState({ key: "createdAt", direction: "desc" });

     // 1) fetch: existing hook/thunk (state.projects / state.tasks / useProjects …)
     // 2) filter client-side over the full list (search + chips)
     // 3) mutations: try → toast → refetch ; catch → toast.error
     …
     return (
       <div className="flex flex-col gap-4">
         <PortalHeader title="My New Page" subtitle="One-line purpose"
           actions={<><ToolbarSearch value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" />
                     <button className="btn btn-primary py-2.5 px-4 whitespace-nowrap"><FaPlus className="mr-2 w-4 h-4" /> New Thing</button></>}>
           <FilterChips value={status} onChange={setStatus} options={…} />
         </PortalHeader>
         <PortalTable columns={…} data={rows} sort={sort} onSortChange={setSort} loading={loading}
           actions={[…]} rowsPerPage={10} emptyTitle="…" emptyHint="…" />
       </div>
     );
   }
   ```
4. **Data** — prefer existing thunks/hooks. New endpoint? Add it to `src/api/projectApi.js`
   (or the right api file), keep the `{success,data}` envelope, add the contract to §5.
5. **Enums** — reuse the tone maps from `Pill.jsx`; new enum ⇒ add to §5.1 **and** both Joi +
   Mongoose (they must match).
6. **Dialogs** — `GlassModal` + `.glass-input`/`ModernSelect`/`ModernDatePicker` + `GlassButton`
   footer per §7. Destructive → `useConfirm()`.
7. **Definition of done**
   - [ ] Light **and** dark theme checked; no raw hex / `slate-*` / `green-100` classes
   - [ ] Viewports: 1920, 1440, 1366, 1024, 768, 430, 390, 360 — no page horizontal scroll, no overlap, no clipped text
   - [ ] Loading / empty (no data) / empty (filtered) / error states all render
   - [ ] Every button does something real (or is removed); mutations toast + refetch
   - [ ] Touch targets ≥ 40px; labels visible; icon buttons have `aria-label`
   - [ ] `npx eslint` clean on touched files; `npx vite build` passes
   - [ ] This document updated if any contract/behavior changed

---

## 13. File map

```
frontend/src/
├── components/
│   ├── projectPortal/            ← Command Center kit (this spec, §6)
│   │   ├── PortalHeader.jsx  PortalTable.jsx  FilterChips.jsx  ToolbarSearch.jsx
│   │   ├── Pill.jsx  Progress.jsx  PanelHead.jsx  EmptyState.jsx
│   ├── GlassModal / GlassButton / ModernSelect / ModernDatePicker   ← dialogs (§7)
│   ├── NewProjectDrawer.jsx     ← create/edit project dialog (§7)
│   ├── addTaskModal.jsx         ← New Task dialog (§7)
│   ├── TaskDetailModal.jsx      ← read-only task detail
│   ├── TableWithPagination.jsx  ← legacy shared table (other modules; untouched)
│   └── prototype/                ← ❌ must not exist in main (throwaway branch only)
├── pages/projects/
│   ├── ProjectDashBoard.jsx  Projects.jsx  MyTask.jsx  ProjectGroups.jsx   ← §9
│   └── prototype/                ← ❌ must not exist in main (throwaway branch only)
backend/
├── JoiSchema/ProjectJoiSchema.js  TaskJoiSchema.js      ← enums §5.1
├── models/projectSchema.js        taskSchema.js         ← enums §5.1 (source of truth)
└── services/projectService.js     taskService.js        ← dashboard shape §5.2, 403 errors
PROJECT_PORTAL_DESIGN.md           ← this file
```
