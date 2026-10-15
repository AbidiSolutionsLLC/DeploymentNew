/**
 * Project Portal — shared helpers (dates, progress rule, sort comparison).
 * Spec: PROJECT_PORTAL_DESIGN.md (§5.2 progress rule, §6 kit, §9 pages).
 */

/** "Jan 5, 2025" — or "—" for empty/invalid values. */
export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/** "Jan 5" — compact variant for dense cells. */
export function shortDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** True when `value` is in the past and the task/project isn't in a finished state. */
export function isOverdue(value, status) {
  if (!value || status === "Done" || status === "Completed" || status === "Cancelled") return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

/**
 * Progress rule — single definition (DESIGN §5.2):
 * backend `progress` = average task completionPercent. Projects without tasks
 * have NO `progress` field, so we show the documented status-based estimate.
 */
export function projectProgress(project) {
  if (typeof project?.progress === "number") return project.progress;
  // Fallback based on status
  switch (project?.status) {
    case "Completed":
      return 100;
    case "Active":
      return 50;
    case "On Hold":
      return 30;
    case "Planning":
      return 15;
    default:
      return 20;
  }
}

/** Calculate exact project progress from tasks if available */
export function calculateProjectProgress(project) {
  // If backend already computed progress, use it
  if (typeof project?.progress === "number") return project.progress;
  
  // If we have tasks array with completionPercent, calculate average
  if (Array.isArray(project?.tasks) && project.tasks.length > 0) {
    const total = project.tasks.reduce((sum, t) => sum + (t.completionPercent || 0), 0);
    return Math.round(total / project.tasks.length);
  }
  
  // Fallback to status-based estimate
  return projectProgress(project);
}

/** Task progress = real completionPercent; Done without a percent still shows 100. */
export function taskProgress(task) {
  if (typeof task?.completionPercent === "number") return task.completionPercent;
  return task?.status === "Done" ? 100 : 0;
}

export function projectHealthTone(status) {
  return status === "At Risk" ? "danger" : status === "Watch" ? "warning" : "success";
}

/** Display name for a populated user/owner reference (or a bare id string). */
export function personName(person) {
  if (!person) return "—";
  if (typeof person === "string") return person;
  return (
    person.name ||
    (person.firstName ? `${person.firstName} ${person.lastName || ""}`.trim() : "") ||
    person.email ||
    "—"
  );
}

/** Get assignee from task - handles assignee, team[0], assignedTo */
export function getTaskAssignee(task) {
  if (!task) return null;
  // Priority: assignee (populated object) > team[0] > assignedTo
  if (task.assignee) return task.assignee;
  if (Array.isArray(task.team) && task.team.length > 0) return task.team[0];
  if (task.assignedTo) return task.assignedTo;
  return null;
}

/** Get assignee name for display */
export function getAssigneeName(task) {
  const assignee = getTaskAssignee(task);
  return personName(assignee);
}

export const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/;

/** Reduce a cell value to something sortable (populated refs → their label). */
function sortValue(value) {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "object") return value.name || value.title || value.email || null;
  return value;
}

/**
 * Generic column comparison for PortalTable:
 * numbers numerically, ISO date strings chronologically,
 * everything else case-insensitive & numeric-aware ("PR-2" < "PR-10"),
 * null/empty values always sort last.
 */
export function compareValues(aRaw, bRaw) {
  const a = sortValue(aRaw);
  const b = sortValue(bRaw);
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;

  const aStr = String(a);
  const bStr = String(b);
  // Domain enums with a meaningful order (High > Medium > Low)
  if (aStr in PRIORITY_RANK && bStr in PRIORITY_RANK) {
    return PRIORITY_RANK[aStr] - PRIORITY_RANK[bStr];
  }
  if (ISO_DATE.test(aStr) && ISO_DATE.test(bStr)) {
    const at = Date.parse(aStr);
    const bt = Date.parse(bStr);
    if (!Number.isNaN(at) && !Number.isNaN(bt)) return at - bt;
  }
  return aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: "base" });
}
