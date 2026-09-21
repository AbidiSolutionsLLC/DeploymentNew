# Role-Based Access Control (RBAC) Documentation

## Part 1: Roles, Permissions & Access

### 1.1 Application Roles Overview

The system has **7 canonical application roles** plus **3 resource-level ACL roles** (used only for files/folders). Roles currently appear in the codebase under multiple casing conventions (e.g. `"Super Admin"`, `"superadmin"`, and a legacy/buggy `"SuperAdmin"`), which is a normalization issue addressed in Part 2.

| Role | Data Scope | Can Manage Users | Can Approve Leaves/Timesheets | Can Approve/Edit Expenses | Ticket Visibility | Write Access |
|---|---|---|---|---|---|---|
| **Super Admin** | All records, all companies | All roles, incl. other Super Admins | All | All (org-wide) | All tickets | Full |
| **Admin** | Org-wide (most modules); team-scoped for tickets/expenses | All except Super Admin | Subordinates only | Team-scoped | Team only | Most (no attendance edit, no time-tracker edit) |
| **HR** | Org-wide for attendance/leaves/timesheets/users; self-only for expenses | No | All (org-wide) | Self only, cannot approve | None (blocked) | Limited (no user create, no ticket access) |
| **Manager** | Team (direct + indirect reports) | No | Direct team only | Team (approve) | Depends on `isTechnician` flag | Limited |
| **Employee** | Self only | No | Own only | Self only (create) | Can raise own tickets | Self-service only |
| **Technician** | Self + assigned/closed tickets | No | Own only | Self only | Assigned/closed/own tickets (3-way OR) | Ticket status updates |
| **Global Reader** | All records (read-only) | No | No | No | All (read-only) | **None** — all non-GET requests blocked |

### 1.2 Detailed Role Breakdown

**Super Admin**
- Backend: Full CRUD on users, companies, departments, projects, tasks, tickets; holiday CRUD; payroll generate/preview/history; org-wide expense and timesheet approval/editing; the only role that can edit/delete time-tracker records; full file/folder operations; admin dashboard stats.
- Frontend: Full admin sidebar; can create users of any role (including other Super Admins); can edit attendance and generate payroll; sees all tickets; not subject to the read-only modal.

**Admin**
- Backend: Same gated routes as Super Admin (holidays, payroll, expense approval, timesheet status), but scoped org-wide for attendance/leaves/timesheets/user management and team-scoped (2-level `reportsTo` hierarchy) for tickets and expenses.
- Frontend: Same admin sidebar as Super Admin except ticket-assignment configuration; can create users but not other Super Admins; cannot edit attendance or time-tracker records.

**HR**
- Backend: Holiday CRUD, payroll generate/preview/history, timesheet approval — all org-wide. No access to tickets (service returns `{_id: null}`). Expenses are self-only.
- Frontend: Admin sidebar without the Assign Ticket link; dashboard shows an "HR Overview" title with ticket stats hidden; cannot create users or approve expenses.

**Manager**
- Backend: Approves expenses and timesheets, but only within their team; scope is team-only for attendance, leaves, timesheets, and expenses. Ticket access depends entirely on the `isTechnician` flag.
- Frontend: Admin sidebar visible; "Assigned Tickets" and "Assign Ticket" sub-nav appear only when `isTechnician = true`; cannot create users or edit attendance.
- **Note:** Manager is effectively two behavioral variants (technician vs. non-technician) controlled by a boolean flag rather than a distinct role — see Part 2, Problem 1.

**Employee**
- Backend: No route-level restrictions; relies entirely on the self-only fallback in the service-level scoping logic.
- Frontend: People module only (Home, Profile, Attendance, Time Tracker, Leave Tracker, Tickets) — no admin sidebar. Can raise tickets, submit leaves, log time.

**Technician**
- Backend: Self-only scope for most modules; for tickets, scope is a 3-way OR (assigned to them, closed by them, or created by them).
- Frontend: People module plus a visible "Assigned Tickets" sub-nav; can update the status of assigned tickets.
- **Note:** When combined with the Manager role (`isTechnician: true`), a user gains near-Admin-level ticket and user-visibility permissions — an emergent, undocumented permission tier.

**Global Reader**
- Backend: Blocked from every non-GET request at the middleware level; the data-scoping logic returns all records (a "god mode" filter, but read-only).
- Frontend: Full admin sidebar visible; any write action triggers a read-only warning modal instead of executing.

**ACL Roles (file/folder resource-level only)**
These are independent of the 7 application roles and apply per-file:
- `owner` — full control over the file
- `editor` — can edit file metadata/content
- `viewer` — read-only access
This creates a second, disconnected permission system that does not interoperate with the application-level roles (see Part 2, Problem 3).

### 1.3 Known Data Integrity Issues Affecting Access
- **Casing inconsistency:** the same role is represented as `"Super Admin"`, `"superadmin"`, and (as a bug) `"SuperAdmin"` in different parts of the codebase; the unnormalized `"SuperAdmin"` string will silently fail equality checks in services that don't normalize before comparing.
- **Missing company scoping:** several models (Todo, Holiday, Department, File, Folder, Log) lack a `company` field, which is a multi-tenant data-leak risk regardless of role.
- **Inconsistent enforcement layers:** role checks exist at the route level (`restrictTo`), the service level (inline string comparisons), and the data-scoping level (`rbac.js`), but only a small fraction of routes are actually protected at the route layer, and there is currently no enforcement at all on the frontend route layer.

---

## Part 2: Recommended Approach — Industry Best Practices

### 2.1 Current State Assessment

| Layer | Status |
|---|---|
| Backend route-level (`restrictTo`) | Only a small fraction of routes protected |
| Backend service-level (`rbac.js` / scoping utils) | Reasonably solid for data scoping, but several services bypass it with inline checks |
| Frontend route-level | No enforcement |
| Frontend UI-level (sidebar hiding) | Cosmetic only — does not prevent direct access |

### 2.2 Core Problems With the Current Model

1. **Roles are overloaded.** A single role (e.g. Manager) behaves differently depending on a side flag (`isTechnician`), effectively creating hidden sub-roles that aren't documented or centrally defined.
2. **No separation between identity and capability.** Checks like `role === 'Super Admin'` conflate "who the user is" with "what they're allowed to do." This means every new feature requires touching role-check logic in many files, and it's impossible to grant one extra permission to a role without redefining that role.
3. **Two disconnected permission systems.** Application roles (7) and file ACL roles (3: owner/editor/viewer) don't share a model, so file access rules can't be reasoned about consistently with everything else.

### 2.3 Recommended Architecture

**1. Single source of truth for roles**
Define all role constants in one place (e.g. `backend/constants/roles.js`) and import from there everywhere. Eliminate raw role strings scattered across route files, services, and schemas.

**2. Move from role checks to permission checks**
Replace `role === 'Admin'` with `hasPermission('users:delete')`. Define a permissions map per role:

```js
// constants/permissions.js
const PERMISSIONS = {
  'users:create':          ['Super Admin', 'Admin'],
  'users:delete':          ['Super Admin'],
  'attendance:read:own':   ['*'],
  'attendance:read:team':  ['Manager'],
  'attendance:read:all':   ['Super Admin', 'Admin', 'HR', 'Global Reader'],
  'attendance:edit':       ['Super Admin'],
  'leaves:approve':        ['Super Admin', 'Admin', 'HR', 'Manager'],
  'timesheets:approve':    ['Super Admin', 'Admin', 'HR', 'Manager'],
  'expenses:approve':      ['Super Admin', 'Admin', 'Manager'],
  'tickets:read:all':      ['Super Admin', 'Admin'],
  'tickets:assign':        ['Super Admin', 'Admin'],
  'holidays:manage':       ['Super Admin', 'Admin', 'HR'],
  'payroll:manage':        ['Super Admin', 'Admin', 'HR'],
  // ...continue per module
};
```

Backend middleware then checks a permission, not a role list:
```js
router.delete('/:id', isLoggedIn, requirePermission('tasks:delete'), deleteTask);
```

Frontend mirrors this with a hook:
```js
export function usePermission() {
  const { user } = useSelector((state) => state.auth);
  return {
    hasPermission: (permission) => {
      const allowed = PERMISSIONS[permission];
      return !!allowed && (allowed.includes(user?.role) || allowed.includes('*'));
    },
  };
}
```

**3. Close the frontend route-guard gap (highest-impact fix)**
Add a `allowedRoles` (or permission-based equivalent) prop to the route guard component so unauthorized users are redirected rather than relying on hidden UI elements:
```jsx
const PrivateRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  if (!isAuthenticated) return <Navigate to="/auth/login" />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" />;
  }
  return children;
};
```
Add a corresponding `/unauthorized` (403) page so blocked users get feedback instead of silent failure.

**4. Protect all backend routes, prioritized by risk**

| Priority | Routes | Why |
|---|---|---|
| P0 | Delete user/company, create user, admin bootstrap/setup | Data destruction and privilege-escalation risk |
| P1 | Approval/status endpoints for leaves, expenses, timesheets; delete on project/task/ticket | Approval or deletion bypass |
| P2 | All remaining routes | Defense in depth |

**5. Normalize role strings once, centrally**
Store one canonical casing (e.g. `"Super Admin"`) in the database, and normalize only inside a single shared comparison utility (e.g. lowercase + strip spaces). Remove the legacy `"SuperAdmin"` value via a migration, and update every inline comparison to use the shared utility instead of ad hoc string checks.

**6. Add company scoping wherever it's missing**
Add a `company` reference to every model that lacks one (Todo, Holiday, Department, File, Folder, Log) and scope all queries by `req.companyId`. This closes a multi-tenant data-leak risk.

**7. Eliminate inline role checks in services**
Replace raw string comparisons in services with shared helpers (`isAdmin()`, `isHR()`, `isManager()`, `isEmployee()`, `isTechnician()`, `isGlobalReader()`), used consistently everywhere — including notification-recipient logic, which is currently inconsistent.

**8. Unify the two ACL systems**
Rather than maintaining `owner/editor/viewer` as a separate model, either:
- map ACL entries onto the same permission strings used elsewhere (e.g. `owner` → `files:manage:own`), or
- keep ACL as a fallback, but check application-level permissions first:
```js
function canAccessFile(user, file, requiredPermission) {
  if (user.role === 'Super Admin') return true;
  if (hasPermission(user.role, requiredPermission)) return true;
  return file.acl.some(entry =>
    entry.userId.equals(user._id) &&
    permissionLevel(entry.permission) >= permissionLevel(requiredPermission)
  );
}
```

**9. Separate data scoping from access control**
Keep "can the user perform this action" (permissions) distinct from "which records can they see" (data scope). Implement scoping as its own middleware:
```js
function dataScope(type) {
  return (req, res, next) => {
    req.dataScope = getSearchScope(req.user, type);
    next();
  };
}
```

**10. Formalize the Global Reader's read-only restriction**
Keep the non-GET block, but extract it into an explicit, named middleware (e.g. `readOnly`) rather than leaving it implicit inside a generic auth middleware, so its intent is discoverable.

**11. Standardize middleware ordering**
Every protected route should consistently follow: `isLoggedIn → requirePermission → dataScope/companyScope → validationMiddleware`. Audit for and remove duplicate middleware application (e.g. `isLoggedIn` applied both at router mount and again at the file level).

**12. Document and test the permission matrix**
- Maintain a living document mapping every role to every permission, API route, and data scope (Part 1 of this document is the starting point).
- Write automated tests per role, including edge cases: Global Reader attempting a write, the Manager/Technician combination, and the legacy `"SuperAdmin"` string.

### 2.4 Summary of Priorities

1. Frontend route guards (currently zero enforcement — highest risk of unauthorized access via direct URL).
2. Route-level protection on destructive/privilege-escalating backend endpoints (P0 above).
3. Role string normalization and removal of the legacy `"SuperAdmin"` value.
4. Migration to a permission-based model to replace scattered role checks.
5. Company scoping on the remaining unscoped models.
6. Consolidation of the ACL and application permission systems.
