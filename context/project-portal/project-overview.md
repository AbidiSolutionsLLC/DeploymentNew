# Project Portal - Overview

## Overview

The Project Portal is a centralized command center for managing company projects, individual tasks, and project groups within the Karbexa platform. It provides a dense, "Golden White Glassmorphism" UI for users to track their ongoing work, deadlines, and project health.

## Goals

1. Provide a dense, performant, and easily readable dashboard for project tracking.
2. Enable seamless management of Projects, Tasks, and Project Groups.
3. Ensure strict alignment between the frontend state (Redux/Axios) and the backend contracts (Express/Mongoose).

## Core User Flow

1. User lands on the **Project Dashboard** (`/project/projectDashboard`) to view active projects, open tasks, project groups, and recent deadlines with aligned KPI ribbons.
2. User navigates to **Projects** (`/project/projects`) to view company projects, filter by status or project group, or create a new project (optionally assigning it to a project group).
3. User checks **My Tasks** (`/project/myTasks`) to update assigned task statuses inline and track priority items.
4. User manages **Project Groups** (`/project/projectGroups`) as high-level strategic portfolios with dynamic progress rollups and member project drill-down.
5. User enters **Project Detail** (`/project/projectDetailed/:id`) to review project health, inspect assigned project group, and manage tasks (with task creation strictly scoped to project members).

## Features

### Dashboard Command Center
- KPI Ribbon for active metrics (Active Projects, Completed, Open Tasks, Project Groups) with normalized status counts.
- Bento grid layout with time tracking charts and upcoming deadlines.

### Project Management
- Full CRUD operations for projects.
- Status tracking (`Planning`, `Active`, `On Hold`, `Completed`, `Cancelled`).
- Optional association with a **Project Group** portfolio during creation and editing.
- Filterable project directory with a dedicated Project Group column and filter dropdown.

### Task Management
- Assigned tasks view with priority and status tagging.
- Inline status updating.
- Drag-and-drop Kanban updates with resilient activity logging.

### Project Groups (Portfolios)
- Strategic portfolio grouping layer linking multiple projects to a cohesive initiative.
- Dynamic progress roll-up computed from member project task completions.
- Portfolio KPI summary (Total Portfolios, Projects Covered, Active Projects, Average Progress).
- Member project drill-down modal showing child project statuses, individual progress bars, owners, and direct navigation links.
- Bidirectional relationship synchronization between Projects and Project Groups.

### Project Details
- Available at `/project/projectDetailed/:id`, featuring project edit/delete actions, group affiliation badge, and task workspace.
- Structured project hero with overall progress, health indicator, task counters, and project facts.
- Task creation modal auto-binds to the active project (hiding the redundant project selector) and strictly scopes assignees to project members (`owner` + `team`).
- Task workspace supporting board, list, and comments views with task search and task creation.

## Scope

### In Scope
- The 4 redesigned pages: Dashboard, Projects, My Tasks, Project Groups.
- Project Detail (`/project/projectDetailed/:id`) and its task workspace modals.
- Component kit inside `frontend/src/components/projectPortal/`.
- Corresponding backend Mongoose models (`projectSchema`, `taskSchema`, `projectGroupSchema`), Joi schemas, and services.

### Out of Scope
- People Portal.
- File-upload persistence and a complete own/all read-permission matrix require separate verification.
- Modifying legacy components outside of the newly designed portal pages (e.g., `TableWithPagination`).

## Success Criteria

1. A user can navigate between the portal pages and project details without layout breakage.
2. All tables scale properly on mobile, tablet, and desktop without page-level horizontal scrolling.
3. All token-based colors (light and dark modes) render flawlessly.
4. Real backend data correctly populates the UI, respecting enums, tenant boundaries, and dynamic progress calculations.
5. Project progress and portfolio roll-ups remain dynamic, accurate, and visually separated from project metadata.
6. Task creation within a project detail page restricts assignees strictly to project team members.
