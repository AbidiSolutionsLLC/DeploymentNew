# BUG FIX IMPLEMENTATION PLAN
# Raise a Ticket + Time Tracker — Failed Test Cases
# Stack: MERN — MongoDB · Express.js · React · Node.js
# Based on: RAISE_A_TICKET.xlsx + Time_Tracker.xlsx QA Reports

> Complete and test EVERY ticket before moving to the next one.
> Workflow: Read this plan → open the relevant component/controller → implement → test in browser/Postman → mark done.

---

## FAILED TEST CASE SUMMARY

### Raise a Ticket — Failed Cases (18 total)

| TC ID | Feature | Failure Description |
|---|---|---|
| TC__002 | Subject | 1-char input → wrong error message (shows "required" or "3 chars" instead of "5 chars") |
| TC__003 | Subject | 2-char input → wrong error message |
| TC__004 | Subject | 3-char input → wrong error message |
| TC__005 | Subject | 4-char input → wrong error message |
| TC__008 | Subject | Numbers-only input is accepted — should be rejected |
| TC__017 | Subject | Emojis show "special chars not allowed" — should show "emojis not allowed" |
| TC__035 | Description | 3 words < 10 chars → only one validation shows instead of both |
| TC__039 | Description | Emojis show generic "special chars not allowed" — should show "emojis not allowed" |
| TC__048 | Attachment | `.bmp` file type rejected — should be accepted |
| TC__049 | Attachment | `.mp4` file type rejected — should be accepted |
| TC__050 | Attachment | `.mp3` file type rejected — should be accepted |
| TC__057 | Attachment | 25 MB file — cannot submit (no error shown, just blocks submit) |
| TC__058 | Attachment | 50 MB file — cannot submit (same) |
| TC__059 | Attachment | 100 MB file — cannot submit (same) |
| TC__061 | Attachment | Multiple files (2) — only one attaches |
| TC__062 | Attachment | Multiple files (5) — only one attaches |
| TC__063 | Attachment | Duplicate file detection missing (depends on TC__061/062 fix) |
| TC__069 | Attachment | Cancel file selection has no cancel option |
| TC__083 | Cancel | No confirmation dialog when cancelling with unsaved data |
| TC__084 | Cancel | No confirmation "Leave" action exists |
| TC__085 | Cancel | No "Stay on page" action exists |
| TC__086 | Cancel | No confirmation when cancelling with attachment only |
| TC__102 | Search | No clear/X button to reset search |

### Time Tracker — Failed Cases (9 total)

| TC ID | Feature | Failure Description |
|---|---|---|
| TC_011 | Time Logs | Invalid hours (-5 or text) — save button disabled without showing a validation message |
| TC_039 | Time Logs | Multiple file attachment not supported — only single file accepted |
| TC_040 | Time Logs | Uploading a second file replaces the first — should accumulate |
| TC_046 | Time Logs | Logs beyond 5th entry not displayed |
| TC_048 | Time Logs | No cancel option for delete action |
| TC_063 | Timesheets | Empty timesheet name — no validation message shown |
| TC_065 | Timesheets | Invalid names (e.g., `@@@__324`, numbers-only) accepted — should be rejected |
| TC_070 | Timesheets | Multiple file attachment not supported (same bug as TC_039) |
| TC_071 | Timesheets | Second file replaces first (same bug as TC_040) |
| TC_074 | Timesheets | Empty form submission — no validation messages appear |
| TC_078 | Timesheets | No delete option for created timesheet |
| TC_079 | Timesheets | No edit option for created timesheet |

---

## DEVELOPER ASSIGNMENTS

All tickets are assigned to a single developer (no split).

| Ticket | Module | Type | Priority |
|---|---|---|---|
| BF-001 | Subject Validation | Frontend | High |
| BF-002 | Attachment — File Types | Frontend + Backend | High |
| BF-003 | Attachment — File Size Error | Frontend + Backend | High |
| BF-004 | Attachment — Multiple Files | Frontend + Backend | High |
| BF-005 | Attachment — Cancel Selection | Frontend | Medium |
| BF-006 | Cancel Form — Confirmation Dialog | Frontend | Medium |
| BF-007 | Search — Clear/Reset Button | Frontend | Low |
| BF-008 | Time Log — Invalid Hours Validation | Frontend | High |
| BF-009 | Time Log — Multiple Attachments | Frontend + Backend | High |
| BF-010 | Time Log — Pagination Beyond 5 Entries | Frontend | High |
| BF-011 | Time Log — Cancel Delete | Frontend | Medium |
| BF-012 | Timesheet — Name Validation | Frontend | High |
| BF-013 | Timesheet — Empty Form Validation | Frontend | High |
| BF-014 | Timesheet — Delete & Edit Options | Frontend + Backend | High |

---

## HOW TO USE WITH CURSOR

For each ticket, paste this into Cursor:

```
Read COMPREHENSIVE_DOCUMENTATION.md and _project-map.md.
Implement [TICKET-ID]: [TICKET TITLE].
Acceptance criteria: [paste the criteria below].
```

One ticket at a time. Test before moving on.

---

## BF-001 — Subject Field Validation Fixes

**Covers:** TC__002, TC__003, TC__004, TC__005, TC__008, TC__017

**Files to modify:**
- Frontend validation logic inside the Raise a Ticket component (likely `frontend/src/Components/` or a page under `frontend/src/Pages/`)
- Joi schema if backend validates subject: `backend/JoiSchema/` (check for a ticket Joi schema)

**Current bugs:**
1. Min-length validation error shows wrong message: says "required" or "3 chars" instead of "5 chars minimum"
2. Numbers-only input is accepted — should be rejected with "Numbers are not allowed"
3. Emojis display the same error as special characters — need a distinct "Emojis are not allowed" message

**Fix — Frontend validation rules for Subject:**
```javascript
// Apply ALL of these checks in order:

const validateSubject = (value) => {
  const trimmed = value.trim();

  if (!trimmed) return "Subject is required";
  if (/^\s+$/.test(value)) return "Subject is required";

  // Check emojis BEFORE special chars (emoji regex is more specific)
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
  if (emojiRegex.test(trimmed)) return "Emojis are not allowed";

  if (/[^a-zA-Z0-9\s.,!?'"-]/.test(trimmed)) return "Special characters are not allowed";
  if (/^\d+$/.test(trimmed)) return "Numbers are not allowed";

  if (trimmed.length < 5) return "Subject must be at least 5 characters";
  if (trimmed.length > 100) return "Subject cannot exceed 100 characters";

  return null; // valid
};
```

**Fix — Backend Joi schema** (in `backend/JoiSchema/ticketJoiSchema.js` — create if doesn't exist):
```javascript
const Joi = require("joi");

const ticketSchema = Joi.object({
  subject: Joi.string()
    .trim()
    .min(5)
    .max(100)
    .pattern(/^[a-zA-Z\s.,!?'"-]+$/, "valid characters") // no numbers, no emojis
    .required()
    .messages({
      "string.empty": "Subject is required",
      "string.min": "Subject must be at least 5 characters",
      "string.max": "Subject cannot exceed 100 characters",
      "string.pattern.name": "Subject can only contain letters and basic punctuation",
      "any.required": "Subject is required",
    }),
  // ... description below
});
```

**Acceptance criteria:**
- [ ] 1–4 character input → "Subject must be at least 5 characters" (exact wording)
- [ ] Numbers-only input → "Numbers are not allowed"
- [ ] Emoji input (😊😊😊😊😊) → "Emojis are not allowed" (NOT "special chars not allowed")
- [ ] Mixed valid input passes
- [ ] Backend Joi validation rejects invalid subject with appropriate message

---

## BF-002 — Attachment — Accepted File Types

**Covers:** TC__048 (.bmp), TC__049 (.mp4), TC__050 (.mp3)

**Files to modify:**
- Frontend file input accept attribute — Raise a Ticket component
- Backend upload middleware: `backend/middlewares/uploadMiddleware.js`
- Backend multer config: `backend/utils/azureMulterStorage.js`

**Current bug:** `.bmp`, `.mp4`, `.mp3` are rejected but should be accepted per the test specification.

**Fix — Frontend (update the `accept` attribute on the file input):**
```jsx
// In the Raise a Ticket component
<input
  type="file"
  accept=".txt,.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.bmp,.mp4,.mp3,.csv"
  // ...
/>
```

**Fix — Backend upload middleware (update the fileFilter function):**
```javascript
// In backend/middlewares/uploadMiddleware.js or azureMulterStorage.js
const ALLOWED_MIME_TYPES = [
  "text/plain",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/bmp",        // ← ADD: .bmp
  "video/mp4",        // ← ADD: .mp4
  "audio/mpeg",       // ← ADD: .mp3
  "text/csv",
];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError(`File type ${file.mimetype} is not supported`), false);
  }
};
```

**Acceptance criteria:**
- [ ] `.bmp` file uploads successfully
- [ ] `.mp4` file uploads successfully
- [ ] `.mp3` file uploads successfully
- [ ] Unsupported types (e.g., `.exe`) still correctly rejected
- [ ] Frontend accept attribute updated to allow these types

---

## BF-003 — Attachment — File Size Error Feedback

**Covers:** TC__057 (25 MB), TC__058 (50 MB), TC__059 (100 MB)

**Files to modify:**
- Backend: `backend/middlewares/uploadMiddleware.js` (multer limits)
- Frontend: Raise a Ticket component (display error on file selection)

**Current bug:** Uploading large files (25 MB+) silently blocks the submit button with no feedback to the user.

**Fix — Backend (set explicit multer limit and throw descriptive error):**
```javascript
// In uploadMiddleware.js
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max — adjust to product requirement
  },
  fileFilter,
});

// In globalErrorHandler.js — handle multer errors:
if (err.code === "LIMIT_FILE_SIZE") {
  return res.status(400).json({
    status: "error",
    message: "File size exceeds the maximum limit of 10 MB",
  });
}
```

**Fix — Frontend (validate file size before upload, show clear error):**
```javascript
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > MAX_FILE_SIZE_BYTES) {
    toast.error(`File size exceeds ${MAX_FILE_SIZE_MB} MB limit`);
    e.target.value = ""; // clear the input
    return;
  }

  setSelectedFile(file);
};
```

**Acceptance criteria:**
- [ ] Uploading a 25 MB file shows a clear error: "File size exceeds X MB limit"
- [ ] Uploading a 50 MB file shows same error
- [ ] Uploading a 100 MB file shows same error
- [ ] Error is shown immediately on file selection, before submit
- [ ] Submit button remains functional when no oversized file is attached
- [ ] Files within the limit (e.g., 10 MB) upload and submit correctly

---

## BF-004 — Attachment — Multiple File Support

**Covers:** TC__061, TC__062, TC__063 (Raise a Ticket) | TC_039, TC_040 (Time Logs) | TC_070, TC_071 (Timesheets)

**Files to modify:**
- Frontend: Raise a Ticket component, `AdminAddTimeLogModal.jsx`, `AdminCreateTimesheetModal.jsx`
- Backend: `backend/middlewares/uploadMiddleware.js` (switch from `upload.single` to `upload.array`)
- Backend: `backend/controllers/ticketController.js`, `timeLogController.js`, `timesheetController.js`
- Backend: `backend/models/ticketManagementSchema.js`, `timeLogsSchema.js`, `timesheetSchema.js` (if attachments stored as single string → change to array)

**Current bug:** Only one file can be attached. Second selection replaces the first. No duplicate detection.

**Fix — Frontend (update file input to support multiple):**
```jsx
// In Raise a Ticket component, AddTimeLogModal, CreateTimesheetModal:
const [attachments, setAttachments] = useState([]);

const handleFileChange = (e) => {
  const newFiles = Array.from(e.target.files);

  // Filter oversized files
  const validFiles = newFiles.filter(f => {
    if (f.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`${f.name} exceeds file size limit`);
      return false;
    }
    return true;
  });

  // Detect duplicates
  const existingNames = attachments.map(f => f.name);
  const uniqueNew = validFiles.filter(f => {
    if (existingNames.includes(f.name)) {
      toast.warn(`${f.name} is already attached`);
      return false;
    }
    return true;
  });

  setAttachments(prev => [...prev, ...uniqueNew]);
};

const removeAttachment = (fileName) => {
  setAttachments(prev => prev.filter(f => f.name !== fileName));
};

// JSX:
<input
  type="file"
  multiple                          // ← KEY CHANGE
  accept="..."
  onChange={handleFileChange}
/>

{/* Display attached files */}
{attachments.map(file => (
  <div key={file.name} className="flex items-center gap-2">
    <span>{file.name}</span>
    <button onClick={() => removeAttachment(file.name)}>✕</button>
  </div>
))}
```

**Fix — Backend multer (switch to `upload.array`):**
```javascript
// In ticketController.js, timeLogController.js, timesheetController.js routes:
// Change from:
router.post("/ticket", upload.single("attachment"), ...)
// To:
router.post("/ticket", upload.array("attachments", 5), ...) // max 5 files
```

**Fix — Backend schema (store as array):**
```javascript
// In ticketManagementSchema.js (and equivalent for timelogs/timesheets):
attachments: [
  {
    url: String,
    originalName: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now },
  }
],
```

**Acceptance criteria:**
- [ ] User can select and attach 2 files simultaneously
- [ ] User can select and attach 5 files simultaneously
- [ ] Each attached file displayed with its name and a remove (✕) button
- [ ] Selecting the same file twice shows a "already attached" warning
- [ ] Second upload does not replace first — both persist
- [ ] All attached files are submitted and saved on the backend
- [ ] Same fix applies across Raise a Ticket, Time Log modal, and Timesheet modal

---

## BF-005 — Attachment — Cancel File Selection

**Covers:** TC__069

**Files to modify:**
- Frontend: Raise a Ticket component

**Current bug:** Once a file is selected, there is no way to cancel/remove it ("No file chosen" state cannot be restored).

**Fix:**
```jsx
// Add a clear button next to the file name display
{selectedFile && (
  <div className="flex items-center gap-2 mt-1">
    <span className="text-sm text-gray-600">{selectedFile.name}</span>
    <button
      type="button"
      onClick={() => {
        setSelectedFile(null);
        fileInputRef.current.value = ""; // reset the input
      }}
      className="text-red-500 hover:text-red-700 text-xs"
      aria-label="Remove file"
    >
      ✕ Remove
    </button>
  </div>
)}
```

**Acceptance criteria:**
- [ ] After selecting a file, a Remove/Cancel (✕) button appears
- [ ] Clicking it clears the file input and returns to "No file chosen" state
- [ ] File input resets so the same file can be re-selected

---

## BF-006 — Cancel Form — Unsaved Data Confirmation Dialog

**Covers:** TC__083, TC__084, TC__085, TC__086

**Files to modify:**
- Frontend: Raise a Ticket component/page

**Current bug:** Clicking Cancel with unsaved data (filled subject, description, or attachment) immediately navigates away with no confirmation. There is no "Changes will be lost. Continue?" dialog.

**Fix — Add dirty state tracking and confirmation modal:**
```jsx
const [isDirty, setIsDirty] = useState(false);
const [showCancelConfirm, setShowCancelConfirm] = useState(false);

// Mark form as dirty whenever user types or attaches a file
const handleSubjectChange = (e) => {
  setSubject(e.target.value);
  setIsDirty(true);
};
const handleDescriptionChange = (e) => {
  setDescription(e.target.value);
  setIsDirty(true);
};

// On Cancel button click:
const handleCancelClick = () => {
  if (isDirty) {
    setShowCancelConfirm(true); // show confirmation dialog
  } else {
    navigate("/my-tickets"); // no data → go directly
  }
};

// Confirmation dialog JSX:
{showCancelConfirm && (
  <div className="modal-overlay">
    <div className="modal">
      <p>Changes will be lost. Do you want to continue?</p>
      <button onClick={() => navigate("/my-tickets")}>Leave</button>
      <button onClick={() => setShowCancelConfirm(false)}>Stay</button>
    </div>
  </div>
)}
```

**Acceptance criteria:**
- [ ] Clicking Cancel with subject text filled → confirmation dialog appears
- [ ] Clicking Cancel with description filled → confirmation dialog appears
- [ ] Clicking Cancel with only an attachment added → confirmation dialog appears
- [ ] Clicking "Leave" in dialog → navigates away, data discarded
- [ ] Clicking "Stay" in dialog → remains on Raise page, all data intact
- [ ] Clicking Cancel on empty form → navigates directly to My Tickets (no dialog)

---

## BF-007 — Search — Clear/Reset (X) Button

**Covers:** TC__102

**Files to modify:**
- Frontend: My Tickets page/component (search input area)

**Current bug:** After typing a search query, there is no clear button (X) to reset the search and show all tickets.

**Fix:**
```jsx
const [searchQuery, setSearchQuery] = useState("");

<div className="relative">
  <input
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="SEARCH TICKETS..."
    className="..."
  />
  {searchQuery && (
    <button
      type="button"
      onClick={() => setSearchQuery("")}
      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      aria-label="Clear search"
    >
      ✕
    </button>
  )}
</div>
```

**Acceptance criteria:**
- [ ] X/clear button appears only when the search input has text
- [ ] Clicking X clears the input and shows all tickets
- [ ] Button disappears when input is empty

---

## BF-008 — Time Log — Invalid Hours Validation Message

**Covers:** TC_011

**Files to modify:**
- Frontend: `AdminAddTimeLogModal.jsx` (and the employee-facing time log form if separate)

**Current bug:** When entering invalid hours (e.g., `-5` or text), the Save button becomes disabled but no validation message is displayed to explain why.

**Fix — Add inline validation message:**
```jsx
const [hoursError, setHoursError] = useState("");

const validateHours = (value) => {
  if (!value && value !== 0) return "Hours is required";
  if (isNaN(value)) return "Please enter a valid number";
  if (Number(value) < 0) return "Hours cannot be negative";
  if (Number(value) === 0) return "Hours must be greater than 0";
  if (Number(value) > 24) return "Hours cannot exceed 24 per day";
  return "";
};

const handleHoursChange = (e) => {
  const val = e.target.value;
  setHours(val);
  setHoursError(validateHours(val));
};

// JSX — show error below the input:
<input
  type="number"
  value={hours}
  onChange={handleHoursChange}
  className={hoursError ? "border-red-500" : ""}
/>
{hoursError && (
  <span className="text-red-500 text-xs mt-1">{hoursError}</span>
)}
```

**Acceptance criteria:**
- [ ] Entering `-5` → shows "Hours cannot be negative" below the field
- [ ] Entering letters/text → shows "Please enter a valid number"
- [ ] Save button disabled AND error message is visible (both conditions, not just one)
- [ ] Valid value clears the error message
- [ ] Error is in red text, consistent with other form errors

---

## BF-009 — Time Log & Timesheet — Multiple Attachments

**Covers:** TC_039, TC_040 (Time Logs) | TC_070, TC_071 (Timesheets)

> This ticket is the same root fix as BF-004 but applied specifically to:
> - `AdminAddTimeLogModal.jsx`
> - `AdminCreateTimesheetModal.jsx`
> - `timeLogController.js`
> - `timesheetController.js`

Follow the exact same implementation steps described in BF-004.

**Additional file to check:**
- `backend/models/timeLogsSchema.js` → ensure `attachments` is an array
- `backend/models/timesheetSchema.js` → ensure `attachments` is an array

**Acceptance criteria:**
- [ ] Time Log modal allows multiple file selection
- [ ] Second file does not replace first in Time Log modal
- [ ] Timesheet creation modal allows multiple file selection
- [ ] Second file does not replace first in Timesheet modal
- [ ] All files are saved to the database as an array

---

## BF-010 — Time Log — Display Limit Beyond 5 Entries

**Covers:** TC_046

**Files to modify:**
- Frontend: Time Tracker page or `LogsListcard.jsx` component (wherever time logs are listed)

**Current bug:** Only the first 5 time log entries are displayed. Entries 6+ are not shown.

**Root cause to investigate first:** Check whether:
1. A hardcoded `slice(0, 5)` or `.limit(5)` exists in the frontend component or backend query
2. Pagination is implemented but not rendering additional pages

**Fix Option A — Hardcoded frontend slice (most likely):**
```jsx
// Find and remove/change any hardcoded limit:
// BAD:
const displayedLogs = timeLogs.slice(0, 5);

// GOOD (show all, or add proper pagination):
const displayedLogs = timeLogs; // show all
```

**Fix Option B — Backend query limit:**
```javascript
// In timeLogController.js or timeTrackerController.js:
// BAD:
const logs = await TimeLog.find({ user: userId }).limit(5);

// GOOD:
const logs = await TimeLog.find({ user: userId }).sort({ date: -1 }); // no hardcoded limit
// OR implement proper pagination:
const { page = 1, limit = 20 } = req.query;
const logs = await TimeLog.find({ user: userId })
  .sort({ date: -1 })
  .skip((page - 1) * limit)
  .limit(Number(limit));
```

**Acceptance criteria:**
- [ ] Adding 6 or more time log entries → all entries display
- [ ] No hardcoded `.slice(0, 5)` or `.limit(5)` in the logs list
- [ ] If pagination exists, page 2 correctly loads entries 6+
- [ ] Total count displayed is accurate

---

## BF-011 — Time Log — Cancel Delete Confirmation

**Covers:** TC_048

**Files to modify:**
- Frontend: Time Tracker page or `LogsListcard.jsx` (wherever the delete icon/button is rendered)

**Current bug:** Clicking the delete icon immediately deletes the entry. There is no cancel/confirmation step.

**Fix — Add a confirmation step before deletion:**
```jsx
const [deleteTarget, setDeleteTarget] = useState(null);

// Delete icon click → set target (don't delete yet):
const handleDeleteClick = (logId) => {
  setDeleteTarget(logId);
};

// Confirm delete:
const confirmDelete = async () => {
  await api.delete(`/api/timelogs/${deleteTarget}`);
  toast.success("Time log deleted");
  setDeleteTarget(null);
  refreshLogs();
};

// JSX — confirmation dialog:
{deleteTarget && (
  <div className="modal-overlay">
    <div className="modal">
      <p>Are you sure you want to delete this time log?</p>
      <button onClick={confirmDelete}>Delete</button>
      <button onClick={() => setDeleteTarget(null)}>Cancel</button>
    </div>
  </div>
)}
```

**Acceptance criteria:**
- [ ] Clicking delete icon opens a confirmation dialog (not instant delete)
- [ ] Clicking "Cancel" in dialog → dialog closes, entry remains unchanged
- [ ] Clicking "Delete/Confirm" in dialog → entry is deleted
- [ ] Success toast appears after confirmed deletion

---

## BF-012 — Timesheet — Name Field Validation

**Covers:** TC_063, TC_065

**Files to modify:**
- Frontend: `AdminCreateTimesheetModal.jsx` (and the employee-facing Create Timesheet component)
- Backend Joi schema: `backend/JoiSchema/` (add or update timesheet Joi schema)

**Current bugs:**
1. Empty name → no validation message shown, form still submits
2. Invalid names like `@@@__324`, `2234`, special-char-only strings → accepted without error

**Fix — Frontend validation for timesheet name:**
```javascript
const validateTimesheetName = (value) => {
  const trimmed = value?.trim();
  if (!trimmed) return "Timesheet Name is required";
  if (/^\d+$/.test(trimmed)) return "Name cannot be numbers only";
  if (/[^a-zA-Z0-9\s\-_]/.test(trimmed)) return "Name can only contain letters, numbers, spaces, hyphens, and underscores";
  if (trimmed.length < 3) return "Name must be at least 3 characters";
  if (trimmed.length > 100) return "Name cannot exceed 100 characters";
  return null;
};
```

**Fix — Backend Joi schema** (in `backend/JoiSchema/timesheetJoiSchema.js`):
```javascript
const Joi = require("joi");

const createTimesheetSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .pattern(/^[a-zA-Z0-9\s\-_]+$/)
    .required()
    .messages({
      "string.empty": "Timesheet Name is required",
      "string.min": "Name must be at least 3 characters",
      "string.pattern.base": "Name can only contain letters, numbers, spaces, hyphens, and underscores",
      "any.required": "Timesheet Name is required",
    }),
  // ... other fields
});
```

**Acceptance criteria:**
- [ ] Submitting with empty name → "Timesheet Name is required" message appears inline
- [ ] Entering `@@@__324` → validation error shown
- [ ] Entering `2234` (numbers only) → validation error shown
- [ ] Entering `Weekly Report` → accepted
- [ ] Backend rejects invalid names with appropriate 400 error
- [ ] Error message is shown in red, consistent with other form errors

---

## BF-013 — Timesheet — Empty Form Submission Validation

**Covers:** TC_074

**Files to modify:**
- Frontend: `AdminCreateTimesheetModal.jsx` (and employee-facing create timesheet form)

**Current bug:** Clicking "Create Timesheet" with empty required fields does not show any validation messages. The form appears to submit silently or does nothing.

**Fix — Run full validation on submit before API call:**
```jsx
const handleSubmit = () => {
  // Validate all required fields before making API call
  const nameError = validateTimesheetName(name);
  const dateError = !selectedDate ? "Date is required" : null;

  // Set all errors at once
  setNameError(nameError);
  setDateError(dateError);

  // Stop if any errors
  if (nameError || dateError) {
    return;
  }

  // Proceed with API call
  submitTimesheet();
};
```

**Also ensure each field has an error state and displays it:**
```jsx
<input
  value={name}
  onChange={(e) => { setName(e.target.value); setNameError(null); }}
  className={nameError ? "border-red-500" : ""}
/>
{nameError && <span className="text-red-500 text-xs">{nameError}</span>}
```

**Acceptance criteria:**
- [ ] Clicking "Create Timesheet" with empty name → "Timesheet Name is required" appears
- [ ] All required fields show their respective validation errors simultaneously
- [ ] No API call is made when validation fails
- [ ] Errors clear as user fills in valid data

---

## BF-014 — Timesheet — Delete & Edit Options

**Covers:** TC_078 (no delete), TC_079 (no edit)

**Files to modify:**
- Frontend: Wherever created timesheets are listed (likely `ViewTimesheetModal.jsx` or the Timesheets tab page)
- Backend: `backend/controllers/timesheetController.js` (verify `updateTimesheet` and `deleteTimesheet` methods exist)
- Backend: `backend/routes/allRoutes.js` (verify `PUT /timesheets/:id` and `DELETE /timesheets/:id` are mounted)

**Current bug:** After creating a timesheet, there is no Edit or Delete button/icon visible in the list.

**Fix — Frontend (add Edit and Delete actions to each timesheet row):**
```jsx
// In timesheet list component:
{timesheets.map(ts => (
  <div key={ts._id} className="flex items-center justify-between">
    <div>
      <span>{ts.name}</span>
      <span>{ts.date}</span>
    </div>
    <div className="flex gap-2">
      {/* Edit button */}
      <button
        onClick={() => openEditModal(ts)}
        aria-label="Edit timesheet"
      >
        ✏️ Edit
      </button>
      {/* Delete button */}
      <button
        onClick={() => handleDeleteTimesheet(ts._id)}
        aria-label="Delete timesheet"
      >
        🗑️ Delete
      </button>
    </div>
  </div>
))}
```

**Fix — Backend (verify endpoints exist in `timesheetController.js`):**
```javascript
// Ensure these exist in timesheetController.js:
exports.updateTimesheet = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updated = await Timesheet.findByIdAndUpdate(id, req.body, { new: true });
  if (!updated) throw new NotFoundError("Timesheet not found");
  res.status(200).json({ status: "success", message: "Timesheet updated", data: updated });
});

exports.deleteTimesheet = catchAsync(async (req, res) => {
  const { id } = req.params;
  const deleted = await Timesheet.findByIdAndDelete(id);
  if (!deleted) throw new NotFoundError("Timesheet not found");
  res.status(200).json({ status: "success", message: "Timesheet deleted" });
});
```

**Fix — Backend routes (verify in `allRoutes.js`):**
```javascript
router.put("/timesheets/:id", isLoggedIn, catchAsync(timesheetController.updateTimesheet));
router.delete("/timesheets/:id", isLoggedIn, catchAsync(timesheetController.deleteTimesheet));
```

**Acceptance criteria:**
- [ ] Each timesheet in the list shows an Edit (✏️) button
- [ ] Each timesheet in the list shows a Delete (🗑️) button
- [ ] Clicking Edit opens a pre-filled edit form/modal
- [ ] Saving edit updates the timesheet and refreshes the list
- [ ] Clicking Delete shows a confirmation dialog before deleting
- [ ] After confirmed delete, timesheet is removed from list and backend
- [ ] Backend returns 404 for invalid IDs

---

## DESCRIPTION FIELD — ADDITIONAL FIX

**Covers:** TC__035 (3 words < 10 chars → only one validation shows)

**Files to modify:** Raise a Ticket component — description validation logic

**Current bug:** When description has 3 words but fewer than 10 characters (e.g., `"a b c"` = 5 chars), only one error shows ("10 chars minimum") but the word count error is swallowed, or vice versa.

**Fix — Run ALL validations and collect ALL errors:**
```javascript
const validateDescription = (value) => {
  const errors = [];
  const trimmed = value.trim();

  if (!trimmed) {
    errors.push("Description is required");
    return errors; // no need for further checks
  }

  const wordCount = trimmed.split(/\s+/).filter(w => w.length > 0).length;
  if (trimmed.length < 10) errors.push("Description must be at least 10 characters");
  if (wordCount < 3) errors.push("Description must contain at least 3 words");

  return errors; // return array — display ALL errors
};

// In JSX, display all errors:
{descriptionErrors.map((err, i) => (
  <span key={i} className="text-red-500 text-xs block">{err}</span>
))}
```

**Covers:** TC__039 (emoji in description shows wrong message)

Same fix as Subject (BF-001) — check for emojis specifically and return "Emojis are not allowed" before the generic special-characters check.

---

## DEPENDENCY ORDER (critical path)

```
BF-001 (Subject validation)       → independent, start here
BF-002 (File types)               → independent
BF-003 (File size error)          → independent
BF-004 (Multiple attachments)     → BF-002 should be done first (types already set)
  └──► BF-009 (Time Log/Timesheet multi-attach — same fix, different files)
BF-005 (Cancel file selection)    → after BF-004 (file UI is refactored)
BF-006 (Cancel confirmation)      → independent
BF-007 (Search clear button)      → independent, low risk
BF-008 (Hours validation)         → independent
BF-010 (Log display > 5)          → independent (investigate first)
BF-011 (Cancel delete)            → independent
BF-012 (Timesheet name validate)  → independent
BF-013 (Timesheet empty submit)   → after BF-012 (shares validation logic)
BF-014 (Timesheet edit/delete)    → independent (backend may already have endpoints)
```

---

## COMPLETE TESTING CHECKLIST

### Raise a Ticket — Subject
```
- [ ] TC__002: 1 char → "Subject must be at least 5 characters"
- [ ] TC__003: 2 chars → "Subject must be at least 5 characters"
- [ ] TC__004: 3 chars → "Subject must be at least 5 characters"
- [ ] TC__005: 4 chars → "Subject must be at least 5 characters"
- [ ] TC__008: Numbers only → "Numbers are not allowed"
- [ ] TC__017: Emojis → "Emojis are not allowed" (not "special characters")
```

### Raise a Ticket — Description
```
- [ ] TC__035: 3 words but < 10 chars → BOTH errors shown simultaneously
- [ ] TC__039: Emojis → "Emojis are not allowed"
```

### Raise a Ticket — Attachment
```
- [ ] TC__048: .bmp accepted
- [ ] TC__049: .mp4 accepted
- [ ] TC__050: .mp3 accepted
- [ ] TC__057: 25 MB → clear error message shown
- [ ] TC__058: 50 MB → clear error message shown
- [ ] TC__059: 100 MB → clear error message shown
- [ ] TC__061: 2 files attach successfully
- [ ] TC__062: 5 files attach successfully
- [ ] TC__063: Duplicate file → warning shown
- [ ] TC__069: Remove/Cancel file selection button present
```

### Raise a Ticket — Cancel
```
- [ ] TC__083: Filled form + Cancel → confirmation dialog appears
- [ ] TC__084: Dialog → "Leave" → navigates away, data gone
- [ ] TC__085: Dialog → "Stay" → stays on page, data intact
- [ ] TC__086: Attachment only + Cancel → confirmation dialog appears
```

### My Tickets — Search
```
- [ ] TC__102: Clear/X button resets search and shows all tickets
```

### Time Tracker — Time Logs
```
- [ ] TC_011: Invalid hours shows validation message (not just disabled button)
- [ ] TC_039: Multiple files selectable
- [ ] TC_040: Second file does not replace first
- [ ] TC_046: 6+ log entries all visible
- [ ] TC_048: Delete → confirmation dialog → Cancel keeps entry
```

### Time Tracker — Timesheets
```
- [ ] TC_063: Empty name → "Timesheet Name is required"
- [ ] TC_065: Invalid names rejected with error
- [ ] TC_070: Multiple files selectable in timesheet form
- [ ] TC_071: Second file does not replace first in timesheet form
- [ ] TC_074: Empty form submission → all required field errors shown
- [ ] TC_078: Delete button present on each timesheet
- [ ] TC_079: Edit button present on each timesheet
```

---

## TICKET SUMMARY

| Ticket | Module | Type | Sprint | Priority |
|---|---|---|---|---|
| BF-001 | Subject Validation | Frontend + Backend Joi | 1 | High |
| BF-002 | Attachment File Types | Frontend + Backend | 1 | High |
| BF-003 | Attachment File Size Error | Frontend + Backend | 1 | High |
| BF-004 | Multiple Attachments (Tickets) | Frontend + Backend | 1 | High |
| BF-005 | Cancel File Selection | Frontend | 1 | Medium |
| BF-006 | Cancel Form Confirmation | Frontend | 1 | Medium |
| BF-007 | Search Clear Button | Frontend | 1 | Low |
| BF-008 | Time Log Invalid Hours | Frontend | 1 | High |
| BF-009 | Multiple Attachments (Time/TS) | Frontend + Backend | 1 | High |
| BF-010 | Log Display Limit | Frontend / Backend | 1 | High |
| BF-011 | Cancel Delete Confirmation | Frontend | 2 | Medium |
| BF-012 | Timesheet Name Validation | Frontend + Backend Joi | 2 | High |
| BF-013 | Timesheet Empty Form Submit | Frontend | 2 | High |
| BF-014 | Timesheet Edit + Delete | Frontend + Backend | 2 | High |

**Total: 14 tickets | Estimated: 1–2 weeks for 1 developer**

---

## NOTES & DECISIONS

### Why separate emoji check from special characters
Emojis require a distinct Unicode range check and a different error message than punctuation/symbols. Checking emojis first (before the general special-char regex) ensures the correct message is returned per the test spec.

### Why validate all description errors simultaneously
UX best practice: showing both "too short" and "too few words" at once saves the user from submitting twice. Collect errors into an array and render all of them.

### Multiple attachment approach
Rather than a third-party uploader library, we extend the existing multer setup with `upload.array()` and refactor the frontend state from a single `File` object to `File[]`. This keeps the approach consistent with the existing codebase pattern.

### Cancel confirmation — dirty state approach
We track a simple boolean `isDirty` instead of comparing form state to initial state. It is set to `true` on any field change or file attachment. This is the lightest implementation that satisfies all four cancel test cases.

---

*Last Updated: 2026-04-09*
*Plan Version: 1.0*
*Source: RAISE_A_TICKET.xlsx + Time_Tracker.xlsx QA test reports*
*Project: ABIDI Pro — MERN HRM System*
