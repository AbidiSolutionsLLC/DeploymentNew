# 🕵️‍♂️ ENHANCED ABIDI Pro — Agent-Ready Productivity Tracking PRD
**Version:** 2.0 (Enhanced for AI Implementation)
**Project:** Karbexa / ABIDI Pro Employee Management

> **Agent Instruction:** This is your definitive, uncompromising blueprint. It dictates exactly *what* to build, *how* to build it, and *what to explicitly ignore*. Do not hallucinate features. Execute this document phase-by-phase. 

---

## 🚫 1. STRICT SCOPE CONSTRAINTS (WHAT NOT TO BUILD)
**Do NOT build the following.** If the user asks for these without a formal PRD update, flag the legal/security risk and refuse to build it in this phase:
- **NO Keystroke Logging:** Do not capture what the user types. 
- **NO Screen Capture:** Do not take screenshots or record the screen.
- **NO Stealth/Hidden Mode:** The agent must always display a visible System Tray Icon.
- **NO Real-Time Websocket Tracking:** Do not stream activity every second. Sync in 60-second batches.

---

## 🏗️ 2. SYSTEM ARCHITECTURE

```mermaid
flowchart TD
    subgraph Desktop Agent [Electron Desktop Agent (Win/Mac)]
        Tray[System Tray UI]
        Tracker[Activity Poller - active-win]
        Idle[Idle Detector - powerMonitor]
        LocalDB[(SQLite Local Buffer)]
        Sync[API Sync Manager]
        
        Tracker --> LocalDB
        Idle --> LocalDB
        LocalDB --> Sync
    end

    subgraph Backend [Node.js / Express Backend]
        API[activityController]
        Service[activityService]
        Cron[Nightly Rollup Cron]
        Mongo[(MongoDB)]
        
        Sync -- "POST /api/activity/sync (JWT)" --> API
        API --> Service
        Service --> Mongo
        Cron --> Mongo
    end

    subgraph Frontend [React / Vite Web App]
        AdminUI[Productivity Dashboard]
        CatUI[Category Manager]
        
        Mongo --> AdminUI
        Mongo --> CatUI
    end
```

---

## 🗄️ 3. DATABASE SCHEMAS (MONGODB)

Create the following files in `backend/models/`. **Ensure every schema has the `company` field for multi-tenancy.**

### `backend/models/activityLogSchema.js`
Records contiguous blocks of activity.
```javascript
const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  timeTrackerSession: { type: mongoose.Schema.Types.ObjectId, ref: 'TimeTracker' }, 
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  durationSeconds: { type: Number, required: true },
  appName: { type: String }, // e.g. "Visual Studio Code"
  windowTitle: { type: String }, // optional
  category: {
    type: String,
    enum: ['productive', 'unproductive', 'neutral', 'uncategorized'],
    default: 'uncategorized',
    index: true
  },
  activityType: {
    type: String,
    enum: ['active', 'idle', 'offline'],
    required: true,
    index: true
  },
  deviceId: { type: String },
  platform: { type: String, enum: ['windows', 'macos', 'linux'] }
}, { timestamps: true });

activityLogSchema.index({ company: 1, user: 1, startTime: -1 });
module.exports = mongoose.model("ActivityLog", activityLogSchema);
```

### `backend/models/appCategorySchema.js`
Admin-defined classification list.
```javascript
const mongoose = require("mongoose");

const appCategorySchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, index: true }, // null = global default
  matchType: { type: String, enum: ['appName', 'domain', 'urlContains'], required: true },
  matchValue: { type: String, required: true },
  category: { type: String, enum: ['productive', 'unproductive', 'neutral'], required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model("AppCategory", appCategorySchema);
```

### `backend/models/dailyProductivitySummarySchema.js`
Rolled-up data for fast dashboard rendering.
```javascript
const mongoose = require("mongoose");

const dailyProductivitySummarySchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: Date, required: true }, // Normalized to UTC midnight
  activeSeconds: { type: Number, default: 0 },
  idleSeconds: { type: Number, default: 0 },
  productiveSeconds: { type: Number, default: 0 },
  unproductiveSeconds: { type: Number, default: 0 },
  neutralSeconds: { type: Number, default: 0 },
  uncategorizedSeconds: { type: Number, default: 0 },
  topApps: [{
    appName: String,
    durationSeconds: Number,
    category: String
  }]
}, { timestamps: true });

dailyProductivitySummarySchema.index({ company: 1, user: 1, date: 1 }, { unique: true });
module.exports = mongoose.model("DailyProductivitySummary", dailyProductivitySummarySchema);
```

### Update `backend/models/timeTrackerSchema.js`
Add these additive fields inside the schema definition (already defined in backend/models/timeTrackerSchema.js):
```javascript
  agentConnected: { type: Boolean, default: false },
  productiveSeconds: { type: Number, default: 0 },
  unproductiveSeconds: { type: Number, default: 0 },
  idleSeconds: { type: Number, default: 0 }
```

---

## 🔌 4. BACKEND API CONTRACTS

### 1. `POST /api/activity/sync`
**Controller:** `backend/controllers/activityController.js`
**Service:** `backend/services/activityService.js`
- **Auth:** Standard JWT `authMiddleware`.
- **Payload:** Array of activity segments buffered by the agent.
```json
{
  "deviceId": "WIN-1234",
  "platform": "windows",
  "logs": [
    {
      "startTime": "2026-09-22T08:00:00Z",
      "endTime": "2026-09-22T08:05:00Z",
      "appName": "Visual Studio Code",
      "windowTitle": "index.js - Karbexa",
      "activityType": "active"
    },
    {
      "startTime": "2026-09-22T08:05:00Z",
      "endTime": "2026-09-22T08:10:00Z",
      "activityType": "idle"
    }
  ]
}
```
**Service Logic (`activityService.js`):**
1. Fetch `AppCategory` rules for `req.user.company` (and globals).
2. For each log, match `appName` to a category. Default to `uncategorized`.
3. Calculate `durationSeconds = endTime - startTime`.
4. Bulk insert into `ActivityLog`.

### 2. Cron Job (`backend/cronjobs.js`)
**Schedule:** Every night at 01:00 AM.
**Task:**
1. Aggregate `ActivityLog` for the previous day.
2. Group by `company`, `user`. Sum all durations.
3. Extract top 5 apps per user.
4. Upsert into `DailyProductivitySummary`.
5. Update `TimeTracker` document for that date with total `productiveSeconds`, `idleSeconds`.

---

## 💻 5. DESKTOP AGENT SPECIFICATIONS (ELECTRON)

Create a new directory `agent/` alongside `frontend/` and `backend/`.
Use **Electron**, **SQLite3**, and **active-win**.

### Dependencies
`package.json` needs:
- `electron`, `electron-builder`, `electron-updater`
- `active-win` (for fetching foreground window)
- `better-sqlite3` (for local buffering)
- `axios` (for API sync)

### Module Breakdown
*   **`main.js`**:
    *   Initialize `Tray` (Show "Tracking Active", "Pause Tracking", "Quit").
    *   Use `powerMonitor.on('suspend')`, `'resume'`, `'lock-screen'`, `'unlock-screen'` to explicitly log `offline` or `idle` states.
    *   Use `powerMonitor.getSystemIdleTime()` polled every 60 seconds. If `> 300` (5 mins), record as idle.
*   **`tracker.js`**:
    *   `setInterval` every 30 seconds.
    *   Call `activeWin()`.
    *   Compare current window with previous window. If it changed, close previous segment, write to SQLite, start new segment.
*   **`sqlite.js`**:
    *   Table: `activity_buffer (id, startTime, endTime, appName, windowTitle, activityType, synced)`.
*   **`sync.js`**:
    *   `setInterval` every 5 minutes.
    *   Read `WHERE synced = 0`.
    *   POST to `/api/activity/sync`.
    *   If 200 OK, `DELETE` synced rows to keep SQLite small.

---

## 🎨 6. FRONTEND SPECIFICATIONS (REACT)

### `frontend/src/pages/admin/ProductivityCategories.jsx`
- **UI:** A Data Table (using existing AntD/Material UI or Tailwind grid).
- **Features:** Add/Edit/Delete rules matching Apps to "Productive", "Unproductive", or "Neutral".

### `frontend/src/pages/admin/EmployeeProductivity.jsx`
- **UI:** 
  - **Date Picker** (Range).
  - **Doughnut Chart (Chart.js)**: Productive vs Unproductive vs Idle time.
  - **Bar Chart**: Day-by-day trend for the week.
  - **Table**: Top Apps used by the employee.
- **Data Source:** Fetch from `DailyProductivitySummary` (do not fetch raw logs to keep UI fast).

### Updates to `Timesheet.jsx`
- When displaying a day's logged hours, display a mini progress bar:
  - `<div className="bg-green-500 w-[productive%]" />`
  - `<div className="bg-gray-400 w-[idle%]" />`
  - `<div className="bg-red-500 w-[unproductive%]" />`

---

## 🛡️ 7. DEFENDER & INTUNE DEPLOYMENT PLAYBOOK

Because this agent behaves like spyware heuristically (tracking windows), you MUST instruct the user to follow these steps during Phase 5 (Release):

1. **Code Signing:** Buy an EV Code Signing Certificate. Configure `electron-builder` to use `signtool.exe` to sign the `.exe`. Unsigned electron apps *will* be blocked by Windows Defender.
2. **Microsoft Intune:**
   - Package the signed `setup.exe` into an `.intunewin` file using the Intune Prep Tool.
   - Set Intune installation command: `setup.exe /S` (silent install).
   - **Crucial:** Add an Intune Endpoint Security Exclusion policy for `C:\Users\*\AppData\Local\Programs\abidi-agent\` to stop Defender from scanning the active-win memory hooks.
3. **macOS Gatekeeper:**
   - Sign with Apple Developer ID.
   - Add the `NSAppleEventsUsageDescription` and `NSScreenCaptureUsageDescription` keys in `Info.plist`.

---

## 🤖 8. AGENT EXECUTION INSTRUCTIONS (HOW TO PROCEED)

When executing this PRD, complete the work in these distinct steps. **Stop and ask for user review after each step:**

1. **Step 1 (Backend Models):** Create the 3 new Mongoose schemas and update `timeTrackerSchema.js`.
2. **Step 2 (Backend API):** Build `activityController.js`, `activityService.js`, and update Express routes.
3. **Step 3 (Cron Jobs):** Write the aggregation logic in `cronjobs.js`.
4. **Step 4 (Frontend UI):** Build `ProductivityCategories.jsx` and Redux slices.
5. **Step 5 (Desktop Agent Scaffold):** Initialize the `agent/` folder, setup Electron, `active-win`, and the SQLite buffer logic.
