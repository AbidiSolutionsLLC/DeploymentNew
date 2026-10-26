# Behavioral Test Cases: Team Member, Project Administrator, Project Manager
## Project Portal Pages Only

---

## Test Focus Scope
All tests below are **project portal only** - they test `projectService`, `taskService`, `projectGroupService` with `hasProjectPortalAccess: true` users. People portal roles (`role: 'Employee'`, `'Manager'`, `'HR'`) are separate from project portal roles (`projectRole`).

---

## 1. Team Member (`projectRole: 'Team Member'`

### Test Group: Task Creation
| Test Case | Expected Behavior |
|-----------|-------------------|
| `test('blocks Team Member from creating tasks')` | 403 'Team members cannot create new tasks.' |
| `test('blocks Team Member from creating projects')` | 403 'Only Project Administrators can create new projects.' |
| `test('blocks Team Member from deleting tasks')` | 403 'Team members cannot delete tasks.' |
| `test('blocks Team Member from creating project groups')` | 403 'Only Project Administrators can create project groups' |

### Test Group: Task Modification (Critical vs Uncritical)
| Test Case | Expected Behavior |
|-----------|-------------------|
| `test('blocks Team Member from editing critical field: team assignee')` | 403 'Team members can only update task status, progress percentage, worked hours, and description.' |
| `test('blocks Team Member from editing critical field: priority')` | 403 'Team members can only update task status, progress percentage, worked hours, and description.' |
| `test('blocks Team Member from modifying another user\'s task')` | 403 'You can only modify tasks assigned to you.' |
| `test('allows Team Member to update uncritical fields on own task')` | ✅ Successfully updates: description, status, completionPercent, workedHours |

### Test Group: Project Access
| Test Case | Expected Behavior |
|-----------|-------------------|
| `test('allows Team Member to read projects they belong to')` | ✅ `projects:read:own` succeeds |
| `test('blocks Team Member from editing any project')` | 403 'Only Project Administrators can...' or 'Not authorized' |
| `test('blocks Team Member from deleting projects')` | 403 'Only Project Administrators can...' |

### Test Group: Project Group Management
| Test Case | Expected Behavior |
|-----------|-------------------|
| `test('blocks Team Member from creating project groups')` | 403 'Only Project Administrators can create project groups' |
| `test('blocks Team Member from deleting project groups')` | 403 'Not authorized to delete this group' |

### Test Group: Ticket Operations
| Test Case | Expected Behavior |
|-----------|-------------------|
| `test('allows Team Member to create tickets')` | ✅ `tickets:create` allowed (all roles) |
| `test('blocks Team Member from editing any ticket')` | 403 (unless own ticket, basic fields only) |
| `test('blocks Team Member from assigning tickets')` | 403 'Not authorized' |
| `test('blocks Team Member from managing ticket status')` | 403 'Not authorized' |

---

## 2. Project Administrator (`projectRole: 'Project Administrator'`)

### Test Group: Project Creation & Management
| Test Case | Expected Behavior |
|-----------|-------------------|
| `test('allows Project Administrator to create projects')` | ✅ Project created successfully |
| `test('allows Project Administrator to edit any project')` | ✅ Can edit any project (including others') |
| `test('allows Project Administrator to delete projects')` | ✅ Can delete any project |
| `test('allows Project Administrator to read all projects')` | ✅ `projects:read:all` succeeds |

### Test Group: Task Creation & Modification
| Test Case | Expected Behavior |
|-----------|-------------------|
| `test('allows Project Administrator to create tasks in any project')` | ✅ Can create tasks regardless of project ownership/team |
| `test('allows Project Administrator to edit critical fields')` | ✅ Can edit: priority, team assignee, status, description |
| `test('allows Project Administrator to edit uncritical fields')` | ✅ Can edit: description, status, completionPercent, workedHours |
| `test('allows Project Administrator to delete any task')` | ✅ Can delete any task in any project |

### Test Group: Project Group Management
| Test Case | Expected Behavior |
|-----------|-------------------|
| `test('allows Project Administrator to create project groups')` | ✅ Can create project groups |
| `test('allows Project Administrator to delete project groups')` | ✅ Can delete any project group |
| `test('allows Project Administrator to manage project groups')` | ✅ Full CRUD on project groups |

### Test Group: Ticket Operations (Full Access)
| Test Case | Expected Behavior |
|-----------|-------------------|
| `test('allows Project Administrator to create tickets')` | ✅ `tickets:create` |
| `test('allows Project Administrator to assign tickets')` | ✅ `tickets:assign` |
| `test('allows Project Administrator to edit any ticket')` | ✅ `tickets:edit` |
| `test('allows Project Administrator to manage ticket status')` | ✅ `tickets:manage_status` |

### Test Group: File & Document Access
| Test Case | Expected Behavior |
|-----------|-------------------|
| `test('allows Project Administrator to read all files')` | ✅ `files:read:all` |
| `test('allows Project Administrator to manage files')` | ✅ `files:manage` |

---

## 3. Project Manager (`projectRole: 'Project Manager'`)

### Test Group: Task Creation (Managed Projects Only)
| Test Case | Expected Behavior |
|-----------|-------------------|
| `test('allows Project Manager to create tasks in projects they manage')` | ✅ Task created when project owner = manager's ID |
| `test('blocks Project Manager from creating tasks in unrelated projects')` | 403 'Project managers can only create tasks in projects they manage or belong to.' |
| `test('blocks Project Manager from creating projects')` | 403 'Only Project Administrators can create new projects.' |

### Test Group: Task Modification (Critical vs Uncritical)
| Test Case | Expected Behavior |
|-----------|-------------------|
| `test('allows Project Manager to edit critical fields on own tasks')` | ✅ Can edit: priority, team assignee |
| `test('allows Project Manager to edit critical fields on managed project tasks')` | ✅ Can edit critical fields on tasks in projects they manage |
| `test('blocks Project Manager from editing critical fields on others\' tasks')` | 403 'You can only modify tasks assigned to you' or project-specific restriction |
| `test('allows Project Manager to edit uncritical fields on any task')` | ✅ Can edit: description, status, completionPercent, workedHours |
| `test('allows Project Manager to delete tasks')` | ✅ Can delete tasks in managed projects |

### Test Group: Project Access & Reading
| Test Case | Expected Behavior |
|-----------|-------------------|
| `test('allows Project Manager to read all projects')` | ✅ `projects:read:all` succeeds |
| `test('allows Project Manager to read projects they manage')` | ✅ `projects:read:own` + management scope |
| `test('blocks Project Manager from editing projects they do not manage')` | 403 'Project managers can only...' or 'Not authorized' |

### Test Group: Project Group Management
| Test Case | Expected Behavior |
|-----------|-------------------|
| `test('allows Project Manager to create project groups')` | ✅ Can create project groups |
| `test('allows Project Manager to delete project groups')` | ✅ Can delete project groups they created or manage |
| `test('blocks Project Manager from deleting others\' project groups')` | 403 'Not authorized to delete this group' |

### Test Group: Ticket Operations
| Test Case | Expected Behavior |
|-----------|-------------------|
| `test('allows Project Manager to create tickets')` | ✅ `tickets:create` |
| `test('blocks Project Manager from assigning tickets')` | 403 'Not authorized to assign tickets' |
| `test('allows Project Manager to edit tickets')` | ✅ `tickets:edit` (own or managed) |
| `test('allows Project Manager to manage ticket status')` | ✅ `tickets:manage_status` |

### Test Group: Employee Demotion Boundary
| Test Case | Expected Behavior |
|-----------|-------------------|
| `test('blocks Manager with projectRole=Employee from creating tasks')` | 403 'Team members cannot create new tasks.' (when demoted to Employee role in project portal) |
| `test('allows Manager with projectRole=Manager to create tasks in managed projects')` | ✅ Normal project manager privileges |

---

## Test Data Structure (Common Pattern)

```javascript
// Team Member
const teamMember = {
  _id: new mongoose.Types.ObjectId(),
  id: '<id>',
  role: 'Employee',          // People portal role
  projectRole: 'Team Member', // Project portal role
  company: companyId,
  hasProjectPortalAccess: true,
};

// Project Administrator
const projAdmin = {
  _id: new mongoose.Types.ObjectId(),
  id: '<id>',
  role: 'Employee',
  projectRole: 'Project Administrator',
  company: companyId,
  hasProjectPortalAccess: true,
};

// Project Manager
const projManager = {
  _id: new mongoose.Types.ObjectId(),
  id: '<id>',
  role: 'Employee',          // or 'Manager' in people portal
  projectRole: 'Project Manager',
  company: companyId,
  hasProjectPortalAccess: true,
};
```

---

## Test Grouping Structure

```
describe('Team Member RBAC - Project Portal', () => {
  describe('Task Creation', () => { ... });
  describe('Task Modification', () => { ... });
  describe('Project Access', () => { ... });
  describe('Project Groups', () => { ... });
  describe('Ticket Operations', () => { ... });
});

describe('Project Administrator RBAC - Project Portal', () => {
  describe('Project Creation & Management', () => { ... });
  describe('Task Creation & Modification', () => { ... });
  describe('Project Group Management', () => { ... });
  describe('Ticket Operations', () => { ... });
  describe('File & Document Access', () => { ... });
});

describe('Project Manager RBAC - Project Portal', () => {
  describe('Task Creation (Managed Projects)', () => { ... });
  describe('Task Modification (Critical vs Uncritical)', () => { ... });
  describe('Project Access & Reading', () => { ... });
  describe('Project Group Management', () => { ... });
  describe('Ticket Operations', () => { ... });
  describe('Employee Demotion Boundary', () => { ... });
});
```

---

## Key Behavioral Distinctions

| Action | Team Member | Project Manager | Project Administrator |
|--------|-------------|-----------------|----------------------|
| Create projects | ❌ Blocked | ❌ Blocked | ✅ Allowed |
| Create tasks | ❌ Blocked | ✅ In managed projects only | ✅ In any project |
| Edit critical fields | ❌ Blocked | ✅ On own/managed tasks | ✅ On any task |
| Edit uncritical fields | ✅ On own tasks | ✅ On any task | ✅ On any task |
| Delete tasks | ❌ Blocked | ✅ In managed projects | ✅ Any task |
| Create project groups | ❌ Blocked | ✅ | ✅ |
| Delete project groups | ❌ Blocked | ✅ (own/managed) | ✅ Any group |
| Assign tickets | N/A | ❌ Blocked | ✅ Allowed |
| Manage ticket status | N/A | ❌/✅ limited | ✅ Allowed |
| Read all projects | ✅ | ✅ | ✅ |