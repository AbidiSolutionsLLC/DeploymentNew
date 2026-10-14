# Project Portal - Code Standards

## General

- Never mix raw Tailwind colors (e.g., `bg-green-100`, `text-slate-500`) in the portal. Always use the specified Glassmorphism design tokens.
- Keep components small and assemble pages strictly using the `frontend/src/components/projectPortal/` kit.
- Do not copy-paste table or header markup between pages. Rely on the shared components.

## JavaScript / Framework (React + Vite)

- Pages are composed of `.glass-card` elements.
- Use explicit component prop definitions.
- Mutations that can fail (create/update/delete) must be handled gracefully: `try → toast.success → refetch/normalise state → catch → toast.error(err.message)`.
- Use `useConfirm()` hooks for destructive actions. Never delete on the first click.
- Redux thunks must be used for Redux-managed mutations; do not dispatch plain Axios promises.

## Styling (Tailwind)

- **Typography**: Minimum font size is `text-[10px]`. Titles are `text-base font-bold text-heading uppercase tracking-tight`.
- **Glass Panels**: Content must live in `.glass-card` panels or `bg-surface` cards inside them.
- **Project detail hierarchy**: Keep project identity/actions, progress/health, project facts, and task controls in separate visual groups. Do not attach the main progress bar to a metadata row.
- **Borders & Dividers**: Use hairline dividers (`divide-border-subtle`).
- **Breakpoints**: Use standard Tailwind breakpoints (`sm`, `md`, `lg`, `xl`, `2xl`). Do NOT invent custom pixel breakpoints.

## Responsive Rules

- **Phone (base)**: Everything stacked. Tables column-reduced. Chips scroll horizontally. Modals max 90vh height.
- **Tablet (md)**: 2-column bento, more table columns visible.
- **Desktop (lg/xl)**: 3-col or 4-col bento. Full table columns visible.
- Enforce column prioritization via `hideBelow` in `PortalTable`.

## API & Backend

- Backend responses must match `{ success: boolean, status: number, data?: any, message?: string }`.
- Unknown enum values should render gracefully on the frontend (e.g., fallback to `neutral` pill tone), but backend validation must block invalid saves.
- Joi types and required fields must match the corresponding Mongoose schema (including optional `projectGroup`).
- Backend services must validate referenced users, departments, projects, project groups, and company ownership before saving.
- Department validation must permit both company-scoped departments and global seed departments (`company: null` or `$exists: false`).
- Bidirectional synchronization must be maintained between `Project` and `ProjectGroup` models on create, update, and delete actions.
- ActivityLog recording must be resilient: trap duplicate key errors (`E11000`) on concurrent or rapid status drops.
- Progress calculations: `progress = average(task.completionPercent) over the project's tasks`. If no tasks, map via project status (Completed→100, Active→50, On Hold→30, Planning→15).
- Project Group roll-ups: dynamically calculated as the average progress across all assigned child projects using `getProjectProgressMap`.
- Project-Detail task creation: `AddTaskForm` and `addTaskModal` must omit the project dropdown when `projectId` is provided, and filter assignees strictly to `[project.owner, ...(project.team || [])]`.
- Progress rendering: use the shared `Progress` module; pass `trackClassName` or `className` for sizing rather than creating duplicate progress markup.

## File Organization

- `frontend/src/components/projectPortal/` — Portal UI Kit and forms (`AddTaskForm`, `EditProjectForm`).
- `frontend/src/pages/projects/` — Portal pages (`ProjectDashBoard`, `Projects`, `ProjectDetail`, `MyTasks`, `ProjectGroups`).
- `backend/models/` — MongoDB definitions (`projectSchema`, `taskSchema`, `projectGroupSchema`, `department`).
- `backend/JoiSchema/` — Validation definitions.
- `context/project-portal/project-portal-audit.md` — Evidence register and verification status.
- Browser smoke tests live under `frontend/e2e/` and run with `npm run test:e2e`.
