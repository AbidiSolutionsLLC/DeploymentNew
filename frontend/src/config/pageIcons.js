import {
  HomeIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  ClockIcon,
  BriefcaseIcon,
  TicketIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  UserPlusIcon,
  UsersIcon,
  ChartPieIcon,
  ShieldCheckIcon,
  CheckBadgeIcon,
  RectangleStackIcon,
  FolderPlusIcon,
  Squares2X2Icon,
} from "@heroicons/react/20/solid";
import { FaSitemap } from "react-icons/fa";

/**
 * GLOBAL PAGE ICON MAP — the single source of truth for "which icon
 * belongs to which page".
 *
 * Both the left navigation (via routeConfig → SubNavbarVertical) and the
 * animated hero emblem (PortalHero) read from this map, so a page's navbar
 * icon and its hero emblem can never drift apart again.
 *
 * Keyed by route path. `pageIcon()` performs an exact match first, then a
 * longest-prefix match so detail routes (e.g. /people/profile/:id) inherit
 * their parent page's icon.
 *
 * IMPORTANT: icons are the `20/solid` Heroicons set, matching the nav rail's
 * historical (pre-refactor) look. Keep it that way so the sidebar doesn't
 * change visual weight. The one non-Heroicons entry is the Org Chart
 * (react-icons FaSitemap), which the nav has always used.
 */
export const PAGE_ICONS = {
  // ── People module ──
  "/people/home": HomeIcon,
  "/people/profile": UserCircleIcon,
  "/people/attendance": CalendarDaysIcon,
  "/people/timetracker": ClockIcon,
  "/people/history": ClockIcon,
  "/people/summary": BriefcaseIcon,
  "/people/raise": TicketIcon,
  "/people/assigned-tickets": ClipboardDocumentCheckIcon,
  "/people/org-chart": FaSitemap,

  // ── Admin module ──
  "/admin/dashboard": ShieldCheckIcon,
  "/admin/attendance": CalendarDaysIcon,
  "/admin/userManagement": UsersIcon,
  "/admin/leaveTrackerAdmin": BriefcaseIcon,
  "/admin/leaveManagement": BriefcaseIcon,
  "/admin/timesheet": ClockIcon,
  "/leave/leaveTrackerAdmin": BriefcaseIcon,
  "/admin/approve": CheckBadgeIcon,
  "/admin/assign-ticket": UserPlusIcon,
  "/admin/tenantManagement": Squares2X2Icon,

  // ── Project module ──
  "/project/projectDashboard": ChartPieIcon,
  "/project/projects": RectangleStackIcon,
  "/project/myTasks": ClipboardDocumentListIcon,
};

/**
 * Resolve the canonical icon for a pathname.
 * Exact match wins; otherwise the longest matching key prefix is used.
 */
export function pageIcon(pathname) {
  if (!pathname) return null;
  if (PAGE_ICONS[pathname]) return PAGE_ICONS[pathname];

  let best = null;
  let bestLen = -1;
  for (const key of Object.keys(PAGE_ICONS)) {
    if (pathname === key || pathname.startsWith(`${key}/`)) {
      if (key.length > bestLen) {
        best = PAGE_ICONS[key];
        bestLen = key.length;
      }
    }
  }
  return best;
}
