/* eslint-disable react-refresh/only-export-components */
/**
 * PROTOTYPE — Variant A "Command Center" local atoms.
 * Compact / dense / uppercase micro-labels. Uses ONLY the existing design
 * tokens (brand gold = amber-* scale, status tokens, surface/card/heading...).
 * Not shared with other variants on purpose — each variant owns its language.
 */

const TONES = {
  success: "text-success bg-success-bg border-success-border",
  warning: "text-warning bg-warning-bg border-warning-border",
  danger: "text-danger bg-danger-bg border-danger-border",
  info: "text-info bg-info-bg border-info-border",
  neutral: "text-neutral bg-neutral-bg border-neutral-border",
};

export const PROJECT_STATUS_TONE = {
  Planning: "info",
  Active: "success",
  "On Hold": "warning",
  Completed: "neutral",
  Cancelled: "danger",
};

export const TASK_STATUS_TONE = {
  Todo: "neutral",
  "In Progress": "info",
  "In Review": "warning",
  Done: "success",
  Blocked: "danger",
};

export const PRIORITY_TONE = { Low: "neutral", Medium: "warning", High: "danger" };

export function Pill({ tone = "neutral", children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${TONES[tone] || TONES.neutral}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function Progress({ value = 0 }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="w-full h-1.5 rounded-full bg-border-subtle overflow-hidden">
      <div className="h-full rounded-full bg-amber-500 transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function shortDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function isOverdue(value, status) {
  if (!value || status === "Done" || status === "Completed") return false;
  const d = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return !Number.isNaN(d.getTime()) && d < today;
}

export function EmptyState({ title = "Nothing here yet", hint }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
      <div className="w-12 h-12 rounded-xl bg-amber-50 border border-border-accent flex items-center justify-center mb-3">
        <span className="text-brand-text font-black text-lg">K</span>
      </div>
      <p className="text-sm font-bold text-heading uppercase tracking-wide">{title}</p>
      {hint && <p className="text-xs text-muted mt-1 max-w-[240px]">{hint}</p>}
    </div>
  );
}

export function SectionHead({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="min-w-0">
        <h3 className="text-sm font-black text-heading uppercase tracking-wider truncate">{title}</h3>
        {subtitle && <p className="text-[10px] uppercase tracking-widest text-muted mt-0.5 truncate">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
