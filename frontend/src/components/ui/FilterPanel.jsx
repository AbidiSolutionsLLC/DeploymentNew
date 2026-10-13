import React from "react";
import { Info } from "lucide-react";

/**
 * Standard filter/action panel used on every admin list page:
 * glass card with a title + subtitle, right aligned action buttons,
 * a divider, a filter row (children) and an optional hint line.
 */
export default function FilterPanel({ title, subtitle, actions, hint, children }) {
  return (
    /* `relative z-30` keeps the panel (and any calendar dropdown opened from
       it) painted above the table that follows it — both are glass cards with
       backdrop-filter, so without an explicit z-index the later table wins
       and the picker renders behind it. */
    <div className="glass-card relative z-30">
      {(title || subtitle || actions) && (
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            {title && (
              <span className="mt-1 w-1 h-4 rounded-full bg-brand flex-shrink-0" aria-hidden="true" />
            )}
            <div className="min-w-0">
              {title && (
                <h2 className="text-sm font-bold text-heading tracking-tight leading-snug">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-xs font-medium text-muted mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex flex-wrap items-center justify-end gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}

      {children && (
        <div className="mt-3.5 pt-3.5 border-t border-border-subtle">{children}</div>
      )}

      {hint && (
        <p className="flex items-start gap-1.5 text-[11px] font-medium text-muted mt-3 leading-relaxed">
          <Info size={12} className="mt-0.5 flex-shrink-0 opacity-70" aria-hidden="true" />
          <span>{hint}</span>
        </p>
      )}
    </div>
  );
}
