# Progress Tracker

Update this file after every meaningful implementation change to the Project Portal.

## Current Phase

- Project portal UI refinement and verification

## Current Goal

- Keep the portal page hierarchy consistent while expanding authenticated UI coverage.

## Completed

- Analyzed `PROJECT_PORTAL_DESIGN.md`.
- Generated Context methodology files:
  - `project-overview.md`
  - `architecture.md`
  - `code-standards.md`
  - `ai-workflow-rules.md`
  - `ui-context.md`
  - `progress-tracker.md`
- Traced the active routes, Redux slices, Axios response handling, and backend project/task/group services.
- Repaired detail-page project mutations, safe thunk error handling, tenant-safe references, group mass assignment, and progress response consistency.
- Persisted Azure upload metadata for project/task attachments on create and update.
- Added Playwright Chromium infrastructure and verified unauthenticated route protection for all portal routes and project detail with seven passing smoke tests.
- Added login-form and responsive smoke coverage plus a database-independent backend contract-test configuration.
- Fixed login label/input associations found by Playwright accessibility smoke coverage.
- Added mocked service regression tests for group mass assignment and tenant-scoped project/task references.
- Added ignored `backend/.env.test` loading for `NODE_ENV=test`, with fail-closed selection of `TEST_MONGODB_URI`.
- Added deterministic portal test seed data for two companies, users, projects, tasks, and a project group.
- Added a test-only authentication header path requiring `NODE_ENV=test`, `TEST_AUTH_SECRET`, and a seeded `portal-test-*` user.
- Verified isolated database connectivity, seeded data, authenticated project access, and cross-company detail blocking.
- Made the frontend API base URL configurable through `VITE_API_URL`.
- Added opt-in authenticated Playwright fixtures for the seeded admin identity.
- Added authenticated coverage for dashboard data, project search/detail navigation, assigned tasks, and project groups.
- Added API coverage for tenant-filtered project reads, cross-company detail/mutation denial, invalid test credentials, and task persistence after reload.
- Added API coverage for invalid project/task payloads, missing project/group resources, and project-group create/update/delete.
- Added browser coverage for the custom task-status control and verified status persistence after reload.
- Revalidated the release-gate suites independently after an unstable combined run: authenticated workflows 4/4, API isolation/CRUD 6/6, routing/responsive login 11/11, and backend portal regressions 10/10.
- Added the Playwright origin to backend CORS and preserved unauthenticated routing coverage by requiring an explicit test-auth local-storage flag.
- Full Playwright suite passed: 14 tests, including authenticated workflows, route protection, login accessibility, and mobile/tablet/desktop overflow checks.
- Redesigned `ProjectDetail` with a separated project hero, dedicated overall-progress panel, health indicator, task counters, project facts, and a distinct task workspace toolbar.
- Updated shared `Progress` to accept optional sizing classes without changing its token-based fill behavior.
- Updated shared `GlassModal` to use an opaque `bg-surface` dialog surface consistent with time tracker forms.
- Fixed project-detail comment modal visibility so task-card comment actions work from any detail view tab.
- Refined the remaining portal pages (`Projects`, `My Tasks`, and `Project Groups`) with stronger page hierarchy, workspace eyebrows, solid summary metric cards, and clearer action/tool layouts.
- Fixed the My Tasks detail status callback so status changes from the task detail modal send the selected task status correctly.
- Resolved Department reference validation error: replaced global unique index with compound index `{ name: 1, company: 1 }` and allowed global/seed departments with `company: null` across services and controllers.
- Resolved ActivityLog duplicate key collision (`batchId_1_startTime_1`) during task drag-and-drop: dropped obsolete index, added startup cleanup, and wrapped logger in retry/fallback error recovery.
- Scoped Project Detail Task creation modal: completely hid the redundant project selector and strictly filtered assignees to project members (`owner` + `team`) with auto-selection.
- Aligned Dashboard Active Project KPI badges with cards and list: migrated legacy statuses (`In Progress`, `Open` -> `Active`) and updated dashboard query logic for privileged and company roles.
- Implemented full Project Groups portfolio hierarchy:
  - Added `projectGroup` reference to `projectSchema` with indexing and Joi validation.
  - Implemented bidirectional synchronization in `projectService` and `projectGroupService` across create, update, and delete actions.
  - Built dynamic progress rollups on Project Groups using `projectService.getProjectProgressMap` (aggregating child project task completions).
  - Added `GET /api/v1/project-groups/:id` route, controller, and service method.
  - Added Project Group selection to `NewProjectDrawer` and `EditProjectForm`.
  - Added Group column badge and Group filter dropdown to `Projects.jsx`.
  - Added Project Group badge to `ProjectDetail.jsx` header.
  - Upgraded `ProjectGroups.jsx` with 4-metric summary ribbon, rollup progress bars, active/total project chips, child project drill-down modal, and project assignment management.
  - Added `updateProjectGroup` thunk to `projectGroupSlice.js`.
  - Verified with Jest service tests (5/5), Jest contract tests (5/5), and Vite production build (`npm run build`).

## In Progress

- Expand authenticated browser coverage to project/task CRUD dialogs, attachment flows, explicit invalid-payload UI error states, and project-detail viewport assertions for the separated hero/progress hierarchy.

## Next Up

- Add isolated project/task/group integration coverage against the seeded database.
- Add upload, permission-denial, invalid-payload, and missing-resource browser/API checks.
- Resolve remaining upload persistence and read-permission policy gaps.

## Open Questions

- Project uploads are accepted by routes but not persisted by current services.
- Existing backend tests cannot start MongoMemoryServer in the current environment; portal contract/service tests remain database-independent.

## Architecture Decisions

- Adopted the "Golden White Glassmorphism" system and locked in the `amber-*` scale for tints to bypass CSS variable opacity issues.
- `PortalTable` remains portal-local; the protected `TableWithPagination` was not changed.
- Project progress is computed from task completion values in backend service responses.

## Session Notes

- Ensure `overflow-x-auto` is strictly contained within tables and all colors remain token-driven.
- Keep project detail progress visually separate from title metadata and action buttons.
- Do not declare the portal fully verified until browser, authorization, and integration checks run successfully.
