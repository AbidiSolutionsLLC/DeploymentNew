/**
 * Project Portal — page header card: title block (left) + actions (right),
 * with an optional second row (children, e.g. FilterChips).
 * Stacks on phones: title → actions (full width).
 */
export default function PortalHeader({ eyebrow = "Project workspace", title, subtitle, actions, children }) {
  return (
    <div className="glass-card flex flex-col gap-4 bg-surface">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-brand-text mb-1">
              {eyebrow}
            </p>
          )}
          <h2 className="text-xl sm:text-2xl font-black text-heading tracking-tight">{title}</h2>
          {subtitle && (
            <p className="text-muted text-xs sm:text-sm font-medium mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
