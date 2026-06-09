# 🏗️ KARBEXA (ABIDI Pro) — Complete Revamp PRD
### Senior Product Engineering Document · Version 1.0 · June 2026

> **How to use this document**: This is the single source of truth for the entire portal revamp. Every LLM agent executing a task MUST read the relevant sections before writing a single line of code. Every decision made in this document has a reason. Do not deviate.

---

## 📑 Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State — Diagnosis](#2-current-state--diagnosis)
3. [Revamp Goals & Principles](#3-revamp-goals--principles)
4. [SaaS Architecture Plan](#4-saas-architecture-plan)
5. [Design System — Single Source of Truth](#5-design-system--single-source-of-truth)
6. [Theme System — Light · Dark · Brand](#6-theme-system--light--dark--brand)
7. [Layout Architecture — Locked Shell](#7-layout-architecture--locked-shell)
8. [Reusable Component Library](#8-reusable-component-library)
9. [Module Revamp Plan — Phase by Phase](#9-module-revamp-plan--phase-by-phase)
10. [Backend Standards & Security](#10-backend-standards--security)
11. [LLM Agent Operating Rules](#11-llm-agent-operating-rules)
12. [File & Folder Conventions](#12-file--folder-conventions)
13. [Implementation Checklist](#13-implementation-checklist)

---

## 1. Executive Summary

**Karbexa** is an enterprise HRM + Project Management platform. It was built by 2 developers moving fast, using chatbots, and without defined standards. The result is a working product with inconsistent UI, mixed coding patterns, no design tokens, no multi-tenant architecture, and poor scalability.

This PRD defines a **module-by-module revamp** that transforms Karbexa from a single-company internal tool into a production-grade SaaS platform — without rewriting everything at once.

### What Changes
| Area | Before | After |
|------|--------|-------|
| UI Consistency | Random Tailwind + MUI + Ant Design mixed arbitrarily | Design token system, every component from a single library |
| Themes | White only, hardcoded colors | CSS variables — Light, Dark, Violet, Slate themes |
| Architecture | Single-tenant, one company hardcoded | Multi-tenant SaaS with `companyId` scoped data |
| Error Handling | Mix of `res.status()` and `throw` | 100% `ExpressError` + `catchAsync` |
| State Management | Redux + direct `api` calls mixed randomly | Unified: Redux Thunks via `api/` service layer only |
| Security | Basic JWT | JWT + refresh rotation + RBAC + rate limiting |
| Component Reuse | Copy-pasted JSX blocks | Every repeated pattern is a component in `ui/` |

### What Stays
- Vertical left sidebar + right panel + center main content layout
- Technology stack (React 19, Redux Toolkit, Express, MongoDB)
- Azure AD authentication
- Core features (HRM, Projects, Tasks, Time, Leaves, Tickets)

---

## 2. Current State — Diagnosis

### 2.1 Frontend Problems

| Problem | Impact | Example |
|---------|--------|---------|
| Colors hardcoded in JSX | Can't switch themes | `className="text-blue-600 bg-white"` everywhere |
| Modal pattern inconsistent | 6+ different modal implementations | Some use `fixed inset-0`, others use MUI `Dialog` |
| API calls inside components | No caching, duplicate calls | `api.get('/users')` inside `useEffect` in 8 components |
| No loading skeleton | Flash of empty content | Every list shows nothing, then jumps |
| Forms rebuilt per page | No shared validation | 5 different date pickers, 3 select implementations |
| Broken mobile | MobileBlock.jsx hides everything under lg | No responsive design attempt |
| No empty states | Tables show nothing when empty | Users confused if data exists or failed |
| Icons mixed | Lucide + MUI Icons + react-icons all mixed | Visual inconsistency |

### 2.2 Backend Problems

| Problem | Impact | Example |
|---------|--------|---------|
| No `companyId` scoping on some queries | Data leaks between companies | `User.find({})` instead of `User.find({company: req.user.company})` |
| Mix of `res.status()` and `throw` | Inconsistent error responses | Some endpoints return `{error:}`, others `{message:}` |
| No rate limiting | API abuse possible | Login endpoint unprotected |
| No input sanitization beyond Joi | XSS risk | User bio/description fields |
| Cron jobs not idempotent | Double-runs cause duplicate data | Leave balance cron |
| No API versioning | Breaking changes break all clients | `/api/web/` with no version |
| File uploads unvalidated | Malicious file upload risk | Any MIME type accepted |

### 2.3 UI/UX Problems

| Problem | Impact |
|---------|--------|
| No visual hierarchy | Everything looks the same weight |
| Sidebar items have no active state consistency | Users don't know where they are |
| Tables have no sorting, no filtering standard | Different every module |
| No confirmation dialogs standard | Accidental deletes |
| Toast position and style varies | Jarring experience |
| No onboarding flow | New users lost on first login |

---

## 3. Revamp Goals & Principles

### 3.1 Product Goals
1. **Multi-tenant SaaS**: Any company can sign up, get their own isolated workspace
2. **Theme system**: Users can switch between Light, Dark, Violet, Slate themes; saved per user
3. **Consistent UI**: Any page should look like it belongs to the same product
4. **Performance**: Every list page loads in < 1.5s. Skeleton loaders always shown.
5. **Security**: No data cross-contamination between companies. Rate limiting on all auth endpoints.

### 3.2 Design Principles (NON-NEGOTIABLE)
These apply to every component, every page, every PR:

1. **One source of truth for colors**: Never write a color value in JSX. Always use CSS variables or design tokens.
2. **Every repeated pattern is a component**: If you write the same JSX twice, it becomes a component in `src/components/ui/`.
3. **Empty states are mandatory**: Every list, table, or data view must have an explicit empty state component.
4. **Loading states are mandatory**: Every async operation shows a skeleton or spinner.
5. **Error states are mandatory**: Every async operation handles failure with a user-facing message.
6. **Mobile-first for forms, desktop-first for tables**: Forms must work on mobile. Tables can be horizontal-scroll on mobile.
7. **Confirmation before destructive actions**: Delete, deactivate, bulk actions always show a confirmation modal.
8. **Single icon library**: Lucide React only. No MUI icons, no react-icons, no heroicons.
9. **Single date library**: Use `date-fns` (already used via dateUtils). No moment.js, no dayjs.

### 3.3 Coding Principles (NON-NEGOTIABLE)
1. **Backend**: Every async controller is wrapped in `catchAsync`. No exceptions.
2. **Backend**: Never use `res.status(4xx).json()` for errors. Always `throw new BadRequestError()`.
3. **Backend**: Every DB query includes `company: req.user.company` unless explicitly a cross-company admin operation.
4. **Frontend**: Never call `api.get()` inside a component directly. All API calls go through `src/api/` service files.
5. **Frontend**: Never import `axios` directly in a component. Always import from `src/axios.js`.
6. **Frontend**: Never write inline styles (`style={{}}`). Everything is Tailwind or CSS variables.
7. **State**: Redux only for global/shared state (auth, user profile, notifications). Local UI state stays in `useState`.

---

## 4. SaaS Architecture Plan

### 4.1 Multi-Tenancy Strategy

The current app serves one company. We're converting to a **database-per-company** is overkill; instead use **shared database, company-scoped collections**.

#### Rule: Every DB model that contains company data MUST have:
```javascript
company: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Company',
  required: true,
  index: true   // ← MANDATORY for performance
}
```

#### Models that are GLOBAL (no company scope):
- `companySchema.js` (IS the company)
- `BlacklistedTokenSchema.js` (token-level)
- `aclSchema.js` (system-level)

#### Models that NEED company scope audit (check every query):
- `userSchema.js` ✓ has company field → verify all queries filter by it
- `projectSchema.js` → add company index
- `taskSchema.js` → add company index
- `leaveRequestSchema.js` → add company index
- `timesheetSchema.js` → add company index
- `ticketManagementSchema.js` → add company index
- ALL others → audit and add

### 4.2 Company Isolation Middleware

Create `backend/middlewares/companyScope.js`:

```javascript
// Automatically adds req.companyId from req.user.company
// Must be applied after authMiddleware on all routes
const companyScope = (req, res, next) => {
  if (!req.user || !req.user.company) {
    return next(new UnauthorizedError('No company context'));
  }
  req.companyId = req.user.company;
  next();
};
```

Then in every controller:
```javascript
// BEFORE (wrong):
const users = await User.find({});

// AFTER (correct):
const users = await User.find({ company: req.companyId });
```

### 4.3 SaaS Subscription Model (Future-Ready)

Add to `companySchema.js` (non-breaking, just add fields):
```javascript
plan: {
  type: String,
  enum: ['trial', 'starter', 'pro', 'enterprise'],
  default: 'trial'
},
trialEndsAt: Date,
maxUsers: { type: Number, default: 10 },
features: [String]  // feature flags array
```

### 4.4 API Versioning

All routes move from `/api/web/` → `/api/v1/`. This is a breaking change done ONCE at the start of revamp.

Update `backend/index.js`:
```javascript
// Old
app.use('/api/web', webRoutesMount);

// New
app.use('/api/v1', webRoutesMount);
```

Update `frontend/src/axios.js` base URL:
```javascript
baseURL: import.meta.env.VITE_API_BASE_URL // = http://localhost:3000/api/v1
```

---

## 5. Design System — Single Source of Truth

### 5.1 Design Token File

**Location**: `frontend/src/styles/tokens.css`

This file is the ONLY place where color values, spacing, radius, shadow, and typography values are defined. Every component reads from these variables. Never hardcode a color anywhere else.

```css
/* frontend/src/styles/tokens.css */

/* ─── LIGHT THEME (DEFAULT) ─── */
:root,
[data-theme="light"] {
  /* Background layers */
  --bg-base: #F8F9FC;          /* Page background */
  --bg-surface: #FFFFFF;       /* Cards, modals, panels */
  --bg-elevated: #FFFFFF;      /* Dropdowns, popovers */
  --bg-subtle: #F1F3F9;        /* Inputs, table rows, hover states */
  --bg-overlay: rgba(15,23,42,0.45); /* Modal backdrops */

  /* Borders */
  --border-default: #E4E7EF;
  --border-strong: #C9CDD8;
  --border-focus: #6366F1;

  /* Text */
  --text-primary: #0F172A;     /* Headings, labels */
  --text-secondary: #475569;   /* Body text, descriptions */
  --text-tertiary: #94A3B8;    /* Placeholders, hints, disabled */
  --text-inverse: #FFFFFF;     /* Text on dark backgrounds */
  --text-link: #6366F1;

  /* Brand / Primary — Indigo */
  --brand-50: #EEF2FF;
  --brand-100: #E0E7FF;
  --brand-200: #C7D2FE;
  --brand-500: #6366F1;
  --brand-600: #4F46E5;
  --brand-700: #4338CA;
  --brand-900: #312E81;

  /* Semantic colors */
  --color-success: #10B981;
  --color-success-bg: #ECFDF5;
  --color-warning: #F59E0B;
  --color-warning-bg: #FFFBEB;
  --color-danger: #EF4444;
  --color-danger-bg: #FEF2F2;
  --color-info: #3B82F6;
  --color-info-bg: #EFF6FF;

  /* Sidebar */
  --sidebar-bg: #FFFFFF;
  --sidebar-border: #E4E7EF;
  --sidebar-item-hover: #F1F3F9;
  --sidebar-item-active-bg: #EEF2FF;
  --sidebar-item-active-text: #4F46E5;
  --sidebar-item-active-icon: #4F46E5;
  --sidebar-item-text: #475569;
  --sidebar-item-icon: #94A3B8;
  --sidebar-width: 240px;
  --sidebar-collapsed-width: 64px;

  /* Right sidebar */
  --right-sidebar-bg: #FFFFFF;
  --right-sidebar-border: #E4E7EF;
  --right-sidebar-width: 320px;

  /* Topbar */
  --topbar-bg: #FFFFFF;
  --topbar-border: #E4E7EF;
  --topbar-height: 60px;

  /* Spacing Scale */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.10), 0 8px 10px -6px rgba(0,0,0,0.05);

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  --text-xs: 11px;
  --text-sm: 13px;
  --text-base: 14px;
  --text-md: 15px;
  --text-lg: 18px;
  --text-xl: 22px;
  --text-2xl: 28px;
  --text-3xl: 36px;

  /* Z-index scale */
  --z-sidebar: 40;
  --z-topbar: 50;
  --z-dropdown: 60;
  --z-modal: 70;
  --z-toast: 80;
  --z-tooltip: 90;

  /* Transitions */
  --transition-fast: 100ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;
}
```

### 5.2 Typography Scale

Font: **Inter** (Google Fonts). Load in `index.html`.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

| Token | Size | Weight | Use Case |
|-------|------|--------|----------|
| `--text-xs` | 11px | 500 | Badges, labels, meta |
| `--text-sm` | 13px | 400/500 | Table cells, secondary text |
| `--text-base` | 14px | 400 | Body text, descriptions |
| `--text-md` | 15px | 500 | Card titles, nav items |
| `--text-lg` | 18px | 600 | Section headings |
| `--text-xl` | 22px | 700 | Page headings |
| `--text-2xl` | 28px | 700 | Dashboard stats |
| `--text-3xl` | 36px | 800 | Hero numbers |

### 5.3 Tailwind Config Alignment

`tailwind.config.js` must be wired to CSS variables so Tailwind classes use the token system:

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Background
        'bg-base': 'var(--bg-base)',
        'bg-surface': 'var(--bg-surface)',
        'bg-subtle': 'var(--bg-subtle)',
        // Brand
        'brand': {
          50: 'var(--brand-50)',
          100: 'var(--brand-100)',
          500: 'var(--brand-500)',
          600: 'var(--brand-600)',
          700: 'var(--brand-700)',
        },
        // Text
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        // Borders
        'border-default': 'var(--border-default)',
        'border-strong': 'var(--border-strong)',
        // Semantic
        'success': 'var(--color-success)',
        'warning': 'var(--color-warning)',
        'danger': 'var(--color-danger)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
      },
      transitionDuration: {
        'fast': '100ms',
        'base': '200ms',
        'slow': '300ms',
      },
      width: {
        'sidebar': 'var(--sidebar-width)',
        'sidebar-collapsed': 'var(--sidebar-collapsed-width)',
        'right-sidebar': 'var(--right-sidebar-width)',
      },
      height: {
        'topbar': 'var(--topbar-height)',
      },
    },
  },
  plugins: [],
};
```

---

## 6. Theme System — Light · Dark · Brand

### 6.1 Theme Definitions

All 4 themes are defined in `tokens.css`. The `data-theme` attribute on `<html>` controls which theme is active.

```css
/* tokens.css continued */

/* ─── DARK THEME ─── */
[data-theme="dark"] {
  --bg-base: #0D1117;
  --bg-surface: #161B22;
  --bg-elevated: #1C2128;
  --bg-subtle: #21262D;
  --bg-overlay: rgba(0,0,0,0.70);

  --border-default: #30363D;
  --border-strong: #484F58;
  --border-focus: #818CF8;

  --text-primary: #E6EDF3;
  --text-secondary: #8B949E;
  --text-tertiary: #6E7681;
  --text-inverse: #0D1117;
  --text-link: #818CF8;

  --brand-50: #1E1B4B;
  --brand-100: #2D2A6E;
  --brand-200: #3730A3;
  --brand-500: #818CF8;
  --brand-600: #6366F1;
  --brand-700: #4F46E5;
  --brand-900: #C7D2FE;

  --color-success: #3FB950;
  --color-success-bg: #0D2119;
  --color-warning: #D29922;
  --color-warning-bg: #272115;
  --color-danger: #F85149;
  --color-danger-bg: #271016;
  --color-info: #58A6FF;
  --color-info-bg: #0D2138;

  --sidebar-bg: #161B22;
  --sidebar-border: #30363D;
  --sidebar-item-hover: #21262D;
  --sidebar-item-active-bg: #1E1B4B;
  --sidebar-item-active-text: #818CF8;
  --sidebar-item-active-icon: #818CF8;
  --sidebar-item-text: #8B949E;
  --sidebar-item-icon: #6E7681;

  --right-sidebar-bg: #161B22;
  --right-sidebar-border: #30363D;

  --topbar-bg: #161B22;
  --topbar-border: #30363D;

  --shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.3);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.4);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.4);
  --shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.5);
}

/* ─── VIOLET THEME (Premium SaaS look) ─── */
[data-theme="violet"] {
  --bg-base: #F5F3FF;
  --bg-surface: #FFFFFF;
  --bg-elevated: #FFFFFF;
  --bg-subtle: #EDE9FE;
  --bg-overlay: rgba(46,16,101,0.4);

  --border-default: #DDD6FE;
  --border-strong: #C4B5FD;
  --border-focus: #7C3AED;

  --text-primary: #1E1B4B;
  --text-secondary: #4C1D95;
  --text-tertiary: #7C3AED;
  --text-inverse: #FFFFFF;
  --text-link: #7C3AED;

  --brand-50: #EDE9FE;
  --brand-100: #DDD6FE;
  --brand-200: #C4B5FD;
  --brand-500: #7C3AED;
  --brand-600: #6D28D9;
  --brand-700: #5B21B6;
  --brand-900: #2E1065;

  --sidebar-bg: #2E1065;
  --sidebar-border: #4C1D95;
  --sidebar-item-hover: #4C1D95;
  --sidebar-item-active-bg: #7C3AED;
  --sidebar-item-active-text: #FFFFFF;
  --sidebar-item-active-icon: #FFFFFF;
  --sidebar-item-text: #C4B5FD;
  --sidebar-item-icon: #A78BFA;

  --right-sidebar-bg: #FFFFFF;
  --right-sidebar-border: #DDD6FE;
  --topbar-bg: #FFFFFF;
  --topbar-border: #DDD6FE;

  /* semantic colors stay the same in violet */
  --color-success: #059669;
  --color-success-bg: #ECFDF5;
  --color-warning: #D97706;
  --color-warning-bg: #FFFBEB;
  --color-danger: #DC2626;
  --color-danger-bg: #FEF2F2;
  --color-info: #2563EB;
  --color-info-bg: #EFF6FF;
}

/* ─── SLATE THEME (Corporate/Minimal) ─── */
[data-theme="slate"] {
  --bg-base: #F0F2F5;
  --bg-surface: #FFFFFF;
  --bg-elevated: #FFFFFF;
  --bg-subtle: #E2E8F0;
  --bg-overlay: rgba(15,23,42,0.5);

  --border-default: #CBD5E1;
  --border-strong: #94A3B8;
  --border-focus: #334155;

  --text-primary: #0F172A;
  --text-secondary: #334155;
  --text-tertiary: #64748B;
  --text-inverse: #FFFFFF;
  --text-link: #334155;

  --brand-50: #F1F5F9;
  --brand-100: #E2E8F0;
  --brand-200: #CBD5E1;
  --brand-500: #475569;
  --brand-600: #334155;
  --brand-700: #1E293B;
  --brand-900: #0F172A;

  --sidebar-bg: #1E293B;
  --sidebar-border: #334155;
  --sidebar-item-hover: #334155;
  --sidebar-item-active-bg: #475569;
  --sidebar-item-active-text: #FFFFFF;
  --sidebar-item-active-icon: #FFFFFF;
  --sidebar-item-text: #94A3B8;
  --sidebar-item-icon: #64748B;

  --right-sidebar-bg: #FFFFFF;
  --right-sidebar-border: #CBD5E1;
  --topbar-bg: #FFFFFF;
  --topbar-border: #E2E8F0;

  --color-success: #16A34A;
  --color-success-bg: #F0FDF4;
  --color-warning: #CA8A04;
  --color-warning-bg: #FEFCE8;
  --color-danger: #DC2626;
  --color-danger-bg: #FEF2F2;
  --color-info: #2563EB;
  --color-info-bg: #EFF6FF;
}
```

### 6.2 Theme Manager Hook

**Location**: `frontend/src/hooks/useTheme.js`

```javascript
// useTheme.js — manages theme application to <html> element
import { useState, useEffect } from 'react';

const THEMES = ['light', 'dark', 'violet', 'slate'];
const STORAGE_KEY = 'karbexa_theme';

export const useTheme = () => {
  const [theme, setTheme] = useState(
    () => localStorage.getItem(STORAGE_KEY) || 'light'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = (newTheme) => {
    if (THEMES.includes(newTheme)) setTheme(newTheme);
  };

  return { theme, toggleTheme, themes: THEMES };
};
```

### 6.3 Theme Switcher Component

**Location**: `frontend/src/components/ui/ThemeSwitcher.jsx`

Renders 4 colored circles in the Settings dropdown or right sidebar. Clicking applies the theme immediately. Uses `useTheme()` hook.

---

## 7. Layout Architecture — Locked Shell

This is the PERMANENT layout structure. Do not change this shell when building any feature.

### 7.1 Layout Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│  TOPBAR  (h: 60px, bg: var(--topbar-bg), border-bottom)             │
│  [Logo] [Breadcrumb]              [Search] [Notif] [Avatar]         │
└──────────────────────────────────────────────────────────────────────┘
┌─────────────┬──────────────────────────────────┬────────────────────┐
│  LEFT       │                                  │   RIGHT            │
│  SIDEBAR    │        MAIN CONTENT              │   SIDEBAR          │
│  240px      │        (flex-1, overflow-y-auto) │   320px            │
│  (fixed)    │                                  │   (fixed)          │
│             │  ┌──────────────────────────┐   │   [conditional]    │
│  [Nav items]│  │  PAGE HEADER             │   │                    │
│             │  │  Title + Actions         │   │   Only shown on    │
│             │  └──────────────────────────┘   │   detail views,    │
│             │                                  │   dashboards, and  │
│             │  [PAGE CONTENT]                  │   when user opens  │
│             │                                  │   right panel      │
│             │                                  │                    │
│  [User]     │                                  │                    │
│  [Settings] │                                  │                    │
└─────────────┴──────────────────────────────────┴────────────────────┘
```

### 7.2 AppLayout Component

**Location**: `frontend/src/layout/AppLayout.jsx`

```jsx
// AppLayout.jsx — NEVER MODIFY THIS SHELL STRUCTURE
// Only modify the children rendering logic inside main

const AppLayout = () => {
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { theme } = useTheme();

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{ background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}
    >
      {/* TOPBAR — always full width */}
      <Topbar
        onToggleSidebar={() => setSidebarCollapsed(c => !c)}
        onToggleRightSidebar={() => setRightSidebarOpen(o => !o)}
      />

      {/* BODY: sidebar + main + right sidebar */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT SIDEBAR */}
        <LeftSidebar collapsed={sidebarCollapsed} />

        {/* MAIN CONTENT */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ background: 'var(--bg-base)' }}
        >
          <Outlet /> {/* React Router v7 outlet */}
        </main>

        {/* RIGHT SIDEBAR (conditional) */}
        {rightSidebarOpen && <RightSidebar onClose={() => setRightSidebarOpen(false)} />}
      </div>
    </div>
  );
};
```

### 7.3 Left Sidebar Specification

**Location**: `frontend/src/components/layout/LeftSidebar.jsx`

**Behavior**:
- Fixed, 240px wide. Collapses to 64px (icons only) on toggle.
- Active route highlighted with `--sidebar-item-active-bg`.
- Grouped sections with separator labels (People, Projects, Admin).
- User avatar and name at the bottom with logout option.
- Transition: `width var(--transition-slow)` on collapse.

**Navigation Structure**:
```
─────────────────────
  🏠  Dashboard
─────────────────────
  PEOPLE
  👥  Users
  🏢  Departments
  📅  Attendance
  ⏱️  Time Tracker
  📋  Timesheets
  🌿  Leave
  💰  Expenses
  🎉  Holidays
─────────────────────
  PROJECTS
  📁  Projects
  ✅  My Tasks
─────────────────────
  SUPPORT
  🎫  Tickets
  📂  Files
─────────────────────
  ADMIN (role-gated)
  📊  Dashboard
  👤  User Management
  🏗️  Org Chart
  📝  Activity Logs
─────────────────────
  [Avatar] Name
  [Settings] [Logout]
─────────────────────
```

### 7.4 Topbar Specification

**Location**: `frontend/src/components/layout/Topbar.jsx`

**Elements (left to right)**:
- Hamburger icon → toggles sidebar collapse
- Logo (compact, just icon when sidebar is collapsed)
- Breadcrumb (auto-generated from current route)
- **SPACER** (flex-1)
- Global search bar (cmd+K shortcut)
- Notification bell (SSE-powered badge)
- User avatar dropdown → Profile, Settings, Theme Switcher, Logout

**Height**: `var(--topbar-height)` = 60px, fixed.

### 7.5 Page Content Standard

Every page inside `<main>` follows this structure:

```jsx
// Standard Page Wrapper
<div className="p-6 space-y-6">
  {/* PAGE HEADER */}
  <PageHeader
    title="Leave Management"
    subtitle="Manage team leave requests and balances"
    actions={<Button onClick={openModal}>Request Leave</Button>}
  />

  {/* CONTENT SECTION(S) */}
  <div className="bg-bg-surface rounded-lg border border-border-default shadow-sm">
    {/* table, cards, etc. */}
  </div>
</div>
```

**`PageHeader`** is a shared component. It always renders the same way. Never custom-build page headers per page.

---

## 8. Reusable Component Library

### 8.1 Component Inventory

**Location**: `frontend/src/components/ui/`

All components below MUST be built as the first phase before any page is revamped. This library is the single source for all UI primitives.

> ⚠️ **LLM RULE**: When building any feature page, check this list first. If a component exists here, USE IT. Do not rebuild it inline.

#### 8.1.1 Layout Components

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| `PageHeader` | `PageHeader.jsx` | `title, subtitle?, actions?, breadcrumb?` | Standard page top section |
| `PageSection` | `PageSection.jsx` | `title?, children, className?` | Card wrapper for page content sections |
| `EmptyState` | `EmptyState.jsx` | `icon, title, description, action?` | Empty list/table state |
| `ErrorState` | `ErrorState.jsx` | `title?, description?, onRetry?` | Failed data load state |
| `LoadingState` | `LoadingState.jsx` | `rows?, type?` | Skeleton loader variants |

#### 8.1.2 Form Components

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| `Input` | `Input.jsx` | `label, error?, hint?, prefix?, suffix?, ...inputProps` | Text, email, number, password inputs |
| `Textarea` | `Textarea.jsx` | `label, error?, hint?, rows?, ...textareaProps` | Multi-line text |
| `Select` | `Select.jsx` | `label, options, error?, placeholder?, ...selectProps` | Native select (accessible) |
| `DatePicker` | `DatePicker.jsx` | `label, value, onChange, error?, minDate?, maxDate?` | Single date |
| `DateRangePicker` | `DateRangePicker.jsx` | `label, startDate, endDate, onChange, error?` | Date range |
| `Checkbox` | `Checkbox.jsx` | `label, checked, onChange, error?` | Single checkbox |
| `RadioGroup` | `RadioGroup.jsx` | `label, options, value, onChange, error?` | Radio buttons |
| `Toggle` | `Toggle.jsx` | `label?, checked, onChange, size?` | On/off toggle |
| `FileUpload` | `FileUpload.jsx` | `label, accept, onFile, multiple?, maxSize?` | Drag and drop + click |
| `SearchInput` | `SearchInput.jsx` | `placeholder, value, onChange, onClear?` | With clear button and icon |
| `FormGroup` | `FormGroup.jsx` | `children, columns?` | Form layout with grid |

#### 8.1.3 Button Components

| Component | Variants | Props | Description |
|-----------|----------|-------|-------------|
| `Button` | `primary, secondary, ghost, danger, success` | `variant, size(sm/md/lg), loading?, leftIcon?, rightIcon?, disabled?` | Main CTA button |
| `IconButton` | `ghost, subtle, outline` | `icon, variant, size, label(aria), tooltip?` | Icon-only button |
| `ButtonGroup` | - | `children` | Groups related buttons |

**Button Styling Rules**:
```
primary   → bg: var(--brand-600), text: white, hover: var(--brand-700)
secondary → bg: transparent, border: var(--border-default), text: var(--text-primary)
ghost     → bg: transparent, text: var(--text-secondary), hover bg: var(--bg-subtle)
danger    → bg: var(--color-danger), text: white
success   → bg: var(--color-success), text: white
```

#### 8.1.4 Feedback Components

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| `Badge` | `Badge.jsx` | `label, variant(success/warning/danger/info/default), size?` | Status pills |
| `StatusBadge` | `StatusBadge.jsx` | `status` | Maps domain statuses to badge colors |
| `Avatar` | `Avatar.jsx` | `src?, name, size(sm/md/lg/xl), online?` | User avatar with initials fallback |
| `AvatarGroup` | `AvatarGroup.jsx` | `users, max?` | Stacked avatars with +N overflow |
| `Tooltip` | `Tooltip.jsx` | `content, children, placement?` | Hover tooltips |
| `Toast` | managed by `useToast` | - | Notification toasts via hook |
| `Alert` | `Alert.jsx` | `variant, title?, children, onClose?` | Inline alert banners |
| `Spinner` | `Spinner.jsx` | `size(sm/md/lg), color?` | Loading spinner |
| `ProgressBar` | `ProgressBar.jsx` | `value(0-100), color?, label?` | Horizontal progress |
| `Skeleton` | `Skeleton.jsx` | `width?, height?, rounded?, className?` | Loading skeleton block |

#### 8.1.5 Data Display Components

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| `DataTable` | `DataTable.jsx` | `columns, data, loading?, empty?, pagination?, onRowClick?, sortable?` | THE standard table |
| `StatCard` | `StatCard.jsx` | `title, value, trend?, icon?, color?` | Dashboard metric card |
| `KVPair` | `KVPair.jsx` | `label, value, vertical?` | Label + value display |
| `DetailPanel` | `DetailPanel.jsx` | `sections[]` | Structured detail view |
| `Timeline` | `Timeline.jsx` | `events[]` | Activity timeline |

#### 8.1.6 Overlay Components

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| `Modal` | `Modal.jsx` | `open, onClose, title, children, footer?, size(sm/md/lg/xl)?` | THE standard modal |
| `Drawer` | `Drawer.jsx` | `open, onClose, title, children, side(left/right), size?` | Slide-in panel |
| `ConfirmDialog` | `ConfirmDialog.jsx` | `open, onClose, onConfirm, title, message, variant?, loading?` | Destructive action confirmation |
| `Dropdown` | `Dropdown.jsx` | `trigger, items[], align(left/right)?` | Context menus and dropdowns |
| `Popover` | `Popover.jsx` | `trigger, children, placement?` | Rich content popover |

#### 8.1.7 Navigation Components

| Component | File | Props | Description |
|-----------|------|-------|-------------|
| `Tabs` | `Tabs.jsx` | `tabs[], activeTab, onChange, variant(line/pill)?` | Tab navigation |
| `Breadcrumb` | `Breadcrumb.jsx` | `items[]` | Path breadcrumb |
| `Pagination` | `Pagination.jsx` | `total, page, limit, onChange` | Table pagination |
| `Steps` | `Steps.jsx` | `steps[], currentStep` | Multi-step wizard progress |

### 8.2 DataTable Specification

The `DataTable` component is the most important. It replaces ALL custom tables in the app.

**Column Definition**:
```javascript
const columns = [
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    render: (value, row) => (
      <div className="flex items-center gap-2">
        <Avatar name={row.name} size="sm" />
        <span>{value}</span>
      </div>
    )
  },
  {
    key: 'status',
    header: 'Status',
    render: (value) => <StatusBadge status={value} />
  },
  {
    key: 'actions',
    header: '',
    width: '80px',
    render: (_, row) => (
      <Dropdown
        trigger={<IconButton icon={MoreHorizontal} label="Actions" />}
        items={[
          { label: 'Edit', icon: Pencil, onClick: () => onEdit(row) },
          { label: 'Delete', icon: Trash, onClick: () => onDelete(row), danger: true },
        ]}
      />
    )
  }
];
```

**Usage**:
```jsx
<DataTable
  columns={columns}
  data={users}
  loading={isLoading}
  empty={<EmptyState icon={Users} title="No users found" description="Add your first user to get started" action={<Button onClick={openModal}>Add User</Button>} />}
  pagination={{ total: 100, page: 1, limit: 10, onChange: setPage }}
  onRowClick={(row) => navigate(`/users/${row._id}`)}
/>
```

### 8.3 Modal Specification

The `Modal` component replaces ALL custom modals. There is exactly ONE modal implementation.

```jsx
// Usage
<Modal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Add Holiday"
  size="md"  // sm=400px, md=560px, lg=720px, xl=900px
  footer={
    <>
      <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button onClick={handleSubmit} loading={submitting}>Save Holiday</Button>
    </>
  }
>
  {/* form content */}
</Modal>
```

**Modal Behavior**:
- ESC key closes
- Click outside closes (unless `persistent` prop set)
- Body scroll locked when open
- Focus trapped inside
- Animate: fade-in + scale-in (`--transition-base`)

### 8.4 Toast System

Replace all `react-toastify` usages with a centralized hook.

**Location**: `frontend/src/hooks/useToast.js` + `frontend/src/components/ui/ToastContainer.jsx`

```javascript
// Hook usage in components
const { toast } = useToast();

toast.success('Holiday added successfully');
toast.error('Failed to save. Please try again.');
toast.info('Sync in progress...');
toast.warning('Leave balance is low');
```

**Toast position**: Bottom-right, max 3 visible at once, auto-dismiss in 4 seconds.

---

## 9. Module Revamp Plan — Phase by Phase

> **CRITICAL FOR LLMs**: Each phase is self-contained. Complete Phase 1 fully before touching Phase 2. Each module section tells you EXACTLY what to build, what to delete, and what API changes are needed.

---

### ◼ PHASE 0: Foundation (Do This First — Blocks Everything Else)

**Goal**: Set up the design system, component library, and layout shell. No feature work yet.

**Duration estimate**: 3–5 days

#### Step 0.1 — Install Dependencies

Remove:
```bash
npm uninstall react-toastify antd @ant-design/icons @material-tailwind/react moment
```

Install:
```bash
npm install date-fns class-variance-authority clsx tailwind-merge
```

Keep:
- `@mui/material`, `@mui/icons-material` — only for specific complex components
- `lucide-react` — primary icon library
- `framer-motion` — for animations
- `recharts` — for charts

#### Step 0.2 — Create Token File

Create `frontend/src/styles/tokens.css` with ALL theme definitions from Section 5.1 and 6.1.

Import in `frontend/src/main.jsx`:
```javascript
import './styles/tokens.css';
import './index.css';
```

#### Step 0.3 — Update Tailwind Config

Replace `tailwind.config.js` with the version from Section 5.3.

#### Step 0.4 — Build Component Library

Build ALL components listed in Section 8.1 in order:
1. Primitives first: `Spinner`, `Skeleton`, `Badge`, `Avatar`, `Tooltip`
2. Inputs: `Input`, `Select`, `Textarea`, `DatePicker`, `FileUpload`, `Toggle`, `SearchInput`
3. Buttons: `Button`, `IconButton`, `ButtonGroup`
4. Overlays: `Modal`, `Drawer`, `ConfirmDialog`, `Dropdown`
5. Feedback: `Alert`, `Toast system`, `EmptyState`, `ErrorState`, `LoadingState`
6. Data: `DataTable`, `StatCard`, `Pagination`
7. Navigation: `Tabs`, `Breadcrumb`, `Steps`
8. Layout: `PageHeader`, `PageSection`, `FormGroup`

#### Step 0.5 — Build Layout Shell

1. Build `Topbar.jsx`
2. Build `LeftSidebar.jsx` with all nav items
3. Build `RightSidebar.jsx` (empty shell, context fills it)
4. Update `AppLayout.jsx` with the structure from Section 7.2
5. Implement `useTheme.js` hook
6. Add `ThemeSwitcher` to topbar user dropdown

#### Step 0.6 — Backend Foundation

1. Create `backend/middlewares/companyScope.js`
2. Apply `companyScope` middleware to ALL routes in `webRoutesMount.js`
3. Update base URL from `/api/web` to `/api/v1`
4. Update `frontend/src/axios.js` base URL
5. Add company index to ALL models that lack it
6. Install and configure rate limiting:
   ```bash
   npm install express-rate-limit helmet
   ```
7. Add to `backend/index.js`:
   ```javascript
   const helmet = require('helmet');
   const rateLimit = require('express-rate-limit');
   app.use(helmet());
   const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 20 });
   app.use('/api/v1/auth', authLimiter);
   ```

**Phase 0 is DONE when**: App runs with new layout, 4 themes switchable, and all UI primitives are in `components/ui/`. No feature pages changed yet.

---

### ◼ PHASE 1: Authentication & Onboarding

**Goal**: Clean, secure login flow + company onboarding for SaaS.

#### Frontend Pages to Revamp

| Page | File | Changes |
|------|------|---------|
| Login | `Pages/login/Login.jsx` | Full redesign with new components |
| Forgot Password | `Pages/login/ForgotPass.jsx` | Use new Input, Button |
| Reset Password | `Pages/login/Resetpassword.jsx` | Use new Input, Button |
| Verify OTP | `Pages/login/VerifyOtp.jsx` | Use new Input (OTP style), Button |
| **NEW** Company Registration | `Pages/onboarding/RegisterCompany.jsx` | Multi-step form for new SaaS tenants |

#### Login Page Design Spec

```
Layout: Split screen — left 45% brand panel, right 55% form panel

LEFT PANEL (brand):
  bg: var(--brand-600) or gradient (brand-600 → brand-700)
  - Karbexa logo + tagline
  - 3 feature bullets with icons
  - Background geometric pattern (SVG, subtle)

RIGHT PANEL (form):
  bg: var(--bg-surface)
  - "Welcome back" heading (--text-2xl, --text-primary)
  - "Sign in to your workspace" subtitle (--text-sm, --text-secondary)
  - [Input] Email address
  - [Input] Password (with show/hide toggle)
  - [Checkbox] Remember me + [Link] Forgot password?
  - [Button primary full-width] Sign In
  - Divider "or"
  - [Button secondary full-width with Azure icon] Continue with Microsoft
  - "New company? Register here" link

Mobile: Single column, brand panel becomes logo-only strip at top
```

#### Backend Changes for Auth

1. Add rate limiting (done in Phase 0)
2. Add `companyId` to JWT payload if not present:
   ```javascript
   // token.js
   const payload = {
     userId: user._id,
     email: user.email,
     role: user.role,
     company: user.company,  // ← ensure this is here
   };
   ```
3. Add `POST /api/v1/auth/register-company` endpoint for SaaS signup

#### New: Company Registration Flow

Multi-step wizard using `Steps` component:
```
Step 1: Company Details   → name, industry, size, website
Step 2: Admin Account     → firstName, lastName, email, password
Step 3: Verify Email      → OTP sent to email
Step 4: Done              → redirect to dashboard
```

---

### ◼ PHASE 2: Dashboard

**Goal**: Role-aware dashboard with real metrics, skeleton loading, and themed stat cards.

#### Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│ PageHeader: "Good morning, [Name] 👋" + date            │
├────────────────┬───────────────┬────────────────────────┤
│ StatCard       │ StatCard      │ StatCard               │
│ Total Users    │ Open Tasks    │ Pending Leaves         │
├────────────────┴───────────────┴────────────────────────┤
│ ┌──────────────────────────┐  ┌────────────────────┐   │
│ │ Recent Activity Feed     │  │ My Tasks Today     │   │
│ │ (Timeline component)     │  │ (Task list)        │   │
│ └──────────────────────────┘  └────────────────────┘   │
├────────────────────────────────────────────────────────-┤
│ ┌──────────────────────────┐  ┌────────────────────┐   │
│ │ Team Attendance Today    │  │ Upcoming Holidays  │   │
│ │ (Avatar group + count)   │  │ (List)             │   │
│ └──────────────────────────┘  └────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

#### Admin Dashboard (separate route, role-gated)

```
Row 1: [Total Employees] [Active Projects] [Pending Approvals] [Open Tickets]
Row 2: [Bar chart: Attendance this week] [Donut: Task status distribution]
Row 3: [Leave requests pending approval] [Recent activity log]
```

#### Component Changes

- **Delete**: All files in `Components/home/` — replace with revamped versions
- **Delete**: `AdminDashboardStatCard.jsx` — use new `StatCard` from ui library
- **Build**: `pages/Dashboard/UserDashboard.jsx`
- **Build**: `pages/Dashboard/AdminDashboard.jsx`
- **Keep**: `ProjectDashboardCards/` — will be revamped in Phase 4

#### Backend Changes

All dashboard endpoints must scope by `req.companyId`. Audit `adminDashboardController.js` and ensure every query includes `company: req.companyId`.

---

### ◼ PHASE 3: User Management

**Goal**: Clean user list, detail view, invite flow, role management.

#### Pages

| Page | Route | Description |
|------|-------|-------------|
| `UserList` | `/admin/users` | Table of all users with filters |
| `UserDetail` | `/admin/users/:id` | Full profile view with tabs |
| `EditUser` | modal inside UserDetail | Edit user form |
| `InviteUser` | modal on UserList | Invite by email with role selection |

#### UserList Page Layout

```
PageHeader: "User Management" | [Export] [+ Invite User]

FilterBar:
  [SearchInput: Search by name/email]
  [Select: Role filter]
  [Select: Department filter]
  [Select: Status (Active/Inactive)]

DataTable:
  Columns: Avatar+Name, Email, Role(Badge), Department, Status(Badge), Last Active, Actions
  Row click → navigate to UserDetail
  Actions dropdown → Edit, Deactivate, Delete (with ConfirmDialog)
```

#### UserDetail Page Layout (Right-sidebar aware)

```
Split view when right sidebar is open:
  Main: Profile header (avatar, name, role, status) + Tabs
  Right sidebar: Quick stats (tasks assigned, hours logged, leaves taken)

Tabs:
  Overview    → KV pairs: department, manager, phone, join date, etc.
  Projects    → DataTable of assigned projects
  Tasks       → DataTable of assigned tasks
  Time Logs   → DataTable of recent time entries
  Leave       → Leave history + balance
  Activity    → Timeline of actions
```

#### Backend Changes

1. Ensure `GET /api/v1/users` filters by `company: req.companyId`
2. Add query params support: `?role=&department=&status=&search=&page=&limit=`
3. Add `GET /api/v1/users/:id/summary` → returns task count, leave count, hours logged
4. Validate file uploads in update-profile-image: only `image/jpeg, image/png, image/webp`, max 5MB

---

### ◼ PHASE 4: Project & Task Management

**Goal**: Kanban board, list view, task detail drawer, project dashboard.

#### Pages

| Page | Route | Description |
|------|-------|-------------|
| `ProjectList` | `/projects` | Grid of project cards with status filter |
| `ProjectDetail` | `/projects/:id` | Tabs: Overview, Board, Tasks, Files, Team |
| `MyTasks` | `/my-tasks` | Personal task list with priority/status filter |

#### ProjectList Layout

```
PageHeader: "Projects" | [View toggle: Grid/List] [+ New Project]

FilterBar: [Search] [Status filter] [My projects toggle]

Grid view: 3-column grid of ProjectCard
  Card: Name, status badge, progress bar, team avatars, due date, task count

List view: DataTable with same fields
```

#### ProjectDetail Layout

```
Project Header (sticky):
  [Back] Project Name | Status Badge | [Edit] [Archive]
  Progress bar | Start date → End date | Budget indicator

Tabs:
  Overview  → Description, team, manager, files summary, recent activity
  Board     → Kanban (Todo / In Progress / Review / Done columns)
  Tasks     → DataTable of all tasks with filters
  Files     → File grid/list
  Team      → Member list with roles

Right Sidebar (when task is selected):
  TaskDetailPanel → title, description, assignee, priority, due date, subtasks, comments
```

#### Kanban Board Spec

```
4 columns: Todo | In Progress | In Review | Done
Each card:
  - Task title (bold)
  - Priority badge (Low/Med/High/Critical)
  - Assignee avatar
  - Due date (red if overdue)
  - Comment count icon
  - Attachment count icon

Drag and drop: react-beautiful-dnd or @hello-pangea/dnd
  On drop: PATCH /api/v1/tasks/:id with {status: newStatus}

Add task: (+) at bottom of each column → opens inline mini-form
```

#### Backend Changes

1. Add `GET /api/v1/projects?status=&search=&myProjects=true` with company scope
2. Add `GET /api/v1/tasks?project=&status=&priority=&assignee=&page=&limit=` 
3. Add `PATCH /api/v1/tasks/:id/status` → only updates status field (lightweight)
4. Ensure all task and project queries include `company: req.companyId`

---

### ◼ PHASE 5: Time Tracking & Timesheets

**Goal**: Clean time log form, calendar view, admin approval workflow.

#### Pages

| Page | Route | Description |
|------|-------|-------------|
| `TimeTracker` | `/time/tracker` | Daily clock-in/out + log entries |
| `Timesheets` | `/time/timesheets` | Weekly timesheet with submission |
| `AdminTimesheets` | `/admin/timesheets` | Review and approve team timesheets |

#### TimeTracker Page Layout

```
PageHeader: "Time Tracker" | Today's date

Top section:
  [Attendance Clock Card] — Clock in/out button, timer running
  [Today's Summary] — hours worked, break time

Weekly view:
  7-day strip showing each day's total hours (bar chart or colored blocks)
  Click a day → shows that day's log entries in a list below

Log Entries list (for selected day):
  DataTable: Project | Task | Start time | End time | Duration | Note | Actions
  [+ Add Time Log] button → opens Modal with form

Modal: Add/Edit Time Log
  [DatePicker] Date
  [Select] Project
  [Select] Task (filtered by project)
  [TimePicker] Start time
  [TimePicker] End time (auto-calculates duration)
  [Textarea] Description
```

#### Timesheets Page Layout

```
PageHeader: "My Timesheets" | [Week selector: ← Week ←]

Timesheet Grid:
  Rows: Projects/Tasks
  Columns: Mon Tue Wed Thu Fri Sat Sun | Total
  Cell: editable hour input
  Footer: daily totals + weekly grand total

Status bar: Draft / Submitted / Approved / Rejected
Action: [Save Draft] [Submit for Approval]
```

---

### ◼ PHASE 6: Leave Management

**Goal**: Employee request flow, manager approval, admin overview, leave balance.

#### Pages

| Page | Route | Description |
|------|-------|-------------|
| `LeaveRequest` | `/leave/request` | Employee's own leave history + request button |
| `LeaveApprovals` | `/leave/approvals` | Manager view: pending approvals |
| `LeaveAdmin` | `/admin/leave` | Admin: all leaves, bulk approve, stats |

#### LeaveRequest Page Layout

```
PageHeader: "Leave" | [+ Request Leave]

Balance Cards Row:
  [Annual Leave: 15/20 days] [Sick Leave: 5/10 days] [Unpaid: unlimited]
  Each card shows used/total with a mini progress bar

Tabs:
  My Leaves  → DataTable of my leave history (status badge, dates, type, reason)
  Calendar   → Monthly calendar view showing leave days highlighted
  Team       → Who else is on leave this month (avatar list by date)

Request Leave Modal:
  [Select] Leave type
  [DateRangePicker] Start → End date
  [Input: disabled] Duration (auto-calculated, excludes weekends + holidays)
  [Textarea] Reason
  [FileUpload] Attachment (optional, for sick leave)
```

#### Approval Flow Spec

```
Manager receives:
  - SSE notification
  - Email notification

Approval page:
  DataTable: Employee | Leave Type | Dates | Duration | Reason | Status | Actions
  Actions: [Approve] [Reject] → ConfirmDialog with optional comment
  Bulk action: select multiple → bulk approve/reject
```

---

### ◼ PHASE 7: Ticket Management

**Goal**: Support ticket system with priority queue, assignment, and response thread.

#### Pages

| Page | Route | Description |
|------|-------|-------------|
| `MyTickets` | `/tickets` | Employee: my raised tickets |
| `AdminTickets` | `/admin/tickets` | Admin/Support: all tickets queue |
| `TicketDetail` | `/tickets/:id` | Full ticket view with response thread |

#### TicketDetail Layout

```
Split view:
  Left (60%):
    Ticket title (large)
    Status badge | Priority badge | Category tag
    [Tabs] Details | Responses | Activity

    Details tab:
      Description (full text)
      Attachments

    Responses tab:
      Thread-style messages (like email thread)
      Each response: avatar, name, time, message text
      [Textarea] New response + [Send] button

  Right (40%) — inline panel (not right sidebar):
    Ticket meta:
      Created by: [Avatar] Name
      Assigned to: [Select dropdown to reassign]
      Priority: [Select to change]
      Status: [Button group: Open / In Progress / Resolved / Closed]
      Created: [date]
      Last updated: [date]
    
    Related tickets (same user or category)
```

---

### ◼ PHASE 8: Expenses

**Goal**: Employee expense filing with receipt upload, manager approval, reporting.

#### Pages

| Page | Route | Description |
|------|-------|-------------|
| `MyExpenses` | `/expenses` | Employee: file and track expenses |
| `AdminExpenses` | `/admin/expenses` | Admin: approve, reject, export |

#### MyExpenses Layout

```
PageHeader: "Expenses" | [+ File Expense]

Summary Row:
  [Pending: $240] [Approved this month: $1,250] [Rejected: $80]

DataTable:
  Date | Category | Description | Amount | Status(Badge) | Receipt | Actions

File Expense Modal:
  [Select] Category (Travel, Food, Equipment, Other)
  [Input] Amount + [Select] Currency
  [DatePicker] Date incurred
  [Textarea] Description
  [FileUpload] Receipt (image or PDF, required)
  [Input] Project code (optional)
```

---

### ◼ PHASE 9: Settings & Profile

**Goal**: User profile management, company settings, notification preferences.

#### Pages

| Page | Route | Description |
|------|-------|-------------|
| `Profile` | `/profile` | Edit own profile, change password, avatar |
| `CompanySettings` | `/settings/company` | Admin: company info, logo, plan |
| `NotificationSettings` | `/settings/notifications` | Email and in-app notification preferences |
| `AppearanceSettings` | `/settings/appearance` | Theme selector, density setting |

#### AppearanceSettings Layout

```
PageHeader: "Appearance"

Section: Theme
  4 theme swatches side by side with labels:
  [● Light] [● Dark] [● Violet] [● Slate]
  Selected has a checkmark ring

Section: Density (future)
  [Compact] [Default] [Comfortable]
  — affects padding in DataTable rows, sidebar items

Section: Font Size (future)
  [Small] [Medium] [Large]
```

---

## 10. Backend Standards & Security

### 10.1 Standard Controller Template

Every new or revamped controller follows this EXACT pattern. No exceptions.

```javascript
// backend/controllers/featureController.js
const Model = require('../models/featureSchema');
const { NotFoundError, BadRequestError } = require('../utils/ExpressError');

// LIST with pagination, search, company scope
exports.getAll = async (req, res) => {
  const { page = 1, limit = 20, search = '', status } = req.query;
  const skip = (page - 1) * limit;

  const filter = {
    company: req.companyId,  // ← ALWAYS
    ...(status && { status }),
    ...(search && {
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    })
  };

  const [data, total] = await Promise.all([
    Model.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
    Model.countDocuments(filter)
  ]);

  res.status(200).json({
    status: 'success',
    data,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit)
    }
  });
};

// GET ONE
exports.getOne = async (req, res) => {
  const item = await Model.findOne({ _id: req.params.id, company: req.companyId });
  if (!item) throw new NotFoundError('Item');
  res.status(200).json({ status: 'success', data: item });
};

// CREATE
exports.create = async (req, res) => {
  const item = await Model.create({ ...req.body, company: req.companyId });
  res.status(201).json({ status: 'success', data: item, message: 'Created successfully' });
};

// UPDATE
exports.update = async (req, res) => {
  const item = await Model.findOneAndUpdate(
    { _id: req.params.id, company: req.companyId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!item) throw new NotFoundError('Item');
  res.status(200).json({ status: 'success', data: item, message: 'Updated successfully' });
};

// DELETE
exports.delete = async (req, res) => {
  const item = await Model.findOneAndDelete({ _id: req.params.id, company: req.companyId });
  if (!item) throw new NotFoundError('Item');
  res.status(200).json({ status: 'success', message: 'Deleted successfully' });
};
```

### 10.2 Standard API Response Format

All API responses MUST follow one of these two shapes. No other shapes allowed.

**Success**:
```json
{
  "status": "success",
  "message": "Optional human-readable message",
  "data": { ... } | [ ... ],
  "pagination": { "total": 100, "page": 1, "limit": 20, "pages": 5 }
}
```

**Error** (handled by globalErrorHandler):
```json
{
  "status": "error",
  "message": "Human-readable error message",
  "statusCode": 400
}
```

### 10.3 File Upload Security

All file upload endpoints MUST use this validation:

```javascript
// middlewares/uploadMiddleware.js — update to include:
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const allowedDocTypes = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOC_SIZE = 10 * 1024 * 1024;  // 10MB

// fileFilter function must check mimetype
const fileFilter = (allowed) => (req, file, cb) => {
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError(`Invalid file type. Allowed: ${allowed.join(', ')}`), false);
  }
};
```

### 10.4 Environment Variables Standard

Backend `.env` additions for Phase 0:

```env
# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_AUTH=20
RATE_LIMIT_MAX_API=100

# Security
HELMET_ENABLED=true
CORS_MAX_AGE=86400

# API version
API_VERSION=v1
```

---

## 11. LLM Agent Operating Rules

> ⚠️ This section is specifically for AI coding agents. Read this before every task.

### 11.1 Before You Write Any Code

Run through this checklist mentally:
1. Have I read the relevant phase section in this PRD?
2. Does a UI component already exist in `components/ui/` that does what I need?
3. Am I using design tokens (CSS variables) for ALL colors, NOT hardcoded hex values or Tailwind `blue-600`?
4. Is my backend controller using `catchAsync` and `req.companyId`?
5. Am I calling the API through `src/api/featureApi.js`, NOT directly in the component?

### 11.2 Color Rules — Zero Exceptions

| ❌ NEVER DO THIS | ✅ DO THIS INSTEAD |
|-----------------|-------------------|
| `className="bg-blue-600"` | `style={{ background: 'var(--brand-600)' }}` or `className="bg-brand-600"` |
| `className="text-gray-700"` | `className="text-text-secondary"` |
| `className="border-gray-200"` | `className="border-border-default"` |
| `className="bg-white"` | `className="bg-bg-surface"` |
| `className="bg-gray-50"` | `className="bg-bg-subtle"` |
| `style={{ color: '#6366f1' }}` | `style={{ color: 'var(--brand-500)' }}` |

### 11.3 Component Rules

| ❌ NEVER DO THIS | ✅ DO THIS INSTEAD |
|-----------------|-------------------|
| Build a new modal with `fixed inset-0` | Use `<Modal>` from `components/ui/Modal.jsx` |
| Build a custom table with `<table>` | Use `<DataTable>` from `components/ui/DataTable.jsx` |
| Use `toast.success()` from react-toastify | Use `const {toast} = useToast()` then `toast.success()` |
| Use `<Spin>` from antd | Use `<Spinner>` from `components/ui/Spinner.jsx` |
| Use `DatePicker` from antd | Use `<DatePicker>` from `components/ui/DatePicker.jsx` |
| Build inline confirm logic | Use `<ConfirmDialog>` component |
| Build a page header in JSX inline | Use `<PageHeader>` component |
| Use `react-icons` or MUI icons | Use `lucide-react` icons only |

### 11.4 State Rules

| ❌ NEVER DO THIS | ✅ DO THIS INSTEAD |
|-----------------|-------------------|
| `const res = await api.get('/users')` inside a component | Create `src/api/usersApi.js` with a `getUsers()` function, import that |
| Store UI open/close state in Redux | `const [isOpen, setIsOpen] = useState(false)` |
| Store fetched list data in Redux when only one page uses it | `useState` + `useEffect` in the page component or a custom hook |
| Store auth token in component state | Auth token lives in `authSlice.js` only |

### 11.5 API Call Pattern

```javascript
// src/api/usersApi.js — The only place user API calls happen
import api from '../axios';

export const usersApi = {
  getAll: (params) => api.get('/users', { params }),
  getOne: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getSummary: (id) => api.get(`/users/${id}/summary`),
};
```

```jsx
// Usage in a page component
import { usersApi } from '../api/usersApi';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async (params) => {
    setLoading(true);
    try {
      const res = await usersApi.getAll(params);
      setUsers(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);
  // ...
};
```

### 11.6 What NOT to Touch

These files are SACRED — ask a human before modifying:
- `frontend/src/axios.js` — centralized API client
- `frontend/src/Store/index.js` — Redux store config
- `frontend/src/routeConfig.jsx` — routing (add routes, don't restructure)
- `frontend/src/styles/tokens.css` — only add new tokens, never delete or rename existing
- `backend/utils/catchAsync.js` — never change
- `backend/utils/ExpressError.js` — only add new error types
- `backend/middlewares/globalErrorHandler.js` — never change
- `backend/middlewares/authMiddleware.js` — never change auth logic without review

---

## 12. File & Folder Conventions

### 12.1 Frontend Structure (Final Target)

```
frontend/src/
├── api/                    # API service modules (one per domain)
│   ├── usersApi.js
│   ├── projectsApi.js
│   ├── tasksApi.js
│   ├── leavesApi.js
│   ├── timesheetApi.js
│   ├── ticketsApi.js
│   ├── expensesApi.js
│   └── dashboardApi.js
│
├── components/
│   ├── ui/                 # ← DESIGN SYSTEM PRIMITIVES (Section 8)
│   │   ├── Button.jsx
│   │   ├── IconButton.jsx
│   │   ├── Input.jsx
│   │   ├── Select.jsx
│   │   ├── Textarea.jsx
│   │   ├── DatePicker.jsx
│   │   ├── DateRangePicker.jsx
│   │   ├── Toggle.jsx
│   │   ├── Checkbox.jsx
│   │   ├── RadioGroup.jsx
│   │   ├── FileUpload.jsx
│   │   ├── SearchInput.jsx
│   │   ├── FormGroup.jsx
│   │   ├── Modal.jsx
│   │   ├── Drawer.jsx
│   │   ├── ConfirmDialog.jsx
│   │   ├── Dropdown.jsx
│   │   ├── Popover.jsx
│   │   ├── Tooltip.jsx
│   │   ├── Badge.jsx
│   │   ├── StatusBadge.jsx
│   │   ├── Avatar.jsx
│   │   ├── AvatarGroup.jsx
│   │   ├── Spinner.jsx
│   │   ├── Skeleton.jsx
│   │   ├── Alert.jsx
│   │   ├── EmptyState.jsx
│   │   ├── ErrorState.jsx
│   │   ├── LoadingState.jsx
│   │   ├── DataTable.jsx
│   │   ├── StatCard.jsx
│   │   ├── KVPair.jsx
│   │   ├── Timeline.jsx
│   │   ├── ProgressBar.jsx
│   │   ├── Pagination.jsx
│   │   ├── Tabs.jsx
│   │   ├── Breadcrumb.jsx
│   │   ├── Steps.jsx
│   │   ├── PageHeader.jsx
│   │   ├── PageSection.jsx
│   │   ├── ThemeSwitcher.jsx
│   │   └── index.js        # ← re-exports all ui components
│   │
│   ├── layout/             # App shell components
│   │   ├── AppLayout.jsx
│   │   ├── Topbar.jsx
│   │   ├── LeftSidebar.jsx
│   │   ├── RightSidebar.jsx
│   │   ├── AuthLayout.jsx
│   │   └── SidebarNavItem.jsx
│   │
│   └── shared/             # Domain-specific shared components
│       ├── UserAvatar.jsx         # Avatar with user data
│       ├── ProjectBadge.jsx       # Project name + color chip
│       ├── PriorityBadge.jsx      # Task priority badge
│       └── AssigneeSelect.jsx     # User search select
│
├── hooks/                  # Custom hooks
│   ├── useTheme.js
│   ├── useToast.js
│   ├── useConfirm.js       # Programmatic confirm dialog
│   ├── useAutoLogin.js
│   ├── useTokenRefresh.js
│   ├── useNotificationSSE.js
│   ├── useDrive.js
│   └── feature/
│       ├── useProjects.js
│       ├── useTask.js
│       └── useComments.js
│
├── pages/                  # Route-level page components
│   ├── auth/
│   │   ├── Login.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── ResetPassword.jsx
│   │   └── VerifyOtp.jsx
│   ├── onboarding/
│   │   └── RegisterCompany.jsx
│   ├── dashboard/
│   │   ├── UserDashboard.jsx
│   │   └── AdminDashboard.jsx
│   ├── users/
│   │   ├── UserList.jsx
│   │   └── UserDetail.jsx
│   ├── projects/
│   │   ├── ProjectList.jsx
│   │   ├── ProjectDetail.jsx
│   │   └── MyTasks.jsx
│   ├── time/
│   │   ├── TimeTracker.jsx
│   │   └── Timesheets.jsx
│   ├── leave/
│   │   ├── LeaveRequest.jsx
│   │   └── LeaveApprovals.jsx
│   ├── tickets/
│   │   ├── TicketList.jsx
│   │   └── TicketDetail.jsx
│   ├── expenses/
│   │   └── Expenses.jsx
│   ├── admin/
│   │   ├── AdminDashboard.jsx
│   │   ├── AdminTimesheets.jsx
│   │   ├── AdminLeave.jsx
│   │   ├── AdminExpenses.jsx
│   │   ├── AdminTickets.jsx
│   │   ├── OrgChart.jsx
│   │   └── ActivityLogs.jsx
│   └── settings/
│       ├── Profile.jsx
│       ├── CompanySettings.jsx
│       ├── NotificationSettings.jsx
│       └── AppearanceSettings.jsx
│
├── slices/                 # Redux slices (existing, keep as is)
├── Store/                  # Redux store config (existing, keep as is)
├── styles/
│   ├── tokens.css          # ← NEW: design tokens
│   ├── theme.js            # Keep or integrate into tokens
│   └── index.css           # Global resets
├── utils/
│   ├── dateUtils.js
│   ├── downloadFile.js
│   ├── notificationUtils.js
│   ├── validationUtils.js
│   └── cn.js               # ← NEW: clsx + tailwind-merge helper
├── axios.js
├── authConfig.js
├── routeConfig.jsx
├── App.jsx
└── main.jsx
```

### 12.2 The `cn()` Utility

**Location**: `frontend/src/utils/cn.js`

```javascript
// cn.js — classnames + tailwind-merge helper
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs) => twMerge(clsx(inputs));
```

Usage in components:
```jsx
// Instead of: className={`base-class ${condition ? 'extra' : ''} ${className}`}
// Do this:
<div className={cn('base-class', condition && 'extra', className)}>
```

### 12.3 Backend Structure (Final Target)

```
backend/
├── controllers/            # One file per domain, all wrapped in catchAsync
├── routes/
│   ├── index.js            # Renamed from webRoutesMount.js — loads all routes
│   └── v1/                 # Renamed from webRoutes/
│       ├── authRoutes.js
│       ├── userRoutes.js
│       ├── companyRoutes.js
│       ├── projectRoutes.js
│       ├── taskRoutes.js
│       ├── leaveRoutes.js
│       ├── holidayRoutes.js
│       ├── timesheetRoutes.js
│       ├── timeLogRoutes.js
│       ├── ticketRoutes.js
│       ├── expenseRoutes.js
│       ├── fileRoutes.js
│       ├── notificationRoutes.js
│       └── adminRoutes.js
├── models/                 # All with company index
├── middlewares/
│   ├── authMiddleware.js
│   ├── companyScope.js     # ← NEW
│   ├── roleMiddleware.js
│   ├── validateRequest.js
│   ├── uploadMiddleware.js
│   ├── rateLimiter.js      # ← NEW
│   └── globalErrorHandler.js
├── JoiSchema/
├── utils/
│   ├── catchAsync.js
│   ├── ExpressError.js
│   ├── token.js
│   ├── emailService.js
│   ├── logger.js
│   ├── sanitize.js         # ← NEW: HTML sanitization
│   └── ...existing
├── config/
├── conn/
├── index.js
└── .env
```

### 12.4 Naming Conventions Summary

| Entity | Convention | Example |
|--------|-----------|---------|
| UI Component files | PascalCase.jsx | `DataTable.jsx`, `Modal.jsx` |
| Page components | PascalCase.jsx | `UserList.jsx`, `ProjectDetail.jsx` |
| API service files | camelCase + Api.js | `usersApi.js`, `projectsApi.js` |
| Hook files | camelCase + use prefix | `useTheme.js`, `useProjects.js` |
| Redux slices | camelCase + Slice.js | `authSlice.js`, `userSlice.js` |
| Backend controllers | camelCase + Controller.js | `userController.js` |
| Backend routes | camelCase + Routes.js | `userRoutes.js` |
| Backend models | camelCase + Schema.js | `userSchema.js` |
| CSS custom properties | kebab-case with prefix | `--bg-surface`, `--text-primary` |
| Tailwind aliases | match token name | `bg-bg-surface`, `text-text-primary` |

---

## 13. Implementation Checklist

### Phase 0 Completion Criteria
- [ ] `tokens.css` created with all 4 themes defined
- [ ] `tailwind.config.js` updated to use CSS variables
- [ ] All 35+ UI components built in `components/ui/`
- [ ] `AppLayout.jsx` shell implemented
- [ ] `LeftSidebar.jsx` with all nav items, collapsed mode, active state
- [ ] `Topbar.jsx` with search, notifications, user dropdown, theme switcher
- [ ] `useTheme.js` hook working, theme persisted in localStorage
- [ ] 4 themes visually tested and switching works
- [ ] `companyScope.js` middleware created and applied
- [ ] Rate limiting added to auth routes
- [ ] Helmet added to Express
- [ ] API routes migrated from `/api/web/` to `/api/v1/`
- [ ] `axios.js` base URL updated
- [ ] All company-scoped models have `company` index

### Phase 1 Completion Criteria
- [ ] Login page redesigned (split layout per spec)
- [ ] All auth pages use new UI components
- [ ] Company registration wizard functional (3 steps)
- [ ] JWT includes `company` in payload

### Phase 2 Completion Criteria
- [ ] UserDashboard page shows real data with skeleton loading
- [ ] AdminDashboard shows aggregated metrics with charts
- [ ] All dashboard queries scoped by company
- [ ] Empty states shown when no data

### Phase 3 Completion Criteria
- [ ] UserList with search, filter, pagination
- [ ] UserDetail with tabs and right sidebar
- [ ] CreateUser modal with validation
- [ ] EditUser modal with validation
- [ ] DeactivateUser with ConfirmDialog
- [ ] DeleteUser with ConfirmDialog

### Phase 4 Completion Criteria
- [ ] ProjectList with grid/list toggle
- [ ] ProjectDetail with 5 tabs
- [ ] Kanban board with drag-and-drop
- [ ] Task detail drawer/right panel
- [ ] MyTasks page with filters

### Phase 5 Completion Criteria
- [ ] TimeTracker page with clock-in/out
- [ ] Time log form (project + task + time)
- [ ] Weekly timesheet grid
- [ ] Admin approval workflow
- [ ] All time queries scoped by company

### Phase 6 Completion Criteria
- [ ] Leave balance cards per type
- [ ] Leave request modal with validation
- [ ] Calendar view of leaves
- [ ] Manager approval flow
- [ ] Holiday exclusion from duration calc

### Phase 7 Completion Criteria
- [ ] Ticket list with priority sorting
- [ ] Ticket detail split view
- [ ] Response thread working
- [ ] Admin assignment working

### Phase 8 Completion Criteria
- [ ] Expense filing with receipt upload
- [ ] File type + size validation
- [ ] Admin approval flow
- [ ] Export to CSV

### Phase 9 Completion Criteria
- [ ] Profile editing functional
- [ ] Theme switcher in settings
- [ ] Company settings (admin only)
- [ ] Notification preferences saved

---

## Appendix A — StatusBadge Color Mapping

```javascript
// components/ui/StatusBadge.jsx
// maps domain status strings to badge variants

const STATUS_MAP = {
  // General
  active: 'success',
  inactive: 'default',
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',

  // Projects
  planning: 'info',
  inProgress: 'warning',
  completed: 'success',
  archived: 'default',
  onHold: 'danger',

  // Tasks
  todo: 'default',
  'in-progress': 'warning',
  'in-review': 'info',
  done: 'success',
  blocked: 'danger',

  // Leaves
  draft: 'default',
  submitted: 'warning',

  // Tickets
  open: 'info',
  resolved: 'success',
  closed: 'default',

  // Timesheets
  approved: 'success',
  rejected: 'danger',
};
```

---

## Appendix B — Priority Color Mapping

```javascript
// For tasks and tickets
const PRIORITY_MAP = {
  low: { color: 'var(--color-info)', bg: 'var(--color-info-bg)', label: 'Low' },
  medium: { color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', label: 'Medium' },
  high: { color: '#F97316', bg: '#FFF7ED', label: 'High' },
  critical: { color: 'var(--color-danger)', bg: 'var(--color-danger-bg)', label: 'Critical' },
};
```

---

## Appendix C — Motion & Animation Rules

Use `framer-motion` for:
1. **Page transitions**: fade + slight Y translate on route change
2. **Modal/Drawer entrance**: scale from 95% + fade (modal), translateX (drawer)
3. **Toast notifications**: slide in from right, slide out
4. **Kanban card drag**: scale up slightly while dragging
5. **Sidebar collapse**: width transition only

Do NOT animate:
- Table rows on load (too flashy)
- Buttons on hover (use CSS transitions instead)
- Form fields
- Anything in a list with more than 20 items

```javascript
// Standard page transition
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.15 } }
};
```

---

## Appendix D — Icon Usage Guide

**Library**: `lucide-react` only

```javascript
// Common icons and their use cases
import {
  Home,           // Dashboard
  Users,          // User management
  Building2,      // Departments
  Clock,          // Time tracker
  FileText,       // Timesheets
  Calendar,       // Leave, holidays
  DollarSign,     // Expenses
  Ticket,         // Support tickets
  FolderOpen,     // Files
  LayoutDashboard,// Admin dashboard
  GitBranch,      // Org chart
  Activity,       // Logs
  Settings,       // Settings
  Bell,           // Notifications
  Search,         // Search
  Plus,           // Add/create
  Pencil,         // Edit
  Trash2,         // Delete
  X,              // Close
  Check,          // Confirm
  ChevronDown,    // Dropdown
  ChevronRight,   // Expand
  MoreHorizontal, // Actions menu
  ArrowLeft,      // Back
  Download,       // Export/download
  Upload,         // Upload
  Eye,            // View
  EyeOff,         // Hide (password)
  LogOut,         // Logout
  Sun,            // Light theme
  Moon,           // Dark theme
  Palette,        // Theme switcher
} from 'lucide-react';

// Standard icon sizes
// sidebar nav items: size={18}
// buttons: size={16}
// empty states: size={48}
// stat cards: size={24}
// table actions: size={16}
```

---

*Document Version: 1.0*
*Created: June 2026*
*For: Karbexa / ABIDI Pro Revamp Project*
*This document is the single source of truth. All phases execute against this plan.*