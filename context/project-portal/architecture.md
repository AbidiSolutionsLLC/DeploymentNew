# Project Portal - Architecture Context

## Stack

| Layer     | Technology                  | Role                                  |
| --------- | --------------------------- | ------------------------------------- |
| Framework | React (Vite)                | Frontend rendering                    |
| UI        | Tailwind CSS + Custom Kit   | Styling & Glassmorphism design system |
| State/API | Redux Toolkit + Axios       | Data fetching and global state        |
| Backend   | Node.js + Express           | API Gateway and business logic        |
| Database  | MongoDB (Mongoose)          | Persistent storage                    |
| Validation| Joi                         | Request payload validation            |

## System Boundaries

- `frontend/src/components/projectPortal/` — Owns the shared command center UI components (e.g., `PortalTable`, `PortalHeader`, `Pill`, `FilterChips`, `AddTaskForm`, `EditProjectForm`).
- `frontend/src/pages/projects/` — Owns the page-level assembly, data fetching orchestration, and portfolio modals.
- `backend/models/` — Owns the Mongoose schemas (`projectSchema.js`, `taskSchema.js`, `projectGroupSchema.js`, `department.js`, `activityLog.js`) and is the source of truth for enums and indexes.
- `backend/JoiSchema/` — Owns request validation and MUST stay in strict sync with Mongoose models (including optional `projectGroup` in `ProjectJoiSchema.js`).
- `backend/services/` — Owns business logic and database queries for the Project Portal, including company-scoped reference validation, bidirectional project-group synchronization, resilient activity logging, and dynamic progress rollups.

### Project detail composition

- `ProjectDetail.jsx` owns project-level orchestration, task filtering, board/list/comments state, and mutation dispatches.
- `AddTaskForm.jsx` / `addTaskModal.jsx` auto-scopes task creation to the active project when `projectId` is provided: the project field is completely hidden, and assignees are strictly constrained to the project's `owner` and `team` members with auto-selection.
- `components/projectPortal/Progress.jsx` owns the visual progress primitive and supports optional track/container classes.
- `TaskCard`, `TaskDetailDrawer`, and `TaskCommentsDrawer` remain task-level modules; the page should not duplicate their internal interaction logic.
- The project hero is presentation-only: it derives task counters and health copy from the already-fetched project/task state and displays the assigned Project Group badge.

## Storage Model

- **MongoDB**: Primary storage for Projects, Tasks, Project Groups, Departments, and Activity Logs.
  - `projectSchema`: Contains `projectGroup: { type: ObjectId, ref: 'ProjectGroup', default: null, index: true }`.
  - `projectGroupSchema`: Contains `projects: [{ type: ObjectId, ref: 'Project' }]`.
  - `department`: Scoped with compound index `{ name: 1, company: 1 }` allowing global fallback departments (`company: null`).
  - `activitylogs`: Operates without obsolete unique index `batchId_1_startTime_1` to prevent task drag-and-drop collisions.
- **Client State (Redux)**: Caches `dashboardData`, `tasks`, and `projectGroups` (with full `updateProjectGroup` support).

## Backend Logic & Service Design

1. **Bidirectional Group Synchronization**:
   - `createProject`: Adds `_id` to `ProjectGroup.projects` via `$addToSet`.
   - `updateProject`: Atomically pulls `_id` from old group and adds to new group when changed.
   - `deleteProject`: Safely pulls `_id` from associated project groups.
   - `createGroup`, `updateGroup`, `deleteGroup`: Synchronizes child `Project.projectGroup` references, clearing them to `null` upon removal or group deletion.
2. **Dynamic Roll-Up Progress Calculation**:
   - Project Group progress is computed dynamically in `getAllGroups` and `getGroupById` (`GET /api/v1/project-groups/:id`) by aggregating task completion averages across child projects using `projectService.getProjectProgressMap(projectIds, companyId)`.
3. **Resilient Activity Logging**:
   - Task drag-and-drop updates record batch activity logs. The service traps duplicate key errors (`E11000`) and falls back gracefully so task status updates never fail due to background logging issues.
4. **Dashboard KPI Alignment**:
   - `getProjectDashboard` normalizes active statuses (`{ $in: ["Active", "Planning", "In Progress", "Open"] }`) and accounts for privileged roles (`admin`, `superadmin`, technician `manager`) to ensure the KPI badges match the active project card and project list counts.

## Auth and Access Model

- Base URL for APIs is `/api/v1`.
- Permission denial surfaces as a 403 `ForbiddenError`; route mounting supplies authenticated company scope.
- Only the owner or team members (or privileged admins) can mutate specific project resources.
- `Axios` automatically unwraps successful `{success, data}` responses to return `data`; rejected requests retain their error response for page-level messaging.

## Invariants

1. **Enum Consistency**: Joi schemas and Mongoose models must always define the exact same enum values for status and priority.
2. **Token-Only Colors**: Tailwind opacity modifiers (`bg-brand/10`) must NOT be used on `var()`-based tokens. Use the `amber-*` scale for brand tints.
3. **No Horizontal Page Scroll**: Tables may use `overflow-x-auto`, but the main page `<body>` must never scroll horizontally.
4. **Error Handling**: Mutations must wrap in `try/catch`. Success triggers `toast.success` and a refetch/state update. Failures trigger `toast.error(err.message)`.
5. **Tenant References**: Project owners/team members, task assignees, departments, and `projectGroup` associations must belong to the current company (departments also permit system global departments where `company: null`).
6. **Project-Scoped Task Creation**: When creating a task inside a project detail page, the project field must be omitted/hidden, and assignee selection must be strictly restricted to project members (`owner` and `team`).
7. **Bidirectional Group Integrity**: Projects and Project Groups must maintain bidirectional reference integrity with zero dangling IDs.
