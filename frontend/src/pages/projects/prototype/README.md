# Project Portal — UI Redesign Prototype (THROWAWAY)

> **Plan (one line):** Three structurally different Project Portal designs —
> **A · Command Center**, **B · Split Workspace**, **C · Board & Metrics** —
> switchable via `?variant=`, mounted on the existing `/project/*` routes.
> The current UI stays the default, so nothing changes when the param is absent.

This folder is **prototype code, not production**. It exists to pick a design
direction before the real redesign. When a variant wins:

1. Capture this prototype on a **throwaway branch** (out of `main`) and leave a
   context pointer to that branch on the implementation issue.
2. Rewrite the winning direction properly into the real pages (don't paste it in
   verbatim — it was written under prototype constraints: no tests, minimal error
   handling, read-only interactions).
3. Drop the losing variants + the switcher from `main`.

## How to run

```bash
cd frontend && npm run dev
```

Then open any of:

| Route | Host page |
| --- | --- |
| `/project/projectDashboard` | `ProjectDashBoard.jsx` |
| `/project/projects` | `Projects.jsx` |
| `/project/myTasks` | `MyTask.jsx` |
| `/project/projectGroups` | `ProjectGroups.jsx` |

Use the floating **bottom bar** (or ← / → keys) to cycle:

| Key | Name | Idea |
| --- | --- | --- |
| `0` | Current UI | Baseline — the existing portal, for comparison |
| `a` | Command Center | KPI ribbon + asymmetric bento dashboard; dense sticky-header tables with toolbar chips |
| `b` | Split Workspace | Compact header + main workstream rows with sticky right rail; list-rows (no tables), day-grouped task planner |
| `c` | Board & Metrics | Gradient metrics band + status kanban boards everywhere; typographic group index |

Examples: `/project/projectDashboard?variant=b`, `/project/projects?variant=c`

The chosen variant is mirrored to `sessionStorage` (`portal-prototype-variant`)
so it survives sidebar navigation. Clear it with
`sessionStorage.removeItem('portal-prototype-variant')`.

## Rules followed

- **Same design system as the people portal** — only existing tokens are used
  (brand gold `amber-*` scale, `surface/card/app`, `heading/muted/main`,
  status tokens, `.glass-card`, `.btn btn-primary`, uppercase micro-labels).
  Light **and** dark themes keep working.
- **Responsive by design** (Tailwind default breakpoints already in the repo):
  mobile-first stacking, chip/segmented controls scroll horizontally, tables use
  column prioritization (`hidden md:table-cell`) + inner horizontal scroll,
  kanban columns are `w-[78vw]` snap-scroll on phones, forms/actions stack under
  `sm`, no fixed-width containers, no page-level horizontal overflow.
- **Read-only**: variants render data only. Mutations (create drawers/modals)
  stay wired at the host page level; row-level edit/delete in tables is out of
  scope for the prototype.
- Data comes from the existing Redux fetching — nothing new is fetched.

## Known caveat for implementation

`App.jsx` still renders `MobileBlock` for real touch devices ≤1024px. Full
mobile support (requirement #13) means replacing that gate during
implementation — the variants themselves are already mobile-ready, and can be
checked by resizing the browser on desktop (the block only triggers for touch
+ small screen).
