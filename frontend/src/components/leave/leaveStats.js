/**
 * Shared helpers for the admin Leave Management tabs.
 *
 * Balance model (mirrors the backend):
 * - `user.leaves.pto / user.leaves.sick` is the REMAINING balance.
 *   It is decremented when a leave request is created (Pending) and
 *   restored when the request is rejected or deleted.
 * - `user.leaveHistory[].daysTaken` holds the days per request.
 *
 * Therefore:
 *   allowance = remaining + used   (used = every non-rejected request)
 *
 * Balance status:
 *   exhausted = 0 days left · low = 1..LOW_BALANCE_THRESHOLD days · healthy = above that
 */
import { STATUS_VARIANTS } from "../StatusBadge";

export const LOW_BALANCE_THRESHOLD = 3;

export const computeLeaveStats = (user) => {
  const history = Array.isArray(user?.leaveHistory) ? user.leaveHistory : [];

  let usedPto = 0;
  let usedSick = 0;
  let pendingDays = 0;
  let approvedDays = 0;
  let pendingRequests = 0;

  history.forEach((entry) => {
    if (!entry || entry.status === "Rejected") return;
    const days = Number(entry.daysTaken) || 0;
    if (entry.leaveType === "Sick") usedSick += days;
    else usedPto += days;

    if (entry.status === "Pending") {
      pendingDays += days;
      pendingRequests += 1;
    }
    if (entry.status === "Approved") approvedDays += days;
  });

  const remainingPto = Number(user?.leaves?.pto) || 0;
  const remainingSick = Number(user?.leaves?.sick) || 0;

  const usedTotal = usedPto + usedSick;
  const remainingTotal = remainingPto + remainingSick;
  const allowancePto = remainingPto + usedPto;
  const allowanceSick = remainingSick + usedSick;
  const allowanceTotal = allowancePto + allowanceSick;

  const usedPercent = allowanceTotal > 0
    ? Math.min(100, Math.round((usedTotal / allowanceTotal) * 100))
    : 0;
  const remainingPercent = 100 - usedPercent;

  let balanceStatus = "healthy";
  if (remainingTotal <= 0) balanceStatus = "exhausted";
  else if (remainingTotal <= LOW_BALANCE_THRESHOLD) balanceStatus = "low";

  return {
    usedPto,
    usedSick,
    usedTotal,
    remainingPto,
    remainingSick,
    remainingTotal,
    allowancePto,
    allowanceSick,
    allowanceTotal,
    pendingDays,
    pendingRequests,
    approvedDays,
    usedPercent,
    remainingPercent,
    balanceStatus,
  };
};

/* Generic table helpers live in utils/tableUtils — re-exported here for
   leave-tab callers so they keep a single import site. */
export { getInitials, csvEscape, downloadCsv } from "../../utils/tableUtils";

export const EMP_TYPE_VARIANTS = {
  Permanent:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  Contractor:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  Intern:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
  "Part Time":
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
};

export const EMP_TYPE_BADGE =
  "inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wide whitespace-nowrap";

export const BALANCE_TEXT = {
  healthy: "text-emerald-600 dark:text-emerald-400",
  low: "text-amber-600 dark:text-amber-400",
  exhausted: "text-rose-600 dark:text-rose-400",
};

export const BALANCE_BAR = {
  healthy: "bg-emerald-500",
  low: "bg-amber-500",
  exhausted: "bg-rose-500",
};

export const getBalanceRemark = (stats) => {
  if (stats.pendingRequests > 0) {
    const req = `${stats.pendingRequests} request${stats.pendingRequests > 1 ? "s" : ""}`;
    const days = `${stats.pendingDays} day${stats.pendingDays === 1 ? "" : "s"}`;
    return `${req} · ${days} pending`;
  }
  return "No pending requests";
};

export const BALANCE_LABEL = {
  healthy: "Healthy",
  low: "Low Balance",
  exhausted: "Exhausted",
};

/* Semantic status pill classes (theme aware, same tokens as StatusBadge) */
export const BALANCE_PILL = {
  healthy: STATUS_VARIANTS.success,
  low: STATUS_VARIANTS.warning,
  exhausted: STATUS_VARIANTS.danger,
};
