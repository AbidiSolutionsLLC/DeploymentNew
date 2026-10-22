import React, { useEffect, useState } from "react";
import { FaCommentDots } from "react-icons/fa";
import { getInitials } from "../../utils/tableUtils";
import { priorityLabel } from "../StatusBadge";

/**
 * TableCells — the single source of truth for how a table VALUE is rendered.
 *
 * Every table in the app uses these building blocks so the same kind of field
 * (a person, an ID, a status, a date, money, progress…) looks identical on
 * every page, in light and dark mode. Column definitions only describe
 * *which* renderer to use; the design lives here.
 */

/* ---------------- shared class tokens ---------------- */
export const CELL_TEXT = "text-sm font-medium text-main";
export const CELL_STRONG = "text-sm font-bold text-heading";
export const CELL_MUTED = "text-xs font-medium text-muted";
export const CELL_SUB = "text-[10px] text-muted truncate";

export const PILL =
  "inline-flex items-center gap-1 text-xs font-semibold bg-surface dark:bg-app px-2.5 py-1 rounded-md border border-border-subtle text-main max-w-full truncate";

export const TAG =
  "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap max-w-full";

export const TONE = {
  neutral: "bg-surface dark:bg-app text-main border-border-subtle",
  brand:
    "bg-amber-50 dark:bg-amber-900/30 text-brand-text dark:text-amber-400 border-border-accent dark:border-amber-800",
  success:
    "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  warning:
    "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  danger:
    "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",
  info:
    "bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-800",
};

/* ---------------- date helpers ---------------- */
export const formatDateValue = (
  value,
  { month = "short", day = "numeric", year = "numeric", weekday } = {}
) => {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { weekday, month, day, year });
};

/* ---------------- generic bits ---------------- */
export const TableEmpty = ({ fallback = "—", className = "" }) => (
  <span className={`text-muted ${className}`}>{fallback}</span>
);

export function TableAvatar({ name, src, size = "md", className = "" }) {
  const [imageFailed, setImageFailed] = useState(false);
  const sizeCls = {
    xs: "w-6 h-6 text-[9px]",
    sm: "w-7 h-7 text-[10px]",
    md: "w-8 h-8 text-[11px]",
    lg: "w-10 h-10 text-sm",
  }[size];

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  if (src && !imageFailed) {
    return (
      <img
        src={src}
        alt=""
        onError={() => setImageFailed(true)}
        className={`${sizeCls} rounded-full object-cover border border-border-accent shadow-sm flex-shrink-0 ${className}`}
      />
    );
  }
  return (
    <span
      className={`${sizeCls} rounded-full bg-gradient-to-br from-amber-100 to-amber-200 text-brand-text border border-amber-200 shadow-sm dark:from-amber-900/40 dark:to-amber-800/40 dark:border-amber-800 dark:text-amber-400 flex items-center justify-center font-bold tracking-wide flex-shrink-0 ${className}`}
    >
      {getInitials(name)}
    </span>
  );
}

/** Person / employee cell: avatar + name + optional secondary line. */
export function TablePerson({
  name,
  subtitle,
  avatar,
  size = "md",
  fallback = "—",
  className = "",
  subtitleClassName = "",
}) {
  const display = name || fallback;
  return (
    <div className={`flex items-center gap-2.5 min-w-0 ${className}`}>
      <TableAvatar name={display} src={avatar} size={size} />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-heading truncate leading-tight">{display}</p>
        {subtitle ? (
          <p className={`text-[10px] text-muted truncate ${subtitleClassName}`}>{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Title + subtitle cell for tasks / projects / expenses / tickets / groups. */
export function TableTitle({
  title,
  subtitle,
  icon,
  leading,
  fallback = "—",
  maxWidth = "max-w-[240px]",
  className = "",
  titleClassName = "",
}) {
  return (
    <div className={`flex items-center gap-2.5 min-w-0 ${maxWidth} ${className}`}>
      {leading}
      <div className="min-w-0">
        <p
          className={`text-sm font-semibold text-heading truncate leading-tight flex items-center gap-1.5 ${titleClassName}`}
        >
          {icon}
          {title || fallback}
        </p>
        {subtitle ? <p className="text-[10px] text-muted truncate mt-0.5">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export function TableText({
  value,
  muted = false,
  truncate = false,
  clamp,
  maxWidth,
  title,
  suffix = "",
  fallback = "—",
  className = "",
}) {
  const text = value === null || value === undefined || value === "" ? fallback : value;
  const style = clamp
    ? { display: "-webkit-box", WebkitLineClamp: clamp, WebkitBoxOrient: "vertical", overflow: "hidden" }
    : undefined;
  return (
    <span
      title={title ?? (typeof text === "string" ? text : undefined)}
      style={style}
      className={`${muted ? CELL_MUTED : CELL_TEXT} ${truncate ? "truncate inline-block" : ""} ${
        maxWidth || ""
      } ${className}`}
    >
      {text}
      {suffix}
    </span>
  );
}

/** Branch / meta tag (department, category, group, employment type…). */
export function TablePill({ children, tone = "neutral", icon, title, className = "" }) {
  if (children === null || children === undefined || children === "") return <TableEmpty />;
  return (
    <span title={title} className={`${TAG} ${TONE[tone]} ${className}`}>
      {icon}
      {children}
    </span>
  );
}

/** Identifier (employee id, ticket id, request id…). */
export function TableId({
  value,
  prefix = "#",
  variant = "pill",
  tone = "neutral",
  truncate = false,
  fallback = "—",
  title,
  className = "",
}) {
  if (value === null || value === undefined || value === "") return <TableEmpty fallback={fallback} />;
  const display = `${prefix}${value}`;
  if (variant === "text") {
    return (
      <span
        title={title || display}
        className={`font-mono text-xs font-bold ${
          tone === "brand" ? "text-brand-text" : "text-main"
        } whitespace-nowrap ${truncate ? "truncate inline-block max-w-[90px]" : ""} ${className}`}
      >
        {display}
      </span>
    );
  }
  return (
    <TablePill tone={tone} title={title}>
      {display}
    </TablePill>
  );
}

const STATUS_ALIASES = {
  opened: "Open",
  inprogress: "In Progress",
  todo: "To Do",
};

const formatStatusLabel = (value) => {
  const str = String(value ?? "").trim();
  if (!str) return "";
  const key = str.toLowerCase().replace(/[\s_-]+/g, "");
  if (STATUS_ALIASES[key]) return STATUS_ALIASES[key];
  if (!/[_-]/.test(str) && str !== str.toLowerCase()) return str;
  return str
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

/** Semantic status pill (uniform green tokens, per app design). */
export function TableStatus({ value, label, capitalize = false, className = "" }) {
  const text = formatStatusLabel(label ?? value);
  if (!text) return <TableEmpty />;
  return <span className={`lm-success-badge ${capitalize ? "capitalize" : ""} ${className}`}>{text}</span>;
}

/** Priority pill — same normalized label + green pill everywhere. */
export function TablePriority({ value }) {
  if (value === null || value === undefined || value === "") return <TableEmpty />;
  const label = priorityLabel(value);
  return <span className="lm-success-badge">{label.charAt(0).toUpperCase() + label.slice(1)}</span>;
}

/** Role pill. */
export function TableRole({ value }) {
  if (!value) return <TableEmpty />;
  return <span className={`${TAG} ${TONE.brand}`}>{value}</span>;
}

export function TableDate({
  value,
  mode = "date",
  fallback = "—",
  className = "",
  prefix = "",
  suffix = "",
  tone = "default",
  subtitle,
}) {
  const opts =
    mode === "weekday"
      ? { weekday: "long", month: "short", day: "numeric", year: "numeric" }
      : mode === "short"
      ? { month: "short", day: "numeric", year: "numeric" }
      : mode === "day"
      ? { weekday: "short" }
      : { month: "short", day: "numeric", year: "numeric" };
  const text = formatDateValue(value, opts);
  if (!text) return <TableEmpty fallback={fallback} />;
  const toneCls =
    tone === "danger"
      ? "text-rose-600 dark:text-rose-400 font-bold"
      : tone === "warning"
      ? "text-amber-600 dark:text-amber-400 font-bold"
      : tone === "success"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "muted"
      ? "text-muted"
      : "text-main";
  return (
    <span className="inline-flex flex-col whitespace-nowrap">
      <span className={`text-xs font-medium ${toneCls} ${className}`}>
        {prefix}
        {text}
        {suffix}
      </span>
      {subtitle ? (
        <span
          className={`text-[9px] font-bold uppercase tracking-widest ${
            tone === "danger"
              ? "text-rose-500 dark:text-rose-400"
              : tone === "warning"
              ? "text-amber-500 dark:text-amber-400"
              : "text-muted"
          }`}
        >
          {subtitle}
        </span>
      ) : null}
    </span>
  );
}

/** Start → end date pair with optional secondary line. */
export function TableDateRange({ start, end, subtitle, fallback = "—", className = "" }) {
  const s = formatDateValue(start);
  const e = formatDateValue(end);
  if (!s && !e) return <TableEmpty fallback={fallback} />;
  return (
    <div className={`min-w-[165px] ${className}`}>
      <p className="text-xs font-bold text-heading whitespace-nowrap">
        {s || fallback} → {e || fallback}
      </p>
      {subtitle ? <p className="text-[10px] text-muted mt-0.5">{subtitle}</p> : null}
    </div>
  );
}

export function TableMoney({
  value,
  prefix = "$",
  suffix = "",
  decimals = 2,
  tone = "default",
  fallback = "—",
  className = "",
}) {
  if (value === null || value === undefined || value === "" || Number.isNaN(Number(value)))
    return <TableEmpty fallback={fallback} />;
  const amount =
    decimals === null ? Number(value) : Number(value).toFixed(decimals);
  return (
    <span
      className={`text-sm font-bold tabular-nums ${
        tone === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-heading"
      } ${className}`}
    >
      {prefix}
      {amount}
      {suffix}
    </span>
  );
}

export function TableNumber({
  value,
  suffix = "",
  decimals,
  tone = "default",
  fallback = "—",
  className = "",
}) {
  if (value === null || value === undefined || value === "" || Number.isNaN(Number(value)))
    return <TableEmpty fallback={fallback} />;
  const n = decimals === null || decimals === undefined ? Number(value) : Number(value).toFixed(decimals);
  return (
    <span
      className={`text-sm font-semibold tabular-nums ${
        tone === "success"
          ? "text-emerald-600 dark:text-emerald-400"
          : tone === "warning"
          ? "text-amber-600 dark:text-amber-400"
          : tone === "info"
          ? "text-sky-600 dark:text-sky-400"
          : tone === "danger"
          ? "text-rose-600 dark:text-rose-400"
          : "text-heading"
      } ${className}`}
    >
      {n}
      {suffix}
    </span>
  );
}

/** Hours value rendered as a pill (submitted / approved / logged). */
export function TableHours({ value, suffix = " h", tone = "neutral", decimals = 1 }) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return <TableEmpty />;
  return (
    <span className={`${TAG} ${TONE[tone]} tabular-nums`}>
      {Number(value).toFixed(decimals)}
      {suffix}
    </span>
  );
}

/** Progress bar with percentage, used on projects & tasks. */
export function TableProgress({
  value = 0,
  total,
  showLabel = true,
  width = "min-w-[120px]",
  barClass,
}) {
  const pct = total ? Math.round((value / total) * 100) : Math.max(0, Math.min(100, Math.round(value || 0)));
  const tone =
    barClass || "bg-gradient-to-r from-amber-300 via-amber-500 to-amber-600";
  return (
    <div className={`flex items-center gap-2.5 ${width}`}>
      <div className="h-1.5 w-full rounded-full bg-border-subtle overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${tone}`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-9 shrink-0 text-right text-[11px] font-bold text-heading tabular-nums">
          {pct}%
        </span>
      )}
    </div>
  );
}

export function TableBoolean({ value, trueLabel = "Yes", falseLabel = "No", icon }) {
  return (
    <TablePill tone={value ? "success" : "neutral"}>
      {value && icon}
      {value ? trueLabel : falseLabel}
    </TablePill>
  );
}

export function TableCommentCount({ count = 0, className = "" }) {
  if (!count) return <span className="text-muted text-xs">No comments</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold text-brand-text whitespace-nowrap ${className}`}>
      <FaCommentDots size={13} />
      {count}
    </span>
  );
}
