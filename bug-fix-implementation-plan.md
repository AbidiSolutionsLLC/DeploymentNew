# BUG FIX IMPLEMENTATION PLAN
# Leave Tracker + Home Page | ABIDI Pro
# Stack: MERN — MongoDB · Express.js · React 19 · Node.js

> This plan is derived from QA test results in `Leave_Tracker_1.xlsx` and `home_page.xlsx`.
> Each ticket maps to a `Fail` test case and contains everything needed to fix it.
> Complete and test EVERY ticket before moving to the next one.

---

## HOW TO USE WITH CURSOR

For each ticket, paste this prompt into Cursor:

```
Read COMPREHENSIVE_DOCUMENTATION_1.md, project-map_1.md, and .ai-standards.md.
Implement [TICKET-ID]: [TICKET TITLE].
Acceptance criteria: [paste the criteria below].
```

**One ticket at a time. Test before moving on.**

---

## BUG SUMMARY TABLE

| Ticket | Module | Test Case | Issue | Priority |
|--------|--------|-----------|-------|----------|
| BF-001 | Leave Tracker | TC__24 | No edit option for pending leave requests | High |
| BF-002 | Leave Tracker | TC__25 | No extension option for pending sick leave | Medium |
| BF-003 | Leave Tracker | TC__36 | End date < start date: selection prevented but no validation error shown | High |
| BF-004 | Leave Tracker | TC__38 | Weekends counted in leave duration calculation | High |
| BF-005 | Leave Tracker | TC__56 | No validation for overlapping leave dates | High |
| BF-006 | Leave Tracker | TC__58 | Submit button shows no loading/spinner state | Medium |
| BF-007 | Leave Tracker | TC__59 | No confirmation dialog when cancelling filled form | Low |
| BF-008 | Leave Tracker | TC__65 | Applied date shows invalid/incorrect date after submission | High |
| BF-009 | TO-DO | TC__16 | No empty state validation message on empty fields | Medium |
| BF-010 | TO-DO | TC__20 | No validation when task name is empty | High |
| BF-011 | TO-DO | TC__22 | Long task name (500 chars) only shows one line in list view | Low |
| BF-012 | TO-DO | TC__23 | No edit view for long task names | Medium |
| BF-013 | TO-DO | TC__26 | No overdue indication for past dates | Low |
| BF-014 | TO-DO | TC__28 | No validation when date field is empty on save | High |
| BF-015 | TO-DO | TC__29 | No validation when all fields are empty on save | High |
| BF-016 | TO-DO | TC__33 | Tasks not ordered by due date | Medium |
| BF-017 | TO-DO | TC__38 | Edit mode: no cancel/save buttons, no date field | High |
| BF-018 | TO-DO | TC__39 | Edit mode: no date modification option | High |
| BF-019 | TO-DO | TC__40 | Edit mode: no cancel button | High |
| BF-020 | TO-DO | TC__41 | Edit mode: no save button | High |
| BF-021 | TO-DO | TC__42 | Edit mode: allows saving with empty task name | High |
| BF-022 | TO-DO | TC__45 | No undo after task delete | Low |
| BF-023 | TO-DO | TC__46 | No delete confirmation dialog | Medium |
| BF-024 | TO-DO | TC__51 | Tasks lost on page refresh (no persistence) | High |
| BF-025 | TO-DO | TC__53 | Tasks lost on browser close (no persistence) | High |
| BF-026 | TO-DO | TC__53 | Save with spaces-only task name passes validation | High |
| BF-027 | TO-DO | TC__56 | Enter key on Save button does nothing | Low |
| BF-028 | Home Page | TC__73 | Clicking team member name does nothing | Low |

---

## SPRINT 1 — HIGH PRIORITY BUG FIXES

---

### BF-001 — Edit Option for Pending Leave Requests
**Module:** Leave Tracker → Applied Leaves Table
**Test Case:** TC__24
**Priority:** High

**Problem:**
There is no edit option available for pending leave requests in the Applied Leaves table. Users cannot modify a submitted leave request.

**Files to Modify:**
- `frontend/src/Components/ViewLeaveModal.jsx` — add edit mode
- `frontend/src/Components/HistoryViewLeaveModal.jsx` — check if edit should go here
- `backend/controllers/leaveRequest.js` — verify update endpoint exists
- `backend/routes/allRoutes.js` — confirm `PUT /api/leaves/:id` is mounted

**Implementation Steps:**

1. **Add edit icon to Applied Leaves table row** — only show for `PENDING` status rows:
```jsx
{leave.status === 'PENDING' && (
  <IconButton onClick={() => handleEditLeave(leave._id)}>
    <EditIcon fontSize="small" />
  </IconButton>
)}
```

2. **Build edit modal or expand existing ViewLeaveModal** to support an edit mode:
```jsx
const [editMode, setEditMode] = useState(false);
// Pre-populate form fields with existing leave data
// Allow changing: leaveType, startDate, endDate, reason
// On save: call PUT /api/leaves/:id
```

3. **Backend** — confirm `updateLeave` controller validates:
   - Leave must be in `PENDING` status to be editable
   - Date validation same as create
   - Overlap validation same as create

**Acceptance Criteria:**
- [ ] Edit icon appears on PENDING leave rows only
- [ ] Edit modal opens with pre-filled data
- [ ] User can change leave type, dates, and reason
- [ ] Saving calls `PUT /api/leaves/:id` and updates the record
- [ ] APPROVED and REJECTED rows have no edit icon
- [ ] Success toast shown on successful update

---

### BF-002 — Extension Option for Pending Sick Leave
**Module:** Leave Tracker → Applied Leaves Table
**Test Case:** TC__25
**Priority:** Medium

**Problem:**
No extension button is available for pending sick leave requests.

**Files to Modify:**
- `frontend/src/Components/ViewLeaveModal.jsx` or `HistoryViewLeaveModal.jsx`
- `backend/controllers/leaveRequest.js` — add extend logic
- `backend/routes/allRoutes.js` — add `PATCH /api/leaves/:id/extend`

**Implementation Steps:**

1. **Add "Extend" button** in the leave row actions — show only when `status === 'PENDING'` and `leaveType === 'Sick'`:
```jsx
{leave.status === 'PENDING' && leave.leaveType === 'Sick' && (
  <Button variant="outlined" size="small" onClick={() => handleExtend(leave._id)}>
    Extend
  </Button>
)}
```

2. **Build ExtendLeaveModal** with single input: new end date (must be after current end date)

3. **Backend** — add endpoint:
```javascript
// PATCH /api/leaves/:id/extend
exports.extendLeave = catchAsync(async (req, res) => {
  const { newEndDate } = req.body;
  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) throw new NotFoundError('Leave not found');
  if (leave.status !== 'PENDING') throw new BadRequestError('Only pending leaves can be extended');
  if (leave.leaveType !== 'Sick') throw new BadRequestError('Only sick leaves can be extended');
  // validate newEndDate > leave.endDate
  leave.endDate = newEndDate;
  await leave.save();
  res.status(200).json({ status: 'success', message: 'Leave extended successfully', data: leave });
});
```

**Acceptance Criteria:**
- [ ] Extend button visible only on PENDING Sick leave rows
- [ ] ExtendLeaveModal opens with new end date input
- [ ] New end date must be after current end date (validated frontend + backend)
- [ ] On success, leave record updates and table refreshes
- [ ] Success toast shown

---

### BF-003 — End Date Validation Error Not Shown
**Module:** Leave Tracker → Apply Form
**Test Case:** TC__36
**Priority:** High

**Problem:**
When user selects an end date before the start date, the calendar prevents selection but shows no validation error message to the user.

**File to Modify:**
- `frontend/src/Components/LeaveModal.jsx` (or wherever the apply form lives)

**Implementation Steps:**

Add explicit validation trigger and error display when end date < start date:

```jsx
const handleEndDateChange = (date) => {
  if (startDate && date < startDate) {
    setEndDateError('End date must be after start date');
    return;
  }
  setEndDateError('');
  setEndDate(date);
};

// In JSX, below the end date picker:
{endDateError && (
  <p className="text-red-500 text-xs mt-1">{endDateError}</p>
)}
```

Also fire validation on form submit even if not triggered inline.

**Acceptance Criteria:**
- [ ] Selecting end date before start date shows `"End date must be after start date"` inline
- [ ] Error clears when a valid end date is selected
- [ ] Submit is blocked if this error is present

---

### BF-004 — Weekends Counted in Leave Duration
**Module:** Leave Tracker → Apply Form
**Test Case:** TC__38
**Priority:** High

**Problem:**
Leave duration calculation includes Saturday and Sunday. Duration should count working days only.

**Files to Modify:**
- `frontend/src/Components/LeaveModal.jsx` — fix client-side duration display
- `backend/controllers/leaveRequest.js` — fix server-side duration calculation on save

**Implementation Steps:**

Replace the current simple date-diff with a working-days counter:

```javascript
// utils/dateUtils.js — add or update this function
const calculateWorkingDays = (startDate, endDate) => {
  let count = 0;
  let current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++; // skip Sunday (0) and Saturday (6)
    current.setDate(current.getDate() + 1);
  }
  return count;
};
```

Use `calculateWorkingDays` everywhere duration is computed — form preview, on save, in leave balance deduction.

**Acceptance Criteria:**
- [ ] Friday → Monday shows duration of 2 (not 4)
- [ ] Duration preview in apply form updates correctly
- [ ] Saved duration in database is working days only
- [ ] Leave balance deducted correctly (working days only)

---

### BF-005 — No Overlap Validation for Leave Dates
**Module:** Leave Tracker → Apply Form
**Test Case:** TC__56
**Priority:** High

**Problem:**
User can apply for leave on dates that already have an existing approved/pending application. No validation error is shown.

**Files to Modify:**
- `backend/controllers/leaveRequest.js` — add overlap check before saving
- `frontend/src/Components/LeaveModal.jsx` — display the error returned by backend

**Implementation Steps:**

In `createLeave` controller, before saving:
```javascript
// Check for overlapping leaves
const overlapping = await LeaveRequest.findOne({
  userId: req.user._id,
  status: { $in: ['PENDING', 'APPROVED'] },
  $or: [
    { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
  ]
});

if (overlapping) {
  throw new BadRequestError('Leave dates overlap with an existing application');
}
```

Frontend: the existing error toast pattern should display this message automatically via the axios error interceptor.

**Acceptance Criteria:**
- [ ] Applying on already-applied dates returns `400` with message
- [ ] Frontend shows toast: `"Leave dates overlap with an existing application"`
- [ ] Non-overlapping dates still submit successfully
- [ ] Checks against PENDING and APPROVED leaves only (REJECTED ignored)

---

### BF-008 — Applied Date Shows Invalid Date After Submission
**Module:** Leave Tracker → Applied Leaves Table
**Test Case:** TC__65
**Priority:** High

**Problem:**
After submitting a leave request, the "Applied Date" column shows an invalid or wrong date instead of the actual submission date.

**Files to Modify:**
- `backend/controllers/leaveRequest.js` — ensure `appliedDate` or `createdAt` is set correctly
- `frontend/src/Components/HistoryViewLeaveModal.jsx` or leave table component — fix date rendering

**Implementation Steps:**

1. **Backend** — confirm the schema has `appliedDate` or rely on Mongoose `timestamps: true`. If not set:
```javascript
// In leaveRequestSchema.js
{
  timestamps: true // adds createdAt + updatedAt automatically
}
```

2. **Frontend** — fix date display. A common cause is passing raw MongoDB date string directly:
```jsx
// Wrong
<td>{leave.appliedDate}</td>

// Correct
<td>{new Date(leave.createdAt).toLocaleDateString('en-US')}</td>
```

3. Make sure the field being rendered actually maps to the correct schema field (`createdAt` or `appliedDate`).

**Acceptance Criteria:**
- [ ] Applied date column shows date in MM/DD/YYYY format
- [ ] Date matches the actual date the leave was submitted
- [ ] No "Invalid Date" text visible anywhere in the table

---

### BF-009 / BF-015 — No Validation on Empty Form Save (TO-DO)
**Module:** TO-DO
**Test Cases:** TC__16, TC__29
**Priority:** High

**Problem:**
Clicking Save with all fields empty (or just empty task name) shows no validation error. Empty state message is also not shown when list is empty.

**File to Modify:**
- `frontend/src/Components/` — whichever component renders the TO-DO form (likely `TodoList.jsx` or inline in a page)

**Implementation Steps:**

1. **Add form validation before save**:
```jsx
const handleSave = () => {
  if (!taskName || taskName.trim() === '') {
    setTaskNameError('Task name is required');
    return;
  }
  if (!taskDate) {
    setTaskDateError('Date is required');
    return;
  }
  // proceed to save
};
```

2. **Show errors inline below each field**:
```jsx
{taskNameError && <p className="text-red-500 text-xs mt-1">{taskNameError}</p>}
{taskDateError && <p className="text-red-500 text-xs mt-1">{taskDateError}</p>}
```

3. **Empty state message** — ensure it renders when task list is empty:
```jsx
{tasks.length === 0 && (
  <p className="text-gray-400 text-center py-6">You haven't added anything yet</p>
)}
```

**Acceptance Criteria:**
- [ ] Save with empty task name shows `"Task name is required"`
- [ ] Save with empty date shows `"Date is required"`
- [ ] Save with all fields empty shows both errors
- [ ] Empty state `"You haven't added anything yet"` visible when no tasks exist
- [ ] Errors clear when user types into the field

---

### BF-014 / BF-026 — Task Name: Empty Date & Spaces-Only Validation
**Module:** TO-DO
**Test Cases:** TC__28, TC__53
**Priority:** High

**Problem:**
- Saving with empty date field shows no validation error.
- Saving with spaces-only task name passes validation.

**File to Modify:** TO-DO form component

**Implementation Steps:**

Extend validation in `handleSave`:
```jsx
const taskNameTrimmed = taskName.trim();
if (!taskNameTrimmed) {
  setTaskNameError('Task name cannot be empty or spaces only');
  return;
}
```

For date: already covered in BF-009. Ensure date field emptiness is checked separately.

**Acceptance Criteria:**
- [ ] `"   "` (spaces only) in task name fails validation
- [ ] Empty date field fails validation
- [ ] Only `.trim()` is used, not `!taskName` alone

---

### BF-017 / BF-018 / BF-019 / BF-020 — Edit Mode Missing Controls
**Module:** TO-DO
**Test Cases:** TC__38, TC__39, TC__40, TC__41
**Priority:** High

**Problem:**
When clicking an existing task to edit it, there are no Save or Cancel buttons, and no date field is available for modification.

**File to Modify:** TO-DO component (task edit inline or modal)

**Implementation Steps:**

Implement a proper edit mode for tasks. Pattern to follow: `AddHolidayModal.jsx` or `CreateDepartmentModal.jsx`.

```jsx
// When a task is clicked, set editingTask state
const [editingTask, setEditingTask] = useState(null);

const handleTaskClick = (task) => {
  setEditingTask({ ...task }); // clone to avoid mutating original
  setTaskName(task.name);
  setTaskDescription(task.description);
  setTaskDate(task.date);
};

const handleEditSave = async () => {
  if (!taskName.trim()) {
    setTaskNameError('Task name is required');
    return;
  }
  // call PUT /api/todos/:id or update in state
  // clear editingTask on success
};

const handleEditCancel = () => {
  setEditingTask(null);
  setTaskName('');
  setTaskDescription('');
  setTaskDate('');
};
```

Render Save and Cancel buttons when `editingTask !== null`:
```jsx
<Button onClick={handleEditSave}>Save</Button>
<Button onClick={handleEditCancel}>Cancel</Button>
```

Include the date input field in both add and edit modes.

**Acceptance Criteria:**
- [ ] Clicking a task populates all fields including date
- [ ] Save button visible and functional in edit mode
- [ ] Cancel button visible and discards all changes
- [ ] Date field is editable in edit mode
- [ ] Edit mode uses same validation as add mode

---

### BF-021 — Edit: Saving With Empty Task Name
**Module:** TO-DO
**Test Case:** TC__42
**Priority:** High

**Problem:**
In edit mode, clearing the task name and saving does not show a validation error — the empty name is saved.

**File to Modify:** TO-DO component

This is fixed as part of BF-017 — the same `handleSave` validation applies to edit mode. Confirm the `handleEditSave` function includes the `.trim()` check.

**Acceptance Criteria:**
- [ ] Clearing task name in edit mode and saving shows `"Task name is required"`
- [ ] Original task data unchanged if validation fails

---

### BF-024 / BF-025 — Tasks Lost on Refresh and Browser Close
**Module:** TO-DO
**Test Cases:** TC__51, TC__52
**Priority:** High

**Problem:**
All TO-DO tasks disappear when the page is refreshed or the browser is closed. Tasks are not persisted.

**Investigation First:**
Check if TO-DO tasks are saved to the backend or only held in component state. If only in state, there are two fix paths:

**Option A — Backend Persistence (Recommended):**
- Tasks already stored in DB but not fetched on mount. Fix: add `useEffect` with fetch call on component mount.
```jsx
useEffect(() => {
  const fetchTodos = async () => {
    try {
      const res = await api.get('/todos');
      setTasks(res.data.data);
    } catch (err) {
      toast.error('Failed to load tasks');
    }
  };
  fetchTodos();
}, []);
```

**Option B — localStorage (Quick Fix if no backend):**
```jsx
useEffect(() => {
  const saved = localStorage.getItem('todos');
  if (saved) setTasks(JSON.parse(saved));
}, []);

useEffect(() => {
  localStorage.setItem('todos', JSON.stringify(tasks));
}, [tasks]);
```

**Note:** Prefer Option A to be consistent with the project's backend-first architecture.

**Acceptance Criteria:**
- [ ] Tasks remain after page refresh
- [ ] Tasks remain after browser close and reopen
- [ ] Tasks are user-specific (not shared across accounts)

---

## SPRINT 2 — MEDIUM PRIORITY BUG FIXES

---

### BF-006 — Submit Button Has No Loading State
**Module:** Leave Tracker → Apply Form
**Test Case:** TC__58
**Priority:** Medium

**Problem:**
Clicking Submit shows no visual feedback (spinner or "Submitting..." text).

**File to Modify:** Leave apply form component

**Implementation Steps:**

Follow the existing pattern used across the project:
```jsx
const [submitting, setSubmitting] = useState(false);

const handleSubmit = async () => {
  setSubmitting(true);
  try {
    await api.post('/leaves', payload);
    toast.success('Leave request submitted successfully');
  } catch (err) {
    toast.error(err.response?.data?.message || 'Error submitting leave');
  } finally {
    setSubmitting(false);
  }
};

// Button:
<Button disabled={submitting} onClick={handleSubmit}>
  {submitting ? 'Submitting...' : 'Submit Request'}
</Button>
```

**Acceptance Criteria:**
- [ ] Button shows `"Submitting..."` while API call is in progress
- [ ] Button is disabled during submission (prevents double submit)
- [ ] Button returns to `"Submit Request"` on success or failure

---

### BF-007 — No Confirmation on Cancel With Filled Form
**Module:** Leave Tracker → Apply Form
**Test Case:** TC__59
**Priority:** Low

**Problem:**
Clicking Cancel when the form has data shows no confirmation dialog.

**File to Modify:** Leave apply form component

**Implementation Steps:**

```jsx
const handleCancel = () => {
  const hasData = leaveType || startDate || endDate || reason;
  if (hasData) {
    const confirmed = window.confirm('Are you sure? Unsaved changes will be lost.');
    if (!confirmed) return;
  }
  resetForm();
};
```

Or use MUI Dialog for a more polished confirmation:
```jsx
<Dialog open={showCancelConfirm}>
  <DialogContent>Are you sure? Unsaved changes will be lost.</DialogContent>
  <DialogActions>
    <Button onClick={() => setShowCancelConfirm(false)}>Stay</Button>
    <Button onClick={resetForm} color="error">Discard</Button>
  </DialogActions>
</Dialog>
```

**Acceptance Criteria:**
- [ ] Cancel with any filled field shows confirmation dialog
- [ ] "Stay" button keeps form data intact
- [ ] "Discard" button clears form and closes
- [ ] Cancel with empty form closes without confirmation

---

### BF-010 — No Validation: Task Name Empty
**Module:** TO-DO
**Test Case:** TC__20
**Priority:** High (covered in BF-009 — implement together)

See BF-009 for implementation. This is the same fix.

---

### BF-011 / BF-012 — Long Task Name Shows Only One Line
**Module:** TO-DO
**Test Cases:** TC__22, TC__23
**Priority:** Low

**Problem:**
A 500-character task name shows as a single cropped line in list view. No edit view exists to show the full text.

**File to Modify:** TO-DO task list render

**Implementation Steps:**

```jsx
// List view: allow 2 lines, then truncate with ellipsis
<p className="line-clamp-2 text-sm">{task.name}</p>

// Edit view: use <textarea> or multiline TextField so full text is visible
<textarea
  value={taskName}
  onChange={(e) => setTaskName(e.target.value)}
  rows={3}
  className="w-full border rounded p-2 text-sm"
/>
```

`line-clamp-2` requires `@tailwindcss/line-clamp` or Tailwind v3.3+. Verify it's available.

**Acceptance Criteria:**
- [ ] List view shows max 2 lines of task name, truncates with `...`
- [ ] Edit view shows full task name in a multi-line input
- [ ] No overflow outside the task card

---

### BF-013 — Past Dates: No Overdue Indication
**Module:** TO-DO
**Test Case:** TC__26
**Priority:** Low

**Problem:**
Tasks added with past dates are accepted but not flagged as overdue.

**File to Modify:** TO-DO task card component

**Implementation Steps:**

```jsx
const isOverdue = new Date(task.date) < new Date();

<div className={`border rounded p-3 ${isOverdue ? 'border-red-400 bg-red-50' : ''}`}>
  {isOverdue && <span className="text-xs text-red-500 font-medium">OVERDUE</span>}
  {/* ... rest of task card */}
</div>
```

**Note:** Past date entry itself can remain allowed. This is a display enhancement only.

**Acceptance Criteria:**
- [ ] Tasks with dates in the past show an `"OVERDUE"` badge
- [ ] Non-overdue tasks unaffected

---

### BF-016 — Tasks Not Ordered by Due Date
**Module:** TO-DO
**Test Case:** TC__33
**Priority:** Medium

**Problem:**
Tasks are not displayed in due date order.

**File to Modify:** TO-DO component

**Implementation Steps:**

Sort tasks before rendering:
```jsx
const sortedTasks = [...tasks].sort(
  (a, b) => new Date(a.date) - new Date(b.date)
);

// Render sortedTasks instead of tasks
```

If tasks come from backend, add a sort to the fetch or pass `?sort=date` query param.

**Acceptance Criteria:**
- [ ] Tasks displayed in ascending due date order (nearest date first)
- [ ] New tasks appear in correct position after add
- [ ] Order updates after editing a task's date

---

### BF-022 / BF-023 — No Undo and No Delete Confirmation
**Module:** TO-DO
**Test Cases:** TC__45, TC__46, TC__47
**Priority:** Medium / Low

**Problem:**
- Deleting a task happens immediately with no confirmation.
- No undo feature exists.

**File to Modify:** TO-DO component

**Implementation Steps:**

**Delete Confirmation (Medium Priority):**
```jsx
const handleDelete = (taskId) => {
  const confirmed = window.confirm('Delete this task?');
  if (confirmed) {
    // proceed with delete
  }
};
```

**Undo (Low Priority — Optional):**
Implement a 3-second soft delete with toast undo button:
```jsx
const handleDelete = (taskId) => {
  const taskToDelete = tasks.find(t => t._id === taskId);
  setTasks(prev => prev.filter(t => t._id !== taskId));

  const toastId = toast.info('Task deleted', {
    action: {
      label: 'Undo',
      onClick: () => setTasks(prev => [...prev, taskToDelete])
    },
    duration: 3000
  });
  // Only call DELETE API after 3 seconds if not undone
  setTimeout(() => {
    api.delete(`/todos/${taskId}`);
  }, 3000);
};
```

**Acceptance Criteria (Confirmation):**
- [ ] Delete shows confirmation `"Delete this task?"`
- [ ] Confirm deletes the task
- [ ] Cancel keeps the task

**Acceptance Criteria (Undo — if implemented):**
- [ ] Toast with Undo button appears for 3 seconds
- [ ] Clicking Undo restores the task
- [ ] If not undone, task is deleted from DB after timeout

---

### BF-027 — Enter Key on Save Button Does Nothing
**Module:** TO-DO
**Test Case:** TC__56
**Priority:** Low

**Problem:**
Pressing Enter while focused on the Save button does not trigger save.

**File to Modify:** TO-DO form component

**Implementation Steps:**

Wrap the form in a `<form>` element or handle `onKeyDown`:
```jsx
const handleKeyDown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSave();
  }
};

<div onKeyDown={handleKeyDown}>
  {/* form fields */}
</div>
```

Or if using a `<button type="submit">` inside a `<form>` tag, Enter works automatically.

**Acceptance Criteria:**
- [ ] Pressing Enter while Save is focused triggers save
- [ ] Same validation runs as clicking Save

---

### BF-028 — Clicking Team Member Name Does Nothing
**Module:** Home Page → Team Overview
**Test Case:** TC__73
**Priority:** Low

**Problem:**
Clicking a team member name in the Team Overview widget does nothing.

**File to Modify:** Home page component or Team Overview widget component

**Investigation First:**
Check what user data is available in the team list. If user IDs are present, navigate to profile:

```jsx
// If routing to a user profile page exists
<span
  className="cursor-pointer text-blue-600 hover:underline"
  onClick={() => navigate(`/people/${member._id}`)}
>
  {member.name}
</span>
```

If no profile page route exists, show a tooltip/modal with basic info:
```jsx
<Tooltip title={`${member.role} — ${member.email}`}>
  <span className="cursor-pointer">{member.name}</span>
</Tooltip>
```

**Acceptance Criteria:**
- [ ] Clicking a team member name either navigates to their profile OR opens a tooltip/popup with their info
- [ ] Cursor changes to `pointer` on hover
- [ ] No console errors on click

---

## SPRINT 3 — LOW PRIORITY / ENHANCEMENT FIXES

| Ticket | Module | Fix | Notes |
|--------|--------|-----|-------|
| BF-013 | TO-DO | Add overdue badge for past-dated tasks | Visual only |
| BF-022 | TO-DO | Undo delete via toast button | Optional enhancement |
| BF-027 | TO-DO | Enter key on Save button | UX polish |
| BF-028 | Home Page | Team member click → profile/tooltip | Requires profile page or tooltip |

---

## SHARED IMPLEMENTATION CHECKLIST

### Before Starting Any Ticket
```
- [ ] Read the relevant existing component first (understand current code)
- [ ] Check project-map_1.md for correct file locations
- [ ] Never create a new axios instance — import from frontend/src/axios.js
- [ ] Use catchAsync in all backend controller methods
- [ ] Throw BadRequestError/NotFoundError (never generic Error)
- [ ] Use toast.error() / toast.success() for all frontend feedback
```

### For Every Frontend Bug Fix
```
- [ ] Add loading state if the fix involves an API call
- [ ] Add error toast on failure
- [ ] Add success toast on success
- [ ] Validate inputs with .trim() not just truthiness check
- [ ] Test on mobile (sm breakpoint)
- [ ] No console errors after fix
```

### For Every Backend Bug Fix
```
- [ ] Wrap in catchAsync
- [ ] Use Joi validation or inline check with BadRequestError
- [ ] Add auth middleware if route is new
- [ ] Test with Postman/Insomnia before marking done
- [ ] Check response format: { status, message, data }
```

---

## COMPLETION CHECKLIST

Mark this bug fix sprint as complete only when ALL items are checked.

```
Leave Tracker:
- [ ] BF-001: Edit option for pending leaves
- [ ] BF-002: Extend option for sick leaves
- [ ] BF-003: Validation error for end < start date
- [ ] BF-004: Weekends excluded from duration
- [ ] BF-005: Overlap validation
- [ ] BF-006: Submit button loading state
- [ ] BF-007: Cancel confirmation dialog
- [ ] BF-008: Applied date shows correct value

TO-DO:
- [ ] BF-009/BF-015: Empty form validation
- [ ] BF-014/BF-026: Spaces-only and empty date validation
- [ ] BF-017–BF-021: Full edit mode (cancel, save, date field, name validation)
- [ ] BF-024/BF-025: Task persistence on refresh/close
- [ ] BF-016: Tasks ordered by due date
- [ ] BF-023: Delete confirmation dialog
- [ ] BF-011/BF-012: Long name display (line-clamp + edit textarea)

Home Page:
- [ ] BF-028: Team member click action

Optional/Low:
- [ ] BF-013: Overdue indication for past dates
- [ ] BF-022: Undo delete
- [ ] BF-027: Enter key on Save
```

---

## SESSION HISTORY

| Date | Tickets | Status | Notes |
|------|---------|--------|-------|
| 2026-04-09 | Plan created | Ready | Covers all FAIL test cases from Leave_Tracker_1.xlsx + home_page.xlsx |

---

*Last Updated: 2026-04-09*
*Source: QA Test Files — Leave_Tracker_1.xlsx, home_page.xlsx*
*Excluded: Hammad and Tayyab assignments (see admin-implementation-plan.md)*
