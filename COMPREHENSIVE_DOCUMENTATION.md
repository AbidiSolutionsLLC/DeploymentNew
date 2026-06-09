# 📋 ABIDI Pro (Karbexa) - Comprehensive Technical Documentation

---

## 🎯 1. Project Overview & Architecture

**ABIDI Pro (Karbexa)** is an enterprise HR and Project Management system.
- **Frontend Stack**: React 19, Redux Toolkit, React Router 7, Tailwind CSS, Material-UI, Vite. Azure MSAL for auth.
- **Backend Stack**: Node.js, Express.js, MongoDB (Mongoose), JWT, Joi Validation, Azure Storage Blob, Nodemailer.
- **Architecture**: Standard RESTful Client-Server. Express handles APIs via modular routes. React handles SPA UI.

### System Data Flow
1. **Frontend**: React components dispatch Redux Thunks or call `api` via centralized `axios.js`.
2. **Gateway**: Express.js captures requests. `authMiddleware` authenticates JWT and maps Azure users to DB users. `roleMiddleware` authorizes.
3. **Validation**: `validateRequest` middleware uses `JoiSchema/` to sanitize inputs.
4. **Controllers**: Wrapped in `catchAsync()`, controllers process business logic and use `ExpressError` for throwing formatted HTTP errors.
5. **Database**: Mongoose interacts with MongoDB.

---

## 🗄️ 2. Core Entities & Database Models

The system is built around several key entities mapped to MongoDB collections in `backend/models/`:

- **User & Auth**: `userSchema.js`, `BlacklistedTokenSchema.js`, `aclSchema.js`.
- **Company & Organization**: `companySchema.js`, `departemt.js` (Note: typo in filename `departemt.js`), `folder.js`, `file.js`.
- **Projects & Tasks**: `projectSchema.js`, `taskSchema.js`, `todoSchema.js`.
- **HR & Time Tracking**: `leaveRequestSchema.js`, `timeLogsSchema.js`, `timesheetSchema.js`, `timeTrackerSchema.js`, `holidaySchema.js`.
- **Support & Operations**: `ticketManagementSchema.js`, `Expense.js`, `LogSchema.js`, `notificationSchema.js`.

---

## 📡 3. API & Controller Mapping

All routes are mounted from `backend/routes/webRoutesMount.js` to `/api/web/...`. Below is the complete mapping of current controllers to their domains.

| Domain | Controller (`backend/controllers/`) | Routes (`backend/routes/webRoutes/`) | Key Features |
|--------|-------------------------------------|--------------------------------------|--------------|
| **Auth** | `authController.js` | `authRoutes.js` | Login, Azure SSO, Token Refresh, Password Reset |
| **Users** | `userController.js` | `userRoutes.js` | CRUD users, Role management, Profile |
| **Company** | `registerCompany.js` | `companyRoutes.js` | Tenant / Company registration and settings |
| **Department**| `departmentController.js` | `departmentRoutes.js` | Department hierarchy and assignment |
| **Projects** | `projectController.js` | `projectRoutes.js` | Project CRUD, Budget, Team assignments |
| **Tasks** | `taskController.js` | `taskRoutes.js` | Task CRUD, Kanban status, Dependencies |
| **Todos** | `todoController.js` | *(Todo routes handled in tasks/users)*| Personal and project-level sub-tasks |
| **Time Log** | `timeLogController.js`, `timesheetController.js`, `timeTrackerController.js` | `timeLogRoutes.js`, `timesheetRoutes.js`, `timeTrackerRoutes.js` | Daily time logs, Timesheet submission/approval |
| **Leaves** | `leaveRequest.js`, `holidayController.js` | `leaveRoutes.js`, `holidayRoutes.js` | Leave requests, Approvals, Holiday calendar |
| **Expenses** | `expenseController.js` | `expenseRoutes.js` | Expense filing, Receipt uploads, Approvals |
| **Tickets** | `ticketController.js` | `ticketRoutes.js` | Internal IT/Support ticketing system |
| **Files/Docs**| `filesController.js`, `folderController.js`, `downloadController.js`, `cloudinaryController.js` | `filesRoute.js`, `folderRoutes.js`, `cloudinaryRoutes.js` | Azure/Cloudinary uploads, Directory structures |
| **System** | `LogController.js`, `notificationController.js`, `adminDashboardController.js` | `logRoutes.js`, `notificationRoutes.js`, `adminDashboardRoutes.js` | Audit logs, SSE Notifications, Dashboard aggregations |

---

## 💻 4. Frontend State & UI Mapping

The React frontend operates via a strictly defined folder architecture in `frontend/src/`.

### 4.1 Global State (Redux)
Configured in `frontend/src/Store/index.js`.
- `authSlice.js`: Manages JWT tokens, Azure AD state, and basic logged-in user info.
- `userSlice.js`: Manages extensive user profile data and settings.
- `attendanceSlice.js` & `attendanceTimer.js`: Tracks live clock-in/clock-out state and daily attendance data.
- `notificationSlice.js`: Receives and stores Server-Sent Events (SSE) notifications.
- `projectSlice.js` & `taskSlice.js`: Local cache for project boards and active task lists.

### 4.2 Central API Client
- **`axios.js`**: The ONE centralized HTTP client. Contains interceptors to inject `Authorization: Bearer <token>` and handles 401 token refreshes. *LLMs: Do not use native `fetch` or vanilla `axios` for protected endpoints.*

### 4.3 Key Components per Domain
- **Dashboards:** `home/FeedsCard.jsx`, `home/RecentActivitiesCard.jsx`, `AdminDashboardStatCard.jsx`.
- **Project/Task Management:** `project/KanbanBoard.jsx`, `project/TaskCard.jsx`, `addTaskModal.jsx`, `MyTaskTable.jsx`.
- **HR & Time:** `LeaveModal.jsx`, `AdminAddAttendanceModal.jsx`, `HolidayTable.jsx`, `EditTimesheetModal.jsx`.
- **Finance/Support:** `ExpenseForm.jsx`, `ExpenseTable.jsx`, `AdminTickets.jsx` (Page).
- **Navigation/Layout:** `navbar.jsx`, `NavBarVertical.jsx`, `SubNavbarVertical.jsx`, `AppLayout.jsx`.

---

## 🔐 5. Security & Middlewares

- **`authMiddleware.js`**: Parses JWT. Must be applied to all protected routes in `webRoutesMount.js`.
- **`roleMiddleware.js`**: Exports `authorizeRoles(...roles)`. Used chained after `authMiddleware`.
- **`validateRequest.js`**: Validates request body/params against Joi schemas found in `backend/JoiSchema/`. Always use this instead of manual `if(!req.body.name)` checks.
- **`globalErrorHandler.js`**: Catches all thrown `ExpressError` instances or standard `Error` objects and formats them into `{ success: false, error: "Message", statusCode: 400 }`.

---

## 🚀 6. Standard Operating Procedures for LLMs

1. **Adding a Feature:**
   - Create Schema (`models/`).
   - Create Joi Validator (`JoiSchema/`).
   - Create Controller (`controllers/`), wrapping exports in `catchAsync`.
   - Add Routes in `routes/webRoutes/` and mount them.
   - Frontend: Add API definition in `frontend/src/api/`.
   - Frontend: Create UI components in `frontend/src/Components/` (use subfolders if domain-specific).

2. **Error Handling:**
   - Never use `res.status(400).json(...)` in a controller for an error.
   - Instead: `throw new BadRequestError("Invalid input")` or `throw new NotFoundError("User not found")`.

3. **Styling:**
   - Use Tailwind utility classes primarily.
   - Use Material-UI/Ant Design only for complex interactive components (e.g., Data Grids, complex dropdowns).

*This documentation is kept entirely up-to-date with the codebase architecture as of 2026-06.*
