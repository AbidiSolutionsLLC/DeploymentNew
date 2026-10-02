/**
 * Project Portal — page header card: title block (left) + actions (right),
 * with an optional second row (children, e.g. FilterChips).
 * Stacks on phones: title → actions (full width).
 */
export default function PortalHeader({ title, subtitle, actions, children }) {
  return (
    <div className="glass-card flex flex-col gap-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-heading uppercase tracking-tight">{title}</h2>
          {subtitle && (
            <p className="text-muted text-[10px] sm:text-xs font-medium uppercase tracking-wide mt-1">
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
