# Project Portal - AI Workflow Rules

## Approach

Build the Project Portal incrementally using a spec-driven workflow. The UI is strictly governed by the "Golden White Glassmorphism" system. Always implement against the `PROJECT_PORTAL_DESIGN.md` rules and these context files. Do not infer or invent design behaviors, component shadows, or color palettes.

## Scoping Rules

- Work on one feature unit (e.g., a specific portal page or a specific dialog) at a time.
- Prefer small, verifiable increments over large speculative UI overhauls.
- Ensure that backend endpoints and Joi schemas are updated simultaneously if a new field is added.

## When to Split Work

Split an implementation step if it combines:
- Building complex new UI components with complex backend data migrations.
- Modifying multiple unrelated portal pages at once.

## Handling Missing Requirements

- Do not invent product behavior. If it's not in `PROJECT_PORTAL_DESIGN.md`, ask or leave a placeholder.
- Never invent new Tailwind color tokens. If a color is missing, check the `ui-context.md` or `index.css`.
- If an enum mapping is undefined, fallback to `neutral` and log it as an open question.

## Protected Files

Do not modify the following unless explicitly instructed:
- `frontend/src/index.css` or `frontend/tailwind.config.js` (Design tokens are locked).
- `frontend/src/components/TableWithPagination.jsx` (Used by other modules outside the portal).
- `App.jsx` mobile block logic (unless doing a specific global fix).

## Keeping Docs in Sync

Update `progress-tracker.md` whenever implementation completes for a page or component. Ensure that any new enum additions are mirrored in both Joi and Mongoose schemas.

## Before Moving to the Next Unit

1. The current portal page renders correctly across mobile, tablet, and desktop.
2. No horizontal scrolling occurs on the `<body>`.
3. Token-only colors are utilized successfully.
4. Mongoose models and Joi schemas are perfectly aligned.
5. `npm run build` passes.
