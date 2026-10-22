import { ChevronDownIcon, FunnelIcon, XMarkIcon } from "@heroicons/react/24/outline";
import ToolbarSearch from "./ToolbarSearch";

/**
 * Project Portal — shared toolbar card.
 *
 * One visual language for every list page:
 *   row 1 · search (left) + primary actions (right)
 *   row 2 · labelled filters (left) + live count/reset (right)
 *
 * Pages only describe *which* controls they need; the design lives here so
 * Projects, My Tasks and Project Groups can never drift apart again.
 */
export function ToolbarSelect({
  label,
  value,
  onChange,
  options = [],
  ariaLabel,
  className = "",
}) {
  return (
    <label className={`lm-filter-field ${className}`}>
      {label ? <span className="lm-filter-field__label">{label}</span> : null}
      <span className="lm-filter-select-wrap">
        <select
          value={value}
          onChange={onChange}
          aria-label={ariaLabel || label}
          className="lm-filter-select"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="lm-filter-chevron" aria-hidden="true" />
      </span>
    </label>
  );
}

export default function PortalToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters,
  actions,
  showing,
  total,
  countLabel = "items",
  onReset,
  filtersActive = false,
}) {
  const hasCount = typeof showing === "number" && typeof total === "number";

  return (
    <div className="glass-card !p-3.5 sm:!p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <ToolbarSearch
            value={searchValue}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
          />
          {actions ? (
            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">{actions}</div>
          ) : null}
        </div>

        <div className="lm-filterbar border-t border-border-subtle pt-3">
          <span className="lm-filterbar__lead">
            <FunnelIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Filters
          </span>

          <div className="lm-filter-fields">{filters}</div>

          <div className="lm-filterbar__meta">
            {hasCount ? (
              <span className="lm-filterbar__meta-text">
                Showing <b>{showing}</b> of {total} {countLabel}
              </span>
            ) : null}
            {filtersActive && onReset ? (
              <button type="button" onClick={onReset} className="lm-filter-reset">
                <XMarkIcon className="h-3.5 w-3.5" aria-hidden="true" /> Reset
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
