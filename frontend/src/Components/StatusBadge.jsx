import React from 'react';

/**
 * Reusable semantic status badge.
 * Uses the global semantic CSS tokens (--status-*-fg/bg/border) so it stays
 * readable in BOTH light and dark mode. No hardcoded palette colors.
 *
 * Variant map is exported so other components can resolve a status to the
 * same token classes if they can't render the <StatusBadge> component itself.
 */
export const STATUS_VARIANTS = {
  success: {
    badge: 'bg-success-bg text-success border-success-border',
    dot: 'bg-success',
  },
  warning: {
    badge: 'bg-warning-bg text-warning border-warning-border',
    dot: 'bg-warning',
  },
  danger: {
    badge: 'bg-danger-bg text-danger border-danger-border',
    dot: 'bg-danger',
  },
  info: {
    badge: 'bg-info-bg text-info border-info-border',
    dot: 'bg-info',
  },
  neutral: {
    badge: 'bg-neutral-bg text-neutral border-neutral-border',
    dot: 'bg-neutral',
  },
};

export const resolveStatusVariant = (status) => {
  const s = status?.toString().toLowerCase();
  if (['active', 'approved', 'completed', 'resolved', 'paid', 'present'].includes(s)) return 'success';
  if (['pending', 'in progress', 'open', 'planning', 'half day', 'on hold'].includes(s)) return 'warning';
  if (['inactive', 'rejected', 'blocked', 'cancelled', 'suspended', 'closed', 'unpaid', 'absent'].includes(s)) return 'danger';
  if (['in review', 'review', 'holiday'].includes(s)) return 'info';
  if (['draft', 'todo', 'invited', 'leave'].includes(s)) return 'neutral';
  return 'neutral';
};

const StatusBadge = ({ status }) => {
  if (!status) return null;

  const variant = STATUS_VARIANTS[resolveStatusVariant(status)];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${variant.badge}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${variant.dot}`}></span>
      <span className="capitalize">{status}</span>
    </span>
  );
};

export default StatusBadge;
