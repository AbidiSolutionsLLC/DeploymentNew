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

- `frontend/src/components/projectPortal/` — Owns the shared command center UI components (e.g., `PortalTable`, `PortalHeader`, `Pill`, `FilterChips`).
- `frontend/src/pages/projects/` — Owns the page-level assembly and data fetching orchestration.
- `backend/models/` — Owns the Mongoose schemas (`projectSchema.js`, `taskSchema.js`) and is the source of truth for enums.
- `backend/JoiSchema/` — Owns request validation and MUST stay in strict sync with Mongoose models.
- `backend/services/` — Owns business logic and database queries for the Project Portal.

## Storage Model

- **MongoDB**: Primary storage for Projects, Tasks, and Project Groups.
- **Client State (Redux)**: Caches `dashboardData`, `tasks`, and `groups`.

## Auth and Access Model

- Base URL for APIs is `/api/v1`.
- Permission denial surfaces as a 403 `ForbiddenError`.
- Only the owner or team members can mutate specific project resources.
- `Axios` automatically unwraps `{success, data}` to return `data`.

## Invariants

1. **Enum Consistency**: Joi schemas and Mongoose models must always define the exact same enum values for status and priority.
2. **Token-Only Colors**: Tailwind opacity modifiers (`bg-brand/10`) must NOT be used on `var()`-based tokens. Use the `amber-*` scale for brand tints.
3. **No Horizontal Page Scroll**: Tables may use `overflow-x-auto`, but the main page `<body>` must never scroll horizontally.
4. **Error Handling**: Mutations must wrap in `try/catch`. Success triggers `toast.success` and a refetch/state update. Failures trigger `toast.error(err.message)`.
