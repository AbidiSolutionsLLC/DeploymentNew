/* eslint-disable react-refresh/only-export-components */
/**
 * PROTOTYPE — Variant C "Board & Metrics" local atoms.
 * Kanban columns, dashed empty states, chip statuses, metric pieces.
 * Uses ONLY existing design tokens. Not shared with other variants.
 */

export const PROJECT_COLUMNS = ["Planning", "Active", "On Hold", "Completed"];
export const TASK_COLUMNS = ["Todo", "In Progress", "In Review", "Blocked", "Done"];

const DOT = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  neutral: "bg-neutral",
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

export function Dot({ tone = "neutral" }) {
  return <span className={`w-2 h-2 rounded-full shrink-0 ${DOT[tone] || DOT.neutral}`} />;
}

export function Chip({ tone = "neutral", children }) {
  const map = {
    success: "bg-success-bg text-success border-success-border",
    warning: "bg-warning-bg text-warning border-warning-border",
    danger: "bg-danger-bg text-danger border-danger-border",
    info: "bg-info-bg text-info border-info-border",
    neutral: "bg-neutral-bg text-neutral border-neutral-border",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${map[tone] || map.neutral}`}
    >
      <Dot tone={tone} />
      {children}
    </span>
  );
}

/** A kanban column: dominant width on phones, fixed on sm+. */
export function Column({ title, count, children, tone = "neutral" }) {
  return (
    <section className="w-[78vw] sm:w-[300px] shrink-0 snap-start flex flex-col min-w-0">
      <header className="flex items-center justify-between gap-2 px-1 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Dot tone={tone} />
          <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-heading truncate">{title}</h3>
        </div>
        <span className="shrink-0 min-w-6 text-center px-1.5 py-0.5 rounded-md bg-amber-50 border border-border-accent text-brand-text text-[10px] font-black tabular-nums">
          {count}
        </span>
      </header>
      <div className="flex flex-col gap-2.5 rounded-xl bg-app border border-border-subtle p-2.5 min-h-[120px]">
        {children}
      </div>
    </section>
  );
}

export function BoardScroll({ children, label = "Scroll board horizontally" }) {
  return (
    <div
      className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-on-hover"
      aria-label={label}
    >
      {children}
    </div>
  );
}

export function EmptyState({ title = "Nothing here yet", hint }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8 px-3 border border-dashed border-border-accent rounded-lg">
      <p className="text-xs font-bold text-muted uppercase tracking-wider">{title}</p>
      {hint && <p className="text-[11px] text-muted mt-1">{hint}</p>}
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
