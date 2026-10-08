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

Assemble pages purely from `frontend/src/components/projectPortal/` kit:
- `PortalHeader`, `ToolbarSearch`, `FilterChips`
- `Pill`, `Progress`, `PanelHead`, `EmptyState`
- `PortalTable` (with `hideBelow` logic for responsive columns)
- Dialogs: `GlassModal`, `ModernSelect`, `ModernDatePicker`, `GlassButton`
