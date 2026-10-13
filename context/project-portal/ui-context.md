# Project Portal - UI Context

## Theme

The portal uses the app-wide **"Golden White Glassmorphism"** system. It features translucent panels, dense layouts, uppercase tracked micro-labels, and specific glass shadows. 

## Colors (Token-Only)

All components must use these tokens (no hardcoded hex or arbitrary Tailwind colors like `bg-green-100`).

| Role            | CSS Class / Variable             |
| --------------- | -------------------------------- |
| App Background  | `bg-app`                         |
| Surface         | `bg-surface`                     |
| Card / Hover    | `bg-card` / `hover:bg-card-hover`|
| Headings        | `text-heading`                   |
| Body Text       | `text-main`                      |
| Muted Text      | `text-muted`                     |
| Brand Gold Text | `text-brand-text`                |
| Brand Gold Fill | `bg-brand` / `text-brand`        |
| Hairlines       | `border-border-subtle`           |
| Accent Border   | `border-border-accent`           |
| Text on Gold    | `text-on-brand`                  |

**Alpha Rule**: Tailwind opacity modifiers (`bg-brand/10`) do NOT work on `var()`-based tokens. For brand tints use the `amber-*` scale (`bg-amber-50`, `bg-amber-100`, `bg-amber-500` = brand, `bg-amber-600` = accent).

## Typography

- **Page Title**: `text-base font-bold text-heading uppercase tracking-tight`
- **Page Subtitle**: `text-muted text-[10px] sm:text-xs font-medium uppercase tracking-wide mt-1`
- **Panel Title**: `text-sm font-black text-heading uppercase tracking-wider`
- **KPI Number**: `text-xl sm:text-2xl font-black text-heading tabular-nums leading-none`
- **Micro Label**: `text-[10px] font-black uppercase tracking-widest text-muted`

## Shape & Elevation

- **Panel Radius**: `rounded-2xl` (`.glass-card` handles this).
- **Hero Radius**: `rounded-[1.75rem]`.
- **Chips/Buttons**: `rounded-lg`.
- **Panel Shadow**: Provided by `.glass-card` (`0 8px 32px rgba(218,165,32,.1)`). Primary CTAs use `shadow-[0_4px_15px_rgba(212,175,55,0.3)]`.

## Enums to Tone Mappings

These map to semantic background/border classes (`success-bg`, `warning-bg`, etc.):

- **Project Status**: Planning (info), Active (success), On Hold (warning), Completed (neutral), Cancelled (danger).
- **Task Status**: Todo (neutral), In Progress (info), In Review (warning), Done (success), Blocked (danger).
- **Task Priority**: Low (neutral), Medium (warning), High (danger).

## Component Library

Assemble pages from the shared `frontend/src/components/projectPortal/` kit plus the app-wide UI primitives:
- `PortalHeader`, `ToolbarSearch`, `FilterChips`
- `Pill`, `Progress`, `PanelHead`, `EmptyState`
- `PortalTable` (with `hideBelow` logic for responsive columns)
- Dialogs: `GlassModal`, `ModernSelect`, `ModernDatePicker`, `GlassButton`

Page-specific compositions such as the ProjectDetail hero, Kanban shell, and task list are allowed when they preserve the same tokens, spacing, focus treatment, and responsive rules.

## Page Composition

- `ProjectDashBoard` uses a workspace hero, separate KPI cards, and a bento grid of active projects, time tracking, tasks, deadlines, and team with aligned counts.
- `Projects` presents the projects directory with a dedicated **Group** column, a Project Group filter dropdown in the toolbar, and `NewProjectDrawer` supporting optional group portfolio selection.
- `ProjectDetail` uses a structured project hero: title/actions, Project Group affiliation badge (`FolderIcon`), project facts, a dedicated overall-progress area, health label, and task summary counters.
- Project detail task work is intentionally separated into a second `Task workspace` panel containing search, view tabs, and the primary `New Task` action.
- `AddTaskForm` and `addTaskModal` in Project Detail: project field is omitted/hidden, and assignee selection is strictly constrained to project members (`owner` + `team`).
- `ProjectGroups` features a 4-metric portfolio summary strip (Total Portfolios, Projects Covered, Active Projects, Avg Portfolio Progress), a dense table with active/total project chips and roll-up progress bars, an interactive detail modal with child project breakdown and progress bars, and full project assignment management.
- `Progress` accepts `className` and `trackClassName` so larger summary progress bars can be composed without duplicating progress markup.
- `GlassModal` uses an opaque `bg-surface` dialog surface, matching the time tracker modal form treatment while retaining token-based theme support.

## Verified usage

The active pages are assembled from the portal kit plus existing form/drawer components. `PortalTable` owns table overflow and responsive column hiding; no global table or mobile-block logic was changed during the audit. Browser-level contrast and viewport checks remain pending.

The current project detail hero keeps progress visually distinct from metadata and actions. Do not place the primary progress bar inline with date, priority, or team facts.
