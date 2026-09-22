# 🕵️ ABIDI Pro — Productivity & Idle Time Tracking Module PRD
### Insightful-Style Productivity Insights (Scoped, Not a Full Clone) · v1.0

> **How to use this document**: This is the single source of truth for the productivity-tracking feature build inside the existing ABIDI Pro (Karbexa) codebase. It extends — does NOT replace — the existing `timeTrackerSchema.js` / `timeTrackerController.js` / `timeTrackerService.js` module described in `project-context.md` and `project-map.md`. Read those two documents first. Execute phase by phase. Do not skip the "Blockers & Constraints" section before writing any agent/desktop code — most real-world failures in this category of feature happen there, not in the UI.

---

## 📑 Table of Contents
1. [Scope Decision — What We're Building vs. Insightful](#1-scope-decision)
2. [Why a Desktop Agent Is Unavoidable](#2-why-a-desktop-agent-is-unavoidable)
3. [System Architecture](#3-system-architecture)
4. [Data Model](#4-data-model)
5. [Productivity Classification Engine](#5-productivity-classification-engine)
6. [Idle & Active Time Detection Logic](#6-idle--active-time-detection-logic)
7. [Blockers & Constraints (Research-Backed)](#7-blockers--constraints)
8. [Legal & Privacy Requirements](#8-legal--privacy-requirements)
9. [Security Considerations](#9-security-considerations)
10. [Phased Implementation Plan](#10-phased-implementation-plan)
11. [Test Plan Per Phase](#11-test-plan-per-phase)
12. [Rollout Plan](#12-rollout-plan)
13. [Agent Operating Rules for Antigravity](#13-agent-operating-rules)
14. [Appendix — Edge Case Checklist](#14-appendix--edge-case-checklist)

---

## 1. Scope Decision

You explicitly do **not** want a full Insightful clone. Insightful's actual feature set (confirmed from their site and independent reviews) includes: automatic time tracking, productive/unproductive/neutral app & website classification, idle time detection, screenshots at intervals (with blur/privacy controls), stealth/silent mode, offline time tracking, productivity scores/benchmarking/trends, and project/task time attribution.

**In scope for ABIDI Pro (v1):**
- Total work time (already partially exists via `timeTrackerSchema.js`)
- Active time vs. Idle time vs. Offline/disconnected time
- Productive vs. Unproductive vs. Neutral time, broken down by application/website category
- Per-user, per-team, and per-company productivity summaries and trends
- Admin-configurable productivity categorization (which apps/sites count as productive)
- Daily/weekly reports integrated into the existing `TimeTracker.jsx` / `Timesheet.jsx` / `ApproveTimesheets.jsx` flow

**Explicitly out of scope for v1 (flag if Antigravity tries to build these unprompted):**
- Screenshot capture — highest legal/privacy risk, highest storage cost, not requested
- Keystroke logging / keylogging — this is the single most legally dangerous feature in this category (see §8) and was not requested
- Webcam/audio capture
- Mouse-heatmap or click-tracking analytics
- Stealth/hidden mode — running a monitoring agent invisibly to the employee is what creates most of the legal exposure described in §8; the agent must always be visibly running (tray icon, on-screen indicator)

If a future phase genuinely needs screenshots, treat it as a **separate PRD** with its own legal sign-off — do not fold it into this one silently.

---

## 2. Why a Desktop Agent Is Unavoidable

The existing ABIDI Pro stack is a **browser-based React SPA**. A browser tab cannot see:
- Which application has OS focus (Chrome, VS Code, Slack desktop, Photoshop, etc.)
- The system idle time (no mouse/keyboard input) when the browser tab itself is in the background or minimized
- Websites visited in *other* browser tabs/windows or other browsers entirely

A browser can only report on itself, and only while the tab is open and foregrounded — that's roughly 20% of what "productivity tracking" means. To get the rest (app-level focus, cross-app idle detection, works-when-browser-is-closed), you need a **native desktop background agent** with OS-level permissions. This is exactly why Insightful, DeskTime, Hubstaff, Time Doctor, WorkTime, etc. all ship a downloadable desktop app rather than doing it purely in-browser.

**Recommendation:** Build the agent in **Electron**, reusing your existing React/TypeScript skillset and allowing you to share types/utilities with the `frontend/` package. Electron is the same technology Slack, Figma's desktop app, and many time-tracking competitors are built on, so tooling and community solutions (`active-win`, `get-windows`, `electron-builder`) already solve most of the hard OS-integration problems — you don't have to write native Win32/Cocoa code yourself.

**Alternative considered and rejected for v1:** A pure browser-extension approach (only tracks browser tab activity, not native apps like VS Code/Photoshop/Slack desktop) — rejected because it can't deliver "total work time" or "unproductive app" tracking for non-browser tools, which your team clearly uses (VS Code, etc., per your stack).

---

## 3. System Architecture

```
┌─────────────────────────────┐      ┌──────────────────────────────┐
│   ABIDI Pro Desktop Agent    │      │      ABIDI Pro Web App        │
│   (new Electron app)         │      │  (existing frontend/ React)   │
│                               │      │                                │
│  - Tray icon + on/off toggle │      │  - Productivity dashboard     │
│  - Active window poller      │      │  - Category management (admin)│
│  - Idle time poller          │      │  - Reports / trends           │
│  - Local SQLite buffer       │      │  - Timesheet integration      │
│  - Batched sync to API       │      │                                │
└──────────────┬────────────────┘      └───────────────┬────────────┘
               │  HTTPS (JWT, same auth as web)         │
               ▼                                        ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Existing Express Backend                      │
│  New: activityController.js / activityService.js                 │
│  New: productivityCategoryController.js / Service.js             │
│  Extends: timeTrackerController.js, timesheetService.js          │
│  New models: activityLogSchema.js, appCategorySchema.js          │
│  Existing: authMiddleware, companyScope, catchAsync, rbacUtils   │
└──────────────────────────────────────────────────────────────────┘
```

**Key architectural decisions, matching your existing PRD conventions from `prd.md`:**
- The agent authenticates using the **same JWT auth** as the web app (reuse `authService.js` / issue a long-lived "device token" scoped to `restrictTo('employee')`-equivalent, not a full session token, so a stolen laptop doesn't leak an indefinitely valid admin session).
- Every activity record is `company`-scoped exactly like every other model per your multi-tenancy rule in `prd.md` §4.1.
- The agent **buffers locally** (SQLite or a flat append-only log file) and syncs in batches (e.g., every 60–120s) — never a live socket per keystroke/window-switch. This matters both for the blockers in §7.4 (network reliability) and for cost/volume control.
- Reuse `sseManager.js` to push "your team member just went idle" style live indicators to admin dashboards if desired — do not build a second real-time channel.

---

## 4. Data Model

### 4.1 New model: `backend/models/activityLogSchema.js`
One row per **activity segment** (a contiguous block of time in one app/category), not one row per second — this is critical for storage volume (see §7.6).

```javascript
{
  company: { type: ObjectId, ref: 'Company', required: true, index: true },
  user: { type: ObjectId, ref: 'User', required: true, index: true },
  timeTrackerSession: { type: ObjectId, ref: 'TimeTracker' }, // links to existing clock-in session
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  durationSeconds: { type: Number, required: true },
  appName: { type: String },          // e.g. "Visual Studio Code", "chrome.exe"
  windowTitle: { type: String },      // optional, can be redacted per privacy settings
  url: { type: String },              // only if a supported browser + extension is present
  category: {
    type: String,
    enum: ['productive', 'unproductive', 'neutral', 'uncategorized'],
    default: 'uncategorized',
    index: true
  },
  activityType: {
    type: String,
    enum: ['active', 'idle', 'offline', 'manual'],
    required: true,
    index: true
  },
  source: { type: String, enum: ['desktop-agent', 'browser-extension', 'manual-entry'], required: true },
  deviceId: { type: String }, // to distinguish multiple machines per user
  platform: { type: String, enum: ['windows', 'macos', 'linux'] }
}
// Compound index: { company: 1, user: 1, startTime: -1 }
// TTL / retention handled in a cron job (see §7.6), not at schema level
```

### 4.2 New model: `backend/models/appCategorySchema.js`
Admin-managed classification table (default seeded list + per-company overrides).

```javascript
{
  company: { type: ObjectId, ref: 'Company', required: true, index: true }, // null = global default
  matchType: { type: String, enum: ['appName', 'domain', 'urlContains'], required: true },
  matchValue: { type: String, required: true }, // e.g. "figma.com", "Visual Studio Code"
  category: { type: String, enum: ['productive', 'unproductive', 'neutral'], required: true },
  createdBy: { type: ObjectId, ref: 'User' }
}
```

### 4.3 Extend existing `timeTrackerSchema.js`
Add (non-breaking, additive fields only — per your own "non-breaking" convention in `prd.md` §4.3):
```javascript
activeSeconds: { type: Number, default: 0 },
idleSeconds: { type: Number, default: 0 },
productiveSeconds: { type: Number, default: 0 },
unproductiveSeconds: { type: Number, default: 0 },
neutralSeconds: { type: Number, default: 0 },
agentConnected: { type: Boolean, default: false } // was the desktop agent actually running this session?
```

### 4.4 Aggregation strategy
Do **not** run aggregation queries against raw `activityLogSchema` for dashboards at scale. Add a nightly (or hourly) cron job (`cronjobs.js`, following your existing `cronWorker.js` pattern) that rolls raw activity segments into a `dailyProductivitySummarySchema.js` (`company`, `user`, `date`, `activeSeconds`, `idleSeconds`, `productiveSeconds`, `unproductiveSeconds`, `topApps: []`). Dashboards read from the summary table; only drill-down views hit raw logs with a date range + user filter (never an unbounded scan).

---

## 5. Productivity Classification Engine

1. **Seed a default category list** on first deploy (~150-200 common apps/domains): IDEs (VS Code, JetBrains, GitHub) → productive; project tools (Jira, Trello, Slack, Zoom, Google Docs) → productive; social media (Facebook, Instagram, TikTok, X) → unproductive; entertainment (YouTube, Netflix, Twitch) → unproductive; email/calendar → neutral by default (configurable).
2. **Admin UI** (new page, e.g. `pages/admin/ProductivityCategories.jsx` using existing `<GlassTable>`, `<TableWithPagination>`, `<GlassModal>` patterns) lets a company admin override any default and add company-specific tools (e.g., internal CRM domain → productive).
3. **Matching order:** exact appName match → domain match → urlContains match → fallback `uncategorized`. Uncategorized time must be visibly reported as its own bucket ("Unclassified: 1h 12m") rather than silently dropped or silently counted as either productive or unproductive — this avoids a whole class of "why does my report look wrong" support tickets and avoids accidentally penalizing employees for legitimate tools nobody categorized yet.
4. **Never auto-classify based on window title content alone** (e.g., don't flag "Facebook" just because it appears in a window title) — title-based heuristics produce false positives (a support agent legitimately has "Facebook Ads ticket" open in the helpdesk). Classify by `appName`/`domain`, treat title as supplementary/optional display data only.

---

## 6. Idle & Active Time Detection Logic

- Use Electron's `powerMonitor.getSystemIdleTime()` in the main process, polled every 30–60 seconds (not more frequently — see §7.5 for CPU/battery cost).
- Default idle threshold: **5 minutes** of no mouse/keyboard input (configurable per company, matching Insightful's model of admin-configurable idle thresholds).
- When idle is detected, **do not silently discard the time** — write it as an `activityType: 'idle'` segment so idle time is visibly reported ("Idle: 42 min today"), matching the "how much idle time" requirement in your request.
- When the agent detects `suspend` (laptop sleep) or `lock-screen` via `powerMonitor` events, immediately close the current activity segment and mark subsequent time as `offline` until `resume`/`unlock-screen` fires. Do not let a segment silently span a sleep/wake cycle — this produces multi-hour phantom "active" segments, a common bug class in DIY time trackers.
- **Known false-idle case (confirmed by user reviews of Insightful itself — "occasional false positives in idle detection are reported by users"):** a user on a video call, screen-sharing, or watching a training video may be legitimately working with no mouse/keyboard input for 10+ minutes. Mitigation: if a "meeting app" (Zoom, Teams, Google Meet tab, etc.) is the foreground app when idle is detected, either suppress the idle flag or bucket that time as a separate `activityType` (e.g., `passive-active`) rather than counting it against the employee. This must be a documented, configurable rule — not a hardcoded assumption — since it's the #1 driver of employee distrust in these tools.

---

## 7. Blockers & Constraints

These are the "things Antigravity will hit and must not be surprised by." Each includes the underlying cause and the required mitigation.

### 7.1 Windows Defender / SmartScreen flags the agent as a trojan
**Cause (confirmed via Electron community issue trackers):** Unsigned Electron installers built with `electron-builder` (NSIS) are very frequently flagged by Windows Defender as `Trojan:Win32/Wacatac` or similar, especially on locally-built (non-CI) executables. This is a real, recurring, well-documented problem — not a hypothetical.
**Mitigation (required, not optional, for company-wide rollout):**
- Purchase a **code signing certificate** (standard Authenticode, or ideally an **EV certificate** which gets SmartScreen reputation immediately instead of building it up over weeks of downloads) and sign every Windows build with `signtool.exe` / `@electron/windows-sign` in CI.
- Build only in CI (GitHub Actions), not on developer laptops — the same commit signed in CI has historically been reported clean, while local builds trigger detections even when the code is identical.
- Submit any flagged build to Microsoft's [Windows Defender Security Intelligence false-positive portal](https://www.microsoft.com/wdsi/filesubmission) immediately — turnaround has historically been ~1–3 days.
- IT should distribute the installer via a signed MSI/EXE **and** proactively add an exclusion path in company-managed Windows Defender policy (via Intune/GPO) for the install directory, as a belt-and-suspenders measure — do not rely on this alone, since it only helps company-managed devices.
- Budget and timeline impact: an EV code-signing cert typically requires business identity verification (can take several business days) — **this must be started in Phase 0, not the week of launch.**

### 7.2 macOS permission walls (Screen Recording + Accessibility)
**Cause (confirmed via `active-win`/`get-windows` library issues):** Since macOS Catalina (10.15), reading the active window's **title** requires the **Accessibility** permission, and reading the active window/app reliably at all increasingly requires the **Screen Recording** permission too (confirmed as of recent macOS versions, even though no actual screen image is captured — Apple's API for foreground-window metadata is gated behind the same permission as literal screen capture). Users report these prompts are inconsistent — sometimes they don't fire at all, sometimes the dialog appears behind other windows.
**Mitigation:**
- On first launch, explicitly walk the user through **System Settings → Privacy & Security → Accessibility** and **Screen Recording**, with an in-app screenshot-guided flow (do not rely on the OS prompt alone) — build a dedicated onboarding screen in the agent itself.
- Detect permission state (`mac-screen-capture-permissions` or equivalent) and show a persistent "tracking paused — permission required" banner in the tray menu rather than silently failing and reporting zero productive time.
- If Screen Recording permission is denied, degrade gracefully: track app name + idle time only (no window title, no URL) rather than crashing or reporting nothing.
- Plan for an **Apple Developer Program enrollment** (annual fee) — macOS builds distributed outside the Mac App Store still need to be signed and, ideally, **notarized**, or Gatekeeper will block the app entirely ("app can't be opened because it is from an unidentified developer").

### 7.3 Linux — idle detection is unreliable on Wayland
**Cause (confirmed via Electron GitHub issues):** `powerMonitor.getSystemIdleTime()` relies on X11/XScreenSaver-style APIs. On **Wayland** sessions (default on modern Ubuntu 22.04+, Fedora, etc.) this frequently returns `0` or misreports idle time entirely, because Wayland deliberately restricts cross-application input snooping for security reasons, and there is no single standard idle protocol across desktop environments (GNOME, KDE each differ).
**Mitigation:**
- Detect the session type (`XDG_SESSION_TYPE` env var) at agent startup.
- On X11: full idle detection works as expected.
- On Wayland: either (a) fall back to org-specific idle protocols per desktop environment (more engineering effort, lower priority given your team's actual OS mix), or (b) clearly mark idle-time accuracy as "unsupported/approximate" for Wayland users in the UI rather than silently showing wrong numbers. Given your team is a small dev shop, confirm actual Linux usage before over-investing here — this may be a "document the limitation" item rather than a "solve it" item for v1.

### 7.4 Network reliability / offline queueing
Employees' home internet drops, VPNs disconnect, laptops go on airplane mode. The agent **must** buffer all activity locally (SQLite file in `app.getPath('userData')`) and sync in batches with retry/backoff, never assume the API call succeeds. Losing connectivity must never lose tracked time or crash the agent. Cap local buffer size (e.g., 30 days) with oldest-first eviction as a safety net against unbounded disk growth if a laptop is offline for weeks.

### 7.5 Performance: agent must not slow down the laptop
This was explicitly called out in your request. Concrete mitigations:
- Poll active window / idle time at **30–60 second intervals**, not sub-second — Insightful and comparable tools use similar polling windows; per-second polling is unnecessary for this feature set and is the #1 cause of a "monitoring agent" earning a bad reputation for slowing machines down.
- Keep the Electron **renderer process minimal or headless** — the agent's UI is just a tray icon + a small settings window opened on demand, not a persistent window. Do not keep a hidden `BrowserWindow` rendering React continuously in the background; that is what actually burns CPU/RAM in badly-built Electron tray apps, not the polling itself.
- Batch DB writes (SQLite) rather than writing on every poll tick.
- Test explicitly on a **low-spec Windows laptop (4GB RAM, older CPU)** as part of Phase 8 QA — not just on developer machines, which are typically far more powerful than average employee hardware.
- Add a startup/CPU budget in the acceptance criteria: agent idle CPU usage should stay under ~1% and RAM under ~150MB on a modern machine; document actual measured numbers in the test report, don't just assert compliance.
- Respect battery: pause or reduce polling frequency in `on-battery` power state via `powerMonitor`'s `on-battery`/`on-ac` events (Windows/macOS) for laptop users, since Insightful and similar tools are commonly criticized for battery drain on unplugged laptops.

### 7.6 Data volume / storage growth
A single active employee generates dozens of app-switch events per hour. At scale (even 20-50 employees) raw per-segment logs will grow into the millions of rows within months. Mitigations already baked into §4: segment-based (not per-second) logging, nightly rollup into `dailyProductivitySummarySchema`, and a retention policy (e.g., raw `activityLogSchema` records older than 90 days are purged via cron while daily summaries are kept indefinitely for trend charts) — decide the exact retention window with the business/legal side (see §8), don't default to "keep forever."

### 7.7 Auto-launch, auto-update, and uninstall hygiene
- The agent should auto-launch at OS login (`app.setLoginItemSettings`) but must always be **user-visible and user-toggleable** — a visible tray icon with "pause tracking" is both a UX requirement and a legal-risk mitigation (see §8's "no covert monitoring" guidance).
- Ship an auto-update mechanism (`electron-updater`) from day one — you will need to patch OS permission-flow bugs, Defender false positives, etc. post-launch, and manually re-distributing installers to every employee machine is not viable at any real scale.
- Provide a clean uninstall path that also revokes the device's API token — a laptop that's been wiped/returned should not remain able to silently push activity data.

### 7.8 Multi-monitor / multi-desktop / remote desktop / VDI edge cases
`active-win`/`get-windows`-style libraries can misreport the foreground app when a user is inside a Remote Desktop/Citrix/VM session (they may report "mstsc.exe"/"Remote Desktop Connection" as the app for the entire session instead of what's actually happening inside it). Document this as a known limitation for any employees who RDP into another machine to work — don't silently produce wrong productivity numbers for that population without at least flagging it in the UI ("time in Remote Desktop session — app-level detail unavailable").

### 7.9 "Gaming the system" (mouse jigglers, auto-clickers)
Physical or software mouse-jigglers exist specifically to defeat idle detection. Full defeat-detection is a cat-and-mouse game not worth fully solving in v1, but note it as a known limitation rather than pretending idle detection is tamper-proof — this avoids overselling the feature's accuracy to company leadership.

### 7.10 URL-level tracking requires a browser extension (separate deliverable)
The desktop agent alone can see "Google Chrome" as the foreground app but **not** which website/tab is open (Chrome is sandboxed from that kind of external inspection by design). Real per-domain productivity breakdowns (the `url` field in §4.1) require a **separate browser extension** (Chrome/Edge/Firefox) that the agent listens to locally (e.g., via a localhost port or native messaging). Treat this as its own sub-project with its own store-review process (Chrome Web Store review adds days-to-weeks of lead time and its own privacy-disclosure requirements) — do not assume it ships in the same timeline as the desktop agent. Without it, "unproductive site" tracking will be limited to whichever browser is the foreground app as a whole, which is a materially weaker signal.

---

## 8. Legal & Privacy Requirements

Employee monitoring is legal in essentially all jurisdictions when tied to a legitimate business purpose on company-owned equipment, but **notice and configuration requirements vary**, and getting this wrong has caused real fines elsewhere in the industry. This section is not a substitute for actual legal counsel — flag that explicitly to company leadership before launch — but the engineering implications are:

1. **No covert/stealth monitoring.** Several jurisdictions (Connecticut, Delaware, and newer Texas/New York rules, among others) legally require advance notice to employees before deploying monitoring software; the safe default is to require it everywhere regardless of employee location, and to make the running agent **visibly present** (tray icon, "Tracking active" indicator) at all times rather than hidden. This directly shapes §1's decision to exclude "stealth mode" from scope.
2. **Written policy + acknowledgment before rollout.** Add a company policy document and an in-app acknowledgment/consent checkbox as part of onboarding (Phase 2 of the rollout plan, §12) — store the acknowledgment timestamp per user (new field on `userSchema.js`, e.g., `monitoringPolicyAcceptedAt`).
3. **Data minimization.** Only collect what you need for the stated productivity metrics (app name, category, duration, idle/active state). Because this PRD explicitly excludes screenshots and keystroke content (§1), you avoid the highest-risk data categories entirely (e.g., Illinois BIPA-style biometric exposure doesn't apply here since no biometric data is collected; screenshot/keylogging tools carry materially higher legal exposure than app-category tracking).
4. **Personal-device / off-hours boundaries.** If any employees use personal devices (BYOD) rather than company-issued laptops, the agent must have an explicit, easily accessible "pause tracking" control, and tracking should not run outside a defined work-hours window by default. Do not track personal devices at all if avoidable — restrict the agent to company-owned hardware where possible.
5. **International/remote employees.** If ABIDI Pro's users include remote staff outside Pakistan (EU, US, UK), the strictest applicable jurisdiction's notice/consent rules should be the company-wide default rather than maintaining per-country configurations in v1 — simpler to build and safer legally.
6. **Access control on productivity data.** Only direct managers/admins should see individual-level productivity breakdowns by default; apply the same `restrictTo` RBAC pattern already used elsewhere in the codebase. Peer-level visibility (coworkers seeing each other's productivity scores) should be off by default.

---

## 9. Security Considerations

- The desktop agent's API token must be stored using OS-level secure storage (Keychain on macOS, Credential Manager on Windows, `libsecret`/keyring on Linux) — not a plaintext config file. Use `keytar` or Electron's `safeStorage` API.
- Rate-limit and validate the activity-ingestion endpoint like any other write endpoint (per your existing `prd.md` §10 backend standards — Joi validation, `catchAsync`, company scoping) — a compromised or buggy agent should not be able to flood the API or write to another company's data.
- Validate `company`/`user` on every ingested activity record server-side from the authenticated token — never trust a `companyId`/`userId` field sent in the agent's payload.
- The agent binary itself becomes an attack surface (it runs with elevated OS integration on every employee machine) — keep its dependency surface minimal, and include a `npm audit`/dependency-scanning step in CI for the agent's own `package.json`, separate from the existing frontend/backend CI.

---

## 10. Phased Implementation Plan

### Phase 0 — Foundations & Unblocking (do first, before any feature code)
- [ ] Decide final v1 scope with leadership using §1 as the discussion doc; get explicit sign-off that screenshots/keylogging are out of scope
- [ ] Start Windows code-signing certificate procurement (§7.1) — business verification lead time
- [ ] Enroll in Apple Developer Program if any macOS employees exist (§7.2)
- [ ] Draft the employee monitoring policy + consent flow copy (§8) with whoever handles HR/legal at your company
- [ ] Confirm actual employee OS mix (Windows/macOS/Linux, X11 vs Wayland) so §7.3 effort is right-sized
- [ ] Set up a separate Electron project (`agent/` or a new repo) with CI (GitHub Actions) building signed artifacts for Windows + macOS from day one — never rely on local unsigned builds for anything beyond a developer's own dev machine

### Phase 1 — Backend data layer
- [ ] `activityLogSchema.js`, `appCategorySchema.js`, `dailyProductivitySummarySchema.js` (§4)
- [ ] Extend `timeTrackerSchema.js` with additive fields (§4.3)
- [ ] `activityController.js` / `activityService.js` — ingestion endpoint (batched POST from agent), company-scoped, Joi-validated (`ActivityJoiSchema.js`)
- [ ] `productivityCategoryController.js` / `Service.js` — CRUD for admin category overrides
- [ ] Seed script for default global app/domain category list
- [ ] Nightly cron job (`cronjobs.js`) for rollup into daily summaries + raw-log retention purge (§7.6)
- [ ] Device token issuance endpoint (short-lived-refreshable, scoped, revocable) — extend `authService.js`, do not reuse full web session tokens as-is

### Phase 2 — Minimal desktop agent (Windows + macOS first)
- [ ] Electron project scaffold, tray-only UI, no persistent BrowserWindow
- [ ] Login flow (reuse existing auth, device-token exchange)
- [ ] `active-win`/`get-windows` integration for foreground app polling
- [ ] `powerMonitor` idle/suspend/resume/lock/unlock handling (§6)
- [ ] Local SQLite buffer + batched sync with retry/backoff (§7.4)
- [ ] macOS permission onboarding flow (§7.2)
- [ ] Signed, auto-updating installers via CI (§7.1, §7.7)

### Phase 3 — Classification & reporting UI
- [ ] Admin page: `pages/admin/ProductivityCategories.jsx` (category management, using existing `GlassTable`/`GlassModal` patterns)
- [ ] Dashboard cards: extend existing `TimeTrackingOverviewCard.jsx` with productive/unproductive/idle breakdown (reuse `LineChartCard.jsx`/`BarCard.jsx` patterns)
- [ ] Per-user productivity report page with date range filter, reading from `dailyProductivitySummarySchema` (never raw logs for the default view)
- [ ] "Unclassified time" surfaced explicitly, not hidden (§5.3)
- [ ] RBAC: individual breakdowns visible to self, direct manager, admin only (§8.6)

### Phase 4 — Timesheet & existing time-tracker integration
- [ ] Link `activityLogSchema.timeTrackerSession` to the existing clock-in session so productivity data appears alongside existing `Timesheet.jsx`/`ApproveTimesheets.jsx` views rather than as a disconnected feature
- [ ] `agentConnected` flag surfaced to admins reviewing timesheets (flag sessions where no agent data exists, e.g., manual/forgot-to-run-agent time)

### Phase 5 — Consent, policy, and rollout tooling
- [ ] `monitoringPolicyAcceptedAt` field + blocking acknowledgment screen before first tracking session
- [ ] "Pause tracking" control in agent tray + audit log of pause/resume events (so it's visible, not abusable, per §8.1)
- [ ] Admin view of agent install/connection status per employee (helps IT rollout and support)

### Phase 6 — Linux support & hardening (lower priority, confirm need first per §7.3)
- [ ] Linux build + Wayland detection/limitation messaging
- [ ] Meeting-app idle suppression rules (§6)
- [ ] Low-spec hardware performance validation (§7.5)

### Phase 7 — Browser extension for URL-level tracking (separate sub-project, §7.10)
- [ ] Scope as its own mini-PRD once desktop agent is stable; budget store-review lead time separately

---

## 11. Test Plan Per Phase

Every phase must produce **passing, documented test cases** before being marked complete — do not let the agent self-report "done" without evidence.

**Phase 1 (backend):**
- Unit tests (Jest, following existing `backend/tests/unit/services/` pattern) for `activityService.js` aggregation math and `productivityCategoryService.js` matching precedence (exact appName > domain > urlContains > uncategorized)
- Integration test: POST a batch of activity segments as an agent with a valid device token → verify company-scoped storage, verify a request with another company's `companyId` in the payload is rejected/overridden server-side (§9)
- Cron job test: seed raw logs spanning a fake "yesterday," run rollup job, assert `dailyProductivitySummarySchema` totals match

**Phase 2 (agent):**
- Manual test matrix: Windows 10, Windows 11, macOS (Intel + Apple Silicon), on both a fast dev machine and a low-spec machine
- Verify idle detection triggers within threshold ± a few seconds after last input
- Verify sleep → activity segment closes correctly, no phantom hours after resume
- Verify network-drop mid-session → buffered locally → syncs on reconnect with no data loss
- Verify Windows Defender/SmartScreen does not flag the signed installer (submit to VirusTotal as part of CI or a pre-release checklist)
- Verify macOS permission onboarding correctly detects granted vs. denied Accessibility/Screen Recording state
- CPU/RAM measurement logged and compared against the §7.5 budget

**Phase 3 (reporting UI):**
- Verify unclassified time bucket displays and is not silently folded into productive or unproductive
- Verify report totals for a date range match the sum of underlying daily summaries (no double counting across DST transitions — test explicitly across a DST boundary date, per your existing `dateUtils.js` UTC-timezone caution in `project-context.md`)
- RBAC test: a non-manager employee cannot fetch another employee's productivity breakdown via direct API call, not just via hidden UI

**Phase 4 (timesheet integration):**
- Verify a timesheet with zero agent-connected time is visibly flagged to the approving admin, not silently approved identically to a fully-tracked session

**Phase 5 (consent/rollout):**
- Verify a user cannot be tracked before accepting the policy screen
- Verify pausing tracking is logged and visible to admins (not a silent gap in data with no explanation)

**Phase 6/7:** Test per the specific OS/browser matrix once scoped.

---

## 12. Rollout Plan

1. **Pilot group first** — 3-5 employees (ideally including at least one Windows and one macOS user), not company-wide on day one. Confirms Defender/Gatekeeper behavior and real-world performance before wider exposure.
2. **Policy communication before any install** — written notice, acknowledgment flow (§8.2), Q&A session if this is the first monitoring tool the company has used.
3. **IT-assisted install for pilot**, self-serve installer + docs for company-wide rollout once pilot is clean.
4. **Two-week "observe, don't judge" window** — explicitly tell the pilot group productivity data won't be used for evaluation during the pilot, so early classification/idle-threshold bugs get caught and fixed via feedback rather than eroding trust.
5. **Company-wide rollout** only after pilot feedback is incorporated and Windows Defender/macOS Gatekeeper issues are confirmed resolved for signed builds.

---

## 13. Agent Operating Rules

For the Antigravity agent (or any LLM agent) executing this PRD inside the ABIDI Pro repo:

1. Read `project-context.md` and `project-map.md` before touching any file — match existing naming/patterns exactly (controller → service delegation, `catchAsync`, `ExpressError`, Joi validation, `company` scoping on every query).
2. The new `activityController.js`/`activityService.js` etc. go in the **existing** `backend/controllers/` and `backend/services/` directories, following the existing file-per-domain convention — do not create a parallel folder structure.
3. Every new Mongoose model needs a `company` field with `index: true` per the existing multi-tenancy rule, except genuinely global data (the default/global rows in `appCategorySchema.js`, matching the pattern of `companySchema.js` itself being unscoped).
4. Do not implement anything listed as out-of-scope in §1 (screenshots, keylogging, stealth mode) even if it would be technically easy to add — flag it back to the human instead of quietly building it.
5. Do not mark a phase complete without the corresponding tests in §11 passing and documented in the PR/commit description.
6. Any blocker encountered that isn't already listed in §7 (e.g., a new OS update breaking a permission flow) should be appended to §14 of this document, not solved silently and forgotten — this document should stay the living source of truth, matching the pattern of `project-context.md` itself.
7. Before starting Phase 2 (desktop agent), confirm Phase 0's code-signing certificate is actually available — do not build weeks of agent functionality only to hit the Defender/Gatekeeper wall at release time with no signing story ready.

---

## 14. Appendix — Edge Case Checklist

Quick-reference list an agent or QA engineer can walk through before sign-off on any phase touching tracking logic:

- [ ] Laptop closed mid-session (sleep) → resumed hours later
- [ ] User switches between 2+ monitors with different apps focused
- [ ] User is on a video call (idle detection false-positive risk, §6)
- [ ] User is inside a Remote Desktop/VM session (§7.8)
- [ ] Network drops for an extended period, then reconnects (§7.4)
- [ ] Company timezone spans a DST transition during a tracked session
- [ ] Employee denies macOS Accessibility/Screen Recording permission (§7.2)
- [ ] Employee is on Wayland Linux (§7.3)
- [ ] Employee uninstalls and reinstalls the agent — no duplicate/orphaned device tokens
- [ ] Admin deletes an app category that has historical data already tagged with it — historical records must not silently disappear or error
- [ ] Two employees share a login (should not happen, but device-token-per-install should make this visible rather than silently merging data)
- [ ] Clock skew between the agent machine and the server (don't trust client-reported timestamps blindly for billing-relevant totals — server should sanity-check against ingestion time)
- [ ] Agent update rolls out mid-tracking-session — session must not be lost or double-counted across the restart

---

*Document Version: 1.0*
*Prepared for: ABIDI Pro / Karbexa — Productivity Tracking Module*
*Companion to: `prd.md`, `project-map.md`, `project-context.md`*
*This document is the single source of truth for this feature. Update §14 as new edge cases surface during implementation.*
