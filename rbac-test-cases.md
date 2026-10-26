# RBAC Testing Cases - Project Portal

## Overview
Testing coverage for all roles against the defined permission matrix in `backend/constants/permissions.js` and project portal role rules.

---

## Role Definitions

| Role | People Portal Role | Project Portal Role |
|------|-------------------|---------------------|
| `superadmin` | Super Admin | Project Administrator (full access) |
| `admin` | Admin | Project Administrator |
| `hr` | HR | Restricted to Employee permissions |
| `manager` | Manager | Project Manager |
| `employee` | Employee | Team Member |
| `technician` | Technician | Technician (project access only) |
| `globalreader` | Global Reader | Global Reader |

---

## Permission Matrix Reference (`backend/constants/permissions.js`)

| Permission | Allowed Roles |
|------------|--------------|
| `users:read` | `superadmin`, `admin`, `hr`, `globalreader` |
| `users:create` | `superadmin`, `admin`, `hr` |
| `users:update` | `superadmin`, `admin`, `hr` |
| `users:delete` | `superadmin` |
| `users:manage_roles` | `superadmin`, `admin` |
| `attendance:read:own` | `*` (all) |
| `attendance:read:team` | `manager`, `superadmin`, `admin`, `hr`, `globalreader` |
| `attendance:read:all` | `superadmin`, `admin`, `hr`, `globalreader` |
| `attendance:edit` | `superadmin`, `admin`, `hr` |
| `timesheets:read:own` | `*` (all) |
| `timesheets:read:team` | `manager`, `superadmin`, `admin`, `globalreader` |
| `timesheets:read:all` | `superadmin`, `admin`, `globalreader` |
| `timesheets:approve` | `superadmin`, `admin`, `manager` |
| `expenses:read:own` | `*` (all) |
| `expenses:read:team` | `manager`, `superadmin`, `admin`, `hr`, `globalreader` |
| `expenses:read:all` | `superadmin`, `admin`, `globalreader` |
| `expenses:approve` | `superadmin`, `admin`, `manager` |
| `leaves:read:own` | `*` (all) |
| `leaves:read:team` | `manager`, `superadmin`, `admin`, `hr`, `globalreader` |
| `leaves:read:all` | `superadmin`, `admin`, `hr`, `globalreader` |
| `leaves:approve` | `superadmin`, `admin`, `hr`, `manager` |
| `payroll:read` | `superadmin`, `admin`, `hr`, `globalreader` |
| `payroll:manage` | `superadmin`, `admin`, `hr` |
| `tenant:read` | `superadmin`, `globalreader` |
| `tenant:manage` | `superadmin` |
| `tickets:read:own` | `*` (all) |
| `tickets:read:team` | `manager`, `superadmin`, `admin`, `globalreader` |
| `tickets:read:all` | `superadmin`, `admin`, `globalreader` |
| `tickets:create` | `*` (all) |
| `tickets:assign` | `superadmin`, `admin` |
| `tickets:edit` | `superadmin`, `admin` |
| `tickets:manage_status` | `superadmin`, `admin`, `manager` |
| `projects:access` | `superadmin`, `admin`, `manager`, `employee`, `hr`, `technician`, `globalreader` |
| `projects:create` | `superadmin`, `admin` |
| `projects:edit` | `superadmin`, `admin`, `manager` |
| `projects:delete` | `superadmin`, `admin` |
| `projects:read:own` | `*` (all) |
| `projects:read:all` | `superadmin`, `admin`, `globalreader` |
| `projects:manage` | `superadmin`, `admin`, `manager` |
| `tasks:create` | `superadmin`, `admin`, `manager` |
| `tasks:edit:critical` | `superadmin`, `admin`, `manager` |
| `tasks:edit:uncritical` | `*` (all) |
| `tasks:delete` | `superadmin`, `admin`, `manager` |
| `project_groups:manage` | `superadmin`, `admin` |
| `files:read:all` | `superadmin`, `admin`, `globalreader` |
| `files:manage` | `superadmin`, `admin` |

---

## Test Case Structure

Each test case follows the pattern:
- **Setup**: Create a user with a specific role (and `hasProjectPortalAccess: true` where applicable)
- **Action**: Call the relevant service method with the user and company context
- **Expectation**: 
  - ✅ **Allowed**: Resolves successfully
  - ❌ **Blocked**: Rejects with status 403 and message 'You do not have access to the Project Portal.' or role-specific denial message

---

## Super Admin (`superadmin`)

### ✅ Allowed Actions (has every permission)

| Category | Action |
|----------|--------|
| User Management | `users:read`, `users:create`, `users:update`, `users:delete`, `users:manage_roles` |
| Attendance | `attendance:read:own`, `attendance:read:team`, `attendance:read:all`, `attendance:edit` |
| Timesheets | `timesheets:read:own`, `timesheets:read:team`, `timesheets:read:all`, `timesheets:approve` |
| Expenses | `expenses:read:own`, `expenses:read:team`, `expenses:read:all`, `expenses:approve` |
| Leaves | `leaves:read:own`, `leaves:read:team`, `leaves:read:all`, `leaves:approve` |
| Payroll | `payroll:read`, `payroll:manage` |
| Tenant | `tenant:read`, `tenant:manage` |
| Ticketing | `tickets:read:own`, `tickets:read:team`, `tickets:read:all`, `tickets:create`, `tickets:assign`, `tickets:edit`, `tickets:manage_status` |
| Projects/Tasks | `projects:access`, `projects:create`, `projects:edit`, `projects:delete`, `projects:read:own`, `projects:read:all`, `projects:manage`, `tasks:create`, `tasks:edit:critical`, `tasks:edit:uncritical`, `tasks:delete`, `project_groups:manage`, `files:read:all`, `files:manage` |

### ✅ Project Portal Specific
- Can create projects without projectRole restriction
- Can create tasks in any project
- Can delete any project/group
- Has unrestricted access to all project portal features

---

## Admin (`admin`)

### ✅ Allowed Actions

| Category | Action |
|----------|--------|
| User Management | `users:read`, `users:create`, `users:update` (cannot `delete` or `manage_roles`) |
| Attendance | `attendance:read:own`, `attendance:read:team`, `attendance:read:all`, `attendance:edit` |
| Timesheets | `timesheets:read:own`, `timesheets:read:team`, `timesheets:read:all`, `timesheets:approve` |
| Expenses | `expenses:read:own`, `expenses:read:team`, `expenses:read:all`, `expenses:approve` |
| Leaves | `leaves:read:own`, `leaves:read:team`, `leaves:read:all`, `leaves:approve` |
| Payroll | `payroll:read` (cannot `manage`) |
| Tenant | `tenant:read` (cannot `manage`) |
| Ticketing | `tickets:read:own`, `tickets:read:team`, `tickets:read:all`, `tickets:create`, `tickets:edit`, `tickets:manage_status` (cannot `assign`) |
| Projects/Tasks | `projects:access`, `projects:create`, `projects:edit`, `projects:delete`, `projects:read:own`, `projects:read:all`, `projects:manage`, `tasks:create`, `tasks:edit:critical`, `tasks:edit:uncritical`, `tasks:delete` |
| Project Groups | `project_groups:manage` |
| Files | `files:read:all` (cannot `manage`) |

### ✅ Project Portal Specific
- Can create projects (but not if blocked by projectRole)
- Can create tasks in managed projects
- Can edit/delete projects they own or manage
- Can manage project groups

### ❌ Blocked Actions
- `users:delete` → 403
- `users:manage_roles` → 403
- `payroll:manage` → 403
- `tenant:manage` → 403
- `tickets:assign` → 403

---

## HR (`hr`)

### ✅ Allowed Actions

| Category | Action |
|----------|--------|
| User Management | `users:read`, `users:create`, `users:update` |
| Attendance | `attendance:read:own`, `attendance:read:team`, `attendance:read:all`, `attendance:edit` |
| Timesheets | `timesheets:read:own` (cannot read team/all) |
| Expenses | `expenses:read:own` (cannot read team/all) |
| Leaves | `leaves:read:own`, `leaves:read:team`, `leaves:read:all`, `leaves:approve` |
| Payroll | `payroll:read`, `payroll:manage` |
| Tenant | `tenant:read` (cannot `manage`) |
| Ticketing | `tickets:read:own`, `tickets:read:team`, `tickets:read:all` (cannot `create`, `assign`, `edit`, `manage_status`) |
| Projects/Tasks | `projects:access`, `projects:read:own`, `projects:read:all` (cannot `create`, `edit`, `delete`, `manage`) |
| Tasks | `tasks:edit:uncritical` (cannot `create`, `edit:critical`) |

### ✅ Project Portal Specific
- **Important**: HR has **Employee-level privileges** in the project portal (per existing test cases at `backend/tests/portal/rbac.test.js:298-459`)
- Cannot create projects
- Cannot create tasks
- Cannot delete tasks
- Cannot create project groups
- Can only update uncritical fields on own assigned tasks
- Cannot modify critical fields (priority, team assignee)

### ❌ Blocked Actions
- `users:delete` → 403
- `attendance:edit` on team/all → blocked (has own permission but project portal restricts)
- `timesheets:read:team`/`read:all` → 403 in project portal
- `expenses:read:team`/`read:all` → 403 in project portal
- `payroll:manage` → blocked in project portal (but `payroll:read` may apply)
- All project creation/modification actions

### HR vs Employee Boundary
- HR is **blocked from** creating projects/tasks (same as Employee)
- HR **can** approve leaves (Employee cannot)
- HR **can** read all leaves vs Employee reads own only
- HR has `payroll:manage` vs Employee has no payroll access

---

## Manager (`manager`)

### ✅ Allowed Actions

| Category | Action |
|----------|--------|
| User Management | `users:read` (cannot `create`/`update`/`delete`) |
| Attendance | `attendance:read:own`, `attendance:read:team`, `attendance:read:all`, `attendance:edit` |
| Timesheets | `timesheets:read:own`, `timesheets:read:team`, `timesheets:approve` |
| Expenses | `expenses:read:own`, `expenses:read:team`, `expenses:read:all`, `expenses:approve` |
| Leaves | `leaves:read:own`, `leaves:read:team`, `leaves:read:all`, `leaves:approve` |
| Payroll | `payroll:read` (cannot `manage`) |
| Tenant | `tenant:read` (cannot `manage`) |
| Ticketing | `tickets:read:own`, `tickets:read:team`, `tickets:read:all`, `tickets:edit`, `tickets:manage_status` (cannot `create`, `assign`) |
| Projects/Tasks | `projects:access`, `projects:edit`, `projects:read:own`, `projects:read:all`, `projects:manage`, `tasks:create`, `tasks:edit:critical`, `tasks:edit:uncritical`, `tasks:delete` |
| Project Groups | `project_groups:manage` (via `projects:manage`) |

### ✅ Project Portal Specific
- Can create tasks in projects they manage or belong to
- Can edit critical and uncritical fields
- Can delete tasks
- Can read all projects and tasks
- Cannot create projects (blocked)
- Can manage project groups

### ❌ Blocked Actions
- `users:create`/`update`/`delete` → 403
- `payroll:manage` → 403
- `tenant:manage` → 403
- `tickets:create` → 403
- `tickets:assign` → 403

---

## Employee (`employee`)

### ✅ Allowed Actions

| Category | Action |
|----------|--------|
| User Management | None (read-only `users:read` if globalreader, otherwise no user actions) |
| Attendance | `attendance:read:own` only |
| Timesheets | `timesheets:read:own` only |
| Expenses | `expenses:read:own` only |
| Leaves | `leaves:read:own` only |
| Payroll | None |
| Tenant | None |
| Ticketing | `tickets:read:own`, `tickets:create` |
| Projects/Tasks | `projects:read:own`, `projects:access`, `tasks:edit:uncritical` |
| Project Groups | None |

### ✅ Project Portal Specific
- Can update uncritical task fields (status, progress, description, workedHours) on own tasks
- Can read projects they have access to
- **Cannot** create tasks
- **Cannot** modify critical fields (priority, team assignee)
- **Cannot** delete tasks
- **Cannot** create project groups

### ❌ Blocked Actions
- `attendance:read:team`/`read:all` → 403
- `timesheets:read:team`/`read:all` → 403
- `expenses:read:team`/`read:all` → 403
- `leaves:read:team`/`read:all` → 403
- `tickets:edit` → 403 (except own)
- `tasks:edit:critical` → 403
- `tasks:delete` → 403
- `projects:create` → 403
- `projects:edit` → 403
- `projects:delete` → 403

---

## Technician (`technician`)

### ✅ Allowed Actions

| Category | Action |
|----------|--------|
| User Management | `users:read` (if in allowed list) |
| Attendance | `attendance:read:own` (`, `read:team` if globalreader overlap) |
| Timesheets | `timesheets:read:own` |
| Expenses | `expenses:read:own` |
| Leaves | `leaves:read:own` |
| Payroll | None |
| Tenant | None |
| Ticketing | `tickets:read:own`, `tickets:create` |
| Projects/Tasks | `projects:access`, `projects:read:own`, `tasks:edit:uncritical` |
| Files | `files:read:all` (if globalreader overlaps) |

### ✅ Project Portal Specific
- Has `projects:access` permission in the permissions map
- Can read all projects
- Can edit uncritical task fields on own tasks
- Technician role is **independent** of people portal role

### ❌ Blocked Actions
- `attendance:read:team`/`read:all` → depends on globalreader overlap
- `timesheets:read:team`/`read:all` → 403
- `expenses:read:team`/`read:all` → 403
- `leaves:read:team`/`read:all` → 403
- `tasks:edit:critical` → 403
- `tasks:delete` → 403
- `projects:create` → 403
- `projects:edit` → 403
- `projects:delete` → 403
- `tickets:assign` → 403
- `tickets:edit` → 403
- `tickets:manage_status` → 403

### Technician Note
- The `technician` role appears in `projects:access` allowed list (`backend/constants/permissions.js:51`)
- Technician may have specialized ticket/field access defined elsewhere (seen `isTechnician` flag in `usePermission.js`)

---

## Global Reader (`globalreader`)

### ✅ Allowed Actions

| Category | Action |
|----------|--------|
| User Management | `users:read` |
| Attendance | `attendance:read:all` |
| Timesheets | `timesheets:read:all` |
| Expenses | `expenses:read:all` |
| Leaves | `leaves:read:all` |
| Payroll | `payroll:read` |
| Tenant | `tenant:read` |
| Ticketing | `tickets:read:all` |
| Projects/Tasks | `projects:read:all`, `projects:access` |
| Files | `files:read:all` |

### ✅ Project Portal Specific
- Can read all projects and tasks
- Cannot create, edit, or delete any projects/resources
- Read-only access to entire portal

### ❌ Blocked Actions
- `users:create`/`update`/`delete` → 403
- `attendance:edit` → 403
- `timesheets:approve` → 403
- `expenses:approve` → 403
- `leaves:approve` → 403
- `payroll:manage` → 403
- `tenant:manage` → 403
- Any project creation/modification
- Any ticket assignment/edit/manage_status

---

## Project Portal Decoupled Roles

### Project Administrator

| ✅ Allowed | ❌ Blocked |
|------------|-----------|
| All project portal actions (create projects, create tasks, delete projects, manage project groups, all task modifications) | None within project portal |
| Also has all `superadmin` backend permissions (if mapped) | |

### Project Manager

| ✅ Allowed | ❌ Blocked |
|------------|-----------|
| Create tasks in managed projects | Create projects |
| Edit critical/uncritical fields on managed projects | Delete projects |
| Read all projects/tasks | Modify tasks not in managed projects |
| Manage project groups | `users:manage_roles`, `payroll:manage`, etc. |

### Team Member

| ✅ Allowed | ❌ Blocked |
|------------|-----------|
| Update uncritical fields on own assigned tasks | Create tasks |
| Read projects they belong to | Edit critical fields |
| Create tickets (general) | Delete tasks |
| | Modify another user's task |

---

## Boundary & Edge Cases

### 1. HR Has Employee Privileges in Project Portal
- **Test**: HR user cannot create projects, create tasks, delete tasks, or modify critical fields
- **Message**: 'Only Project Administrators can create new projects.' or 'Team members cannot create new tasks.'

### 2. ProjectRole Elevation (Employee → Manager in Project Portal)
- **Test**: User with `role: 'Employee'` but `projectRole: 'Manager'` can create tasks in managed projects but cannot create projects
- **Verification**: People portal role (`role`) remains unchanged

### 3. Demotion (Manager → Employee in Project Portal)
- **Test**: User with `role: 'Manager'` but `projectRole: 'Employee'` is restricted to employee permissions (cannot create tasks, blocked from task creation)

### 4. Unauthorized Access (no project portal flag)
- **Test**: User with `hasProjectPortalAccess: false` receives 403 'You do not have access to the Project Portal.'
- **Exception**: Super Admin can bypass this restriction

### 5. Global Reader vs Employee
- **Test**: Global Reader can read all records (`:all` variants) while Employee can only read own (`:own`)
- **Verification**: Both have `hasProjectPortalAccess: true`

### 6. Technician Independence
- **Test**: Technician has `projects:access` but may not have other role-specific permissions
- **Verification**: Technician role is separate from people portal roles

---

## Test Naming Convention

```
describe('${Role} RBAC Enforcement', () => {
  describe('${Category}', () => {
    test('allows ${role} to ${action}', async () => { ... });
    test('blocks ${role} from ${action}', async () => { ... });
  });
});
```

**Examples:**
- `test('allows super admin to create projects', ...)`
- `test('blocks employee from creating tasks', ...)`
- `test('blocks HR from creating projects in project portal', ...)`
- `test('allows manager to edit critical fields on own tasks', ...)`
- `test('blocks technician from assigning tickets', ...)`
- `test('allows global reader to read all projects', ...)`