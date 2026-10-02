/* eslint-disable react-refresh/only-export-components */
/**
 * PROTOTYPE — Variant B "Split Workspace" local atoms.
 * Soft / editorial: dot statuses, left-accent rails, avatar stacks.
 * Uses ONLY existing design tokens. Not shared with other variants.
 */

const DOT = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  neutral: "bg-neutral",
};

const TEXT = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
  neutral: "text-neutral",
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

export function DotStatus({ tone = "neutral", children }) {
  return (
    <span className={`inline-flex items-center gap-2 text-xs font-semibold whitespace-nowrap ${TEXT[tone] || TEXT.neutral}`}>
      <span className={`w-2 h-2 rounded-full ${DOT[tone] || DOT.neutral}`} />
      {children}
    </span>
  );
}

export function Progress({ value = 0, className = "" }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className={`w-full h-1 rounded-full bg-border-subtle overflow-hidden ${className}`}>
      <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function AvatarStack({ people = [], max = 4 }) {
  const list = people.slice(0, max);
  const extra = people.length - list.length;
  return (
    <div className="flex items-center -space-x-2">
      {list.map((p, i) => {
        const src = typeof p === "string" ? null : p.avatar || p.profileImage;
        const name =
          typeof p === "string"
            ? p
            : `${p.firstName || ""} ${p.lastName || ""}`.trim() || p.name || p.email || "?";
        return src ? (
          <img
            key={i}
            src={src}
            alt=""
            title={name}
            className="w-7 h-7 rounded-full object-cover ring-2 ring-surface border border-border-accent"
          />
        ) : (
          <span
            key={i}
            title={name}
            className="w-7 h-7 rounded-full bg-amber-100 text-brand-text ring-2 ring-surface flex items-center justify-center text-[10px] font-black border border-border-accent"
          >
            {(name || "?").charAt(0).toUpperCase()}
          </span>
        );
      })}
      {extra > 0 && (
        <span className="w-7 h-7 rounded-full bg-card text-muted ring-2 ring-surface border border-border-subtle flex items-center justify-center text-[10px] font-black">
          +{extra}
        </span>
      )}
    </div>
  );
}

export function RailTitle({ eyebrow, title, action }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text mb-1 truncate">{eyebrow}</p>
        )}
        <h3 className="text-base sm:text-lg font-black text-heading tracking-tight truncate">{title}</h3>
      </div>
      {action}
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
    <div className="border-l-4 border-border-accent bg-amber-50/40 rounded-r-xl px-4 py-5">
      <p className="text-sm font-bold text-heading">{title}</p>
      {hint && <p className="text-xs text-muted mt-1">{hint}</p>}
    </div>
  );
}
