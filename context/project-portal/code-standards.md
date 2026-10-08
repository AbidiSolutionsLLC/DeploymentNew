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

## Styling (Tailwind)

- **Typography**: Minimum font size is `text-[10px]`. Titles are `text-base font-bold text-heading uppercase tracking-tight`.
- **Glass Panels**: Content must live in `.glass-card` panels or `bg-surface` cards inside them.
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
- Progress calculations: `progress = average(task.completionPercent) over the project's tasks`. If no tasks, map via project status (Completed→100, Active→50, On Hold→30, Planning→15).

## File Organization

- `frontend/src/components/projectPortal/` — Portal UI Kit.
- `frontend/src/pages/projects/` — Portal pages.
- `backend/models/` — MongoDB definitions.
- `backend/JoiSchema/` — Validation definitions.
