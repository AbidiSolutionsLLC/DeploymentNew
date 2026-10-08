# Project Portal - Overview

## Overview

The Project Portal is a centralized command center for managing company projects, individual tasks, and project groups within the Karbexa platform. It provides a dense, "Golden White Glassmorphism" UI for users to track their ongoing work, deadlines, and project health.

## Goals

1. Provide a dense, performant, and easily readable dashboard for project tracking.
2. Enable seamless management of Projects, Tasks, and Project Groups.
3. Ensure strict alignment between the frontend state (Redux/Axios) and the backend contracts (Express/Mongoose).

## Core User Flow

1. User lands on the **Project Dashboard** (`/project/projectDashboard`) to view their active projects, open tasks, and recent deadlines.
2. User navigates to **Projects** (`/project/projects`) to view all company projects, filter by status, or create a new project.
3. User checks **My Tasks** (`/project/myTasks`) to update task statuses inline and track priority items.
4. User groups related projects in **Project Groups** (`/project/projectGroups`).

## Features

### Dashboard Command Center
- KPI Ribbon for active metrics (Active Projects, Completed, Open Tasks, Project Groups).
- Bento grid layout with time tracking charts and upcoming deadlines.

### Project Management
- Full CRUD operations for projects.
- Status tracking (`Planning`, `Active`, `On Hold`, `Completed`, `Cancelled`).

### Task Management
- Assigned tasks view with priority and status tagging.
- Inline status updating.

### Project Groups
- Grouping mechanisms for related projects.

## Scope

### In Scope
- The 4 redesigned pages: Dashboard, Projects, My Tasks, Project Groups.
- Component kit inside `frontend/src/components/projectPortal/`.
- Corresponding backend Mongoose models (`projectSchema`, `taskSchema`), Joi schemas, and services.

### Out of Scope
- People Portal.
- `ProjectDetail` (`/project/projectDetailed/:id`) - currently uses mock hooks, will be a separate work item.
- Modifying legacy components outside of the newly designed portal pages (e.g., `TableWithPagination`).

## Success Criteria

1. A user can navigate between the 4 portal pages without layout breakage.
2. All tables scale properly on mobile, tablet, and desktop without page-level horizontal scrolling.
3. All token-based colors (light and dark modes) render flawlessly.
4. Real backend data correctly populates the UI, respecting enums and progress calculations.
