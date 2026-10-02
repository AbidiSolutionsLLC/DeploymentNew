/* eslint-disable react-refresh/only-export-components */
/**
 * Project Portal — status/priority pill.
 * Tone maps are the ONLY place enum → color decisions are made (DESIGN §5.1).
 * Unknown enum values fall back to `neutral` — never crash on unexpected data.
 */

const TONES = {
  success: "text-success bg-success-bg border-success-border",
  warning: "text-warning bg-warning-bg border-warning-border",
  danger: "text-danger bg-danger-bg border-danger-border",
  info: "text-info bg-info-bg border-info-border",
  neutral: "text-neutral bg-neutral-bg border-neutral-border",
};

/** Project status → tone (models/projectSchema.js enum). */
export const PROJECT_STATUS_TONE = {
  Planning: "info",
  Active: "success",
  "On Hold": "warning",
  Completed: "neutral",
  Cancelled: "danger",
};

/** Task status → tone (models/taskSchema.js enum). */
export const TASK_STATUS_TONE = {
  Todo: "neutral",
  "In Progress": "info",
  "In Review": "warning",
  Done: "success",
  Blocked: "danger",
};

/** Task priority → tone (models/taskSchema.js enum). */
export const PRIORITY_TONE = { Low: "neutral", Medium: "warning", High: "danger" };

export default function Pill({ tone = "neutral", children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${
        TONES[tone] || TONES.neutral
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
