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
/**
 * Progress rule — single definition:
 * - If status is Completed => 100%
 * - If tasks are provided (or embedded in project) => average task progress
 *   (Done tasks count as 100%, in-progress tasks use completionPercent, 0% if empty)
 * - If project.progress is a number from backend => use it
 * - Default for new/empty projects => 0%
 */
export function projectProgress(project, tasks) {
  if (project?.status === "Completed") return 100;

  const taskList = Array.isArray(tasks) ? tasks : (Array.isArray(project?.tasks) ? project.tasks : null);
  if (taskList !== null) {
    if (taskList.length === 0) return 0;
    const total = taskList.reduce((sum, t) => {
      const pct = t?.status === "Done" ? 100 : (typeof t?.completionPercent === "number" ? t.completionPercent : 0);
      return sum + pct;
    }, 0);
    return Math.round(total / taskList.length);
  }

  if (typeof project?.progress === "number") return project.progress;

  return 0;
}

/** Calculate exact project progress from tasks if available */
export function calculateProjectProgress(project, tasks) {
  return projectProgress(project, tasks);
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

/** Get all assignees from task as an array of user objects / IDs */
export function getTaskAssignees(task) {
  if (!task) return [];
  if (Array.isArray(task.team) && task.team.length > 0) {
    return task.team.filter(Boolean);
  }
  if (Array.isArray(task.assignees) && task.assignees.length > 0) {
    return task.assignees.filter(Boolean);
  }
  if (task.assignee) return [task.assignee];
  if (task.assignedTo) return [task.assignedTo];
  return [];
}

/** Get assignee from task - handles assignee, team[0], assignedTo */
export function getTaskAssignee(task) {
  const assignees = getTaskAssignees(task);
  return assignees[0] || null;
}

/** Get assignee name(s) for display: single name, "A, B" for 2, "A, B (+N)" for >2 */
export function getAssigneeName(task) {
  const assignees = getTaskAssignees(task);
  if (!assignees || assignees.length === 0) return "—";
  if (assignees.length === 1) return personName(assignees[0]);
  if (assignees.length === 2) {
    return `${personName(assignees[0])}, ${personName(assignees[1])}`;
  }
  return `${personName(assignees[0])}, ${personName(assignees[1])} (+${assignees.length - 2})`;
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
