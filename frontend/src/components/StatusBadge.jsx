import React from 'react';
import '../styles/adminPortal.css';

/**
 * Reusable semantic status badge.
 * Uses the global semantic CSS tokens (--status-*-fg/bg/border) so it stays
 * readable in BOTH light and dark mode. No hardcoded palette colors.
 *
 * Variant map is exported so other components can resolve a status to the
 * same token classes if they can't render the <StatusBadge> component itself.
 */
/* Status pills render uniform green across the app (table + modal cells):
   bg / text / border all use the success (green) tokens so the field text
   reads green for every value. */
export const STATUS_VARIANTS = {
  success: {
    badge: 'lm-success-badge',
    dot: '', // Dot is now part of lm-success-badge via ::before
  },
  warning: {
    badge: 'lm-success-badge',
    dot: '',
  },
  danger: {
    badge: 'lm-success-badge',
    dot: '',
  },
  info: {
    badge: 'lm-success-badge',
    dot: '',
  },
  neutral: {
    badge: 'lm-success-badge',
    dot: '',
  },
};

export const resolveStatusVariant = (status) => {
  return 'success';
};

/** Priority pill classes shared by people + admin ticket pages.
 *  Uniform green text for every priority level. */
const GREEN_PILL = "lm-success-badge";

export const PRIORITY_PILL = {
  "Critical Priority": GREEN_PILL,
  "High Priority": GREEN_PILL,
  "Medium Priority": GREEN_PILL,
  "Low Priority": GREEN_PILL,
  Critical: GREEN_PILL,
  High: GREEN_PILL,
  Medium: GREEN_PILL,
  Low: GREEN_PILL,
};

export const resolvePriorityPill = (priority) => {
  const raw = String(priority || "").trim();
  if (PRIORITY_PILL[raw]) return PRIORITY_PILL[raw];
  const lower = raw.toLowerCase();
  if (lower.includes("critical")) return PRIORITY_PILL.Critical;
  if (lower.includes("high")) return PRIORITY_PILL.High;
  if (lower.includes("medium")) return PRIORITY_PILL.Medium;
  if (lower.includes("low")) return PRIORITY_PILL.Low;
  return PRIORITY_PILL.Medium;
};

export const priorityLabel = (priority) => {
  const raw = String(priority || "").trim();
  if (!raw) return "Normal";
  return raw.replace(/\s*Priority$/i, "");
};

export const statusBadgeClass = (status) =>
  STATUS_VARIANTS[resolveStatusVariant(status)]?.badge || STATUS_VARIANTS.neutral.badge;

export const statusDotClass = (status) =>
  STATUS_VARIANTS[resolveStatusVariant(status)]?.dot || STATUS_VARIANTS.neutral.dot;

const StatusBadge = ({ status }) => {
  if (!status) return null;

  const variant = STATUS_VARIANTS[resolveStatusVariant(status)];

  return (
    <span className={`inline-flex items-center ${variant.badge}`}>
      {variant.dot && <span className={`w-1.5 h-1.5 rounded-full ${variant.dot}`}></span>}
      <span className="capitalize">{status}</span>
    </span>
  );
};

export default StatusBadge;
