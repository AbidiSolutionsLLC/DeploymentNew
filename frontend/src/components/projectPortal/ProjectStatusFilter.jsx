import React, { useState, useRef, useEffect, useCallback, useId } from "react";
import { createPortal } from "react-dom";
import {
  FunnelIcon,
  ChevronDownIcon,
  CheckIcon,
  XMarkIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";

/**
 * Status definitions with semantic color tokens and metadata.
 * Colors match the app design system and industry standards (Linear / Jira / GitHub).
 */
export const STATUS_DEFINITIONS = [
  {
    value: "All",
    label: "All Statuses",
    shortLabel: "All",
    dotClass: "bg-slate-400 dark:bg-slate-500",
    ringClass: "ring-slate-400/20",
    glowClass: "",
  },
  {
    value: "Planning",
    label: "Planning",
    shortLabel: "Planning",
    dotClass: "bg-sky-500",
    ringClass: "ring-sky-500/20",
    glowClass: "shadow-[0_0_8px_rgba(14,165,233,0.6)]",
  },
  {
    value: "Active",
    label: "Active",
    shortLabel: "Active",
    dotClass: "bg-emerald-500",
    ringClass: "ring-emerald-500/20",
    glowClass: "shadow-[0_0_8px_rgba(16,185,129,0.6)]",
  },
  {
    value: "On Hold",
    label: "On Hold",
    shortLabel: "On Hold",
    dotClass: "bg-amber-500",
    ringClass: "ring-amber-500/20",
    glowClass: "shadow-[0_0_8px_rgba(245,158,11,0.6)]",
  },
  {
    value: "Completed",
    label: "Completed",
    shortLabel: "Completed",
    dotClass: "bg-teal-500",
    ringClass: "ring-teal-500/20",
    glowClass: "shadow-[0_0_8px_rgba(20,184,166,0.6)]",
  },
  {
    value: "Delayed",
    label: "Delayed",
    shortLabel: "Delayed",
    dotClass: "bg-rose-500",
    ringClass: "ring-rose-500/20",
    glowClass: "shadow-[0_0_8px_rgba(244,63,94,0.6)]",
  },
  {
    value: "Cancelled",
    label: "Cancelled",
    shortLabel: "Cancelled",
    dotClass: "bg-slate-400",
    ringClass: "ring-slate-400/20",
    glowClass: "shadow-[0_0_8px_rgba(148,163,184,0.5)]",
  },
];

export const PROJECT_STATUS_OPTIONS = STATUS_DEFINITIONS.map((s) => ({
  value: s.value,
  label: s.value === "All" ? "Status" : s.label,
}));

/**
 * Industry-standard status filter dropdown (Linear / Jira / GitHub style).
 * Features:
 * - Informative trigger with status dot indicator, "Status: <Value>" label, and quick clear (×) button.
 * - Portal popover dropdown with status dot colors, dynamic real-time counts, and checkmarks.
 * - Keyboard navigation (Esc to close, Arrow keys, Enter to select).
 * - Full dark/light mode integration matching Karbexa's glass design system.
 */
export default function ProjectStatusFilter({
  value = "All",
  onChange,
  counts = {},
  className = "",
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const listboxId = useId();

  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 250,
    placement: "bottom",
  });

  const selectedDef =
    STATUS_DEFINITIONS.find((s) => s.value === value) || STATUS_DEFINITIONS[0];
  const isFiltered = value && value !== "All";

  // Position calculation with viewport boundary safety
  const updatePosition = useCallback(() => {
    if (!isOpen || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dropdownWidth = Math.max(rect.width, 240);
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placeAbove = spaceBelow < 280 && spaceAbove > spaceBelow;

    // Constrain left position to prevent overflowing offscreen
    let left = rect.left;
    if (left + dropdownWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - dropdownWidth - 12);
    }

    setDropdownPosition({
      top: placeAbove ? undefined : rect.bottom + 6,
      bottom: placeAbove ? window.innerHeight - rect.top + 6 : undefined,
      left,
      width: dropdownWidth,
      placement: placeAbove ? "top" : "bottom",
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleScroll = (e) => {
      // Don't close or misposition if scrolling inside dropdown itself
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) return;
      updatePosition();
    };

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, updatePosition]);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Keyboard accessibility
  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
        const idx = STATUS_DEFINITIONS.findIndex((s) => s.value === value);
        setHighlightedIndex(idx >= 0 ? idx : 0);
      }
      return;
    }

    switch (e.key) {
      case "Escape":
      case "Tab":
        setIsOpen(false);
        break;
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < STATUS_DEFINITIONS.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : STATUS_DEFINITIONS.length - 1
        );
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < STATUS_DEFINITIONS.length) {
          handleSelect(STATUS_DEFINITIONS[highlightedIndex].value);
        }
        break;
      default:
        break;
    }
  };

  const handleSelect = (statusVal) => {
    if (disabled) return;
    onChange(statusVal);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("All");
  };

  const renderDropdown = () => {
    if (!isOpen || disabled) return null;

    return (
      <div
        ref={dropdownRef}
        id={listboxId}
        role="listbox"
        aria-label="Filter by project status"
        className={`fixed z-[99999] rounded-2xl shadow-2xl p-1.5 transition-all text-left
          bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl
          border border-border-subtle dark:border-slate-700/80
          focus:outline-none`}
        style={{
          ...(dropdownPosition.top !== undefined
            ? { top: `${dropdownPosition.top}px` }
            : {}),
          ...(dropdownPosition.bottom !== undefined
            ? { bottom: `${dropdownPosition.bottom}px` }
            : {}),
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Popover Header */}
        <div className="flex items-center justify-between px-2.5 py-1.5 mb-1 border-b border-border-subtle/50 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <FunnelIcon className="w-3.5 h-3.5 text-muted" aria-hidden="true" />
            <span className="text-[10px] font-black uppercase tracking-wider text-muted">
              Filter by Status
            </span>
          </div>
          {isFiltered && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        {/* Status Options */}
        <div className="space-y-0.5 max-h-64 overflow-y-auto custom-scrollbar pr-0.5">
          {STATUS_DEFINITIONS.map((opt, index) => {
            const isSelected = opt.value === value;
            const isHighlighted = index === highlightedIndex;
            const count = counts[opt.value];

            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => handleSelect(opt.value)}
                className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all select-none
                  ${
                    isSelected
                      ? "bg-amber-50 dark:bg-amber-950/40 text-heading font-semibold shadow-xs"
                      : isHighlighted
                      ? "bg-amber-50/70 dark:bg-slate-800 text-heading"
                      : "text-main hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }
                `}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {opt.value === "All" ? (
                    <span className="grid h-4 w-4 shrink-0 place-items-center rounded-md bg-muted/10 text-muted group-hover:text-amber-500 transition-colors">
                      <Squares2X2Icon className="h-3 w-3" />
                    </span>
                  ) : (
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ring-2 ${opt.dotClass} ${opt.ringClass} ${
                        isSelected ? opt.glowClass : ""
                      }`}
                    />
                  )}
                  <span className="truncate">{opt.label}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {typeof count === "number" && (
                    <span
                      className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-md transition-colors ${
                        isSelected
                          ? "bg-amber-200/50 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200"
                          : "bg-muted/10 text-muted"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                  {isSelected ? (
                    <CheckIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 font-bold shrink-0" />
                  ) : (
                    <span className="w-4 h-4" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        ref={containerRef}
        className={`relative inline-block ${className}`}
        onKeyDown={handleKeyDown}
      >
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={isOpen ? listboxId : undefined}
          onClick={() => {
            if (!disabled) setIsOpen((prev) => !prev);
          }}
          className={`group flex items-center justify-between gap-2.5 h-[42px] px-3.5 rounded-lg border text-sm font-medium transition-all duration-200 cursor-pointer select-none outline-none
            ${
              disabled
                ? "border-border-subtle opacity-60 cursor-not-allowed bg-muted/10 text-muted"
                : isOpen
                ? "border-amber-400 ring-2 ring-amber-100 dark:ring-amber-500/20 bg-white dark:bg-slate-800 text-heading shadow-sm"
                : isFiltered
                ? "border-amber-400/70 dark:border-amber-500/50 bg-amber-500/[0.04] dark:bg-amber-500/[0.12] text-heading shadow-xs hover:border-amber-500"
                : "border-border-subtle hover:border-border-accent bg-white dark:bg-slate-800 text-main shadow-xs"
            }
          `}
        >
          {/* Left section: Filter icon or Status indicator dot + text */}
          <div className="flex items-center gap-2 min-w-0">
            {isFiltered ? (
              <>
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ring-2 ${selectedDef.dotClass} ${selectedDef.ringClass} ${selectedDef.glowClass}`}
                  aria-hidden="true"
                />
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-xs font-semibold text-muted">Status:</span>
                  <span className="text-xs font-bold text-heading truncate">
                    {selectedDef.shortLabel}
                  </span>
                </div>
              </>
            ) : (
              <>
                <FunnelIcon
                  className="w-4 h-4 text-muted group-hover:text-amber-500 transition-colors shrink-0"
                  aria-hidden="true"
                />
                <span className="text-xs font-semibold text-muted group-hover:text-heading transition-colors">
                  Status
                </span>
              </>
            )}
          </div>

          {/* Right section: Quick Clear (×) when active + Animated Chevron */}
          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            {isFiltered && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleClear(e);
                  }
                }}
                title="Clear status filter"
                aria-label="Clear status filter"
                className="p-0.5 rounded-md text-muted hover:text-danger hover:bg-danger-bg transition-colors"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </span>
            )}
            <ChevronDownIcon
              className={`w-4 h-4 text-muted transition-transform duration-200 shrink-0 ${
                isOpen ? "rotate-180 text-amber-500" : ""
              }`}
              aria-hidden="true"
            />
          </div>
        </button>
      </div>

      {/* Popover listbox rendered into body portal */}
      {typeof document !== "undefined" &&
        createPortal(renderDropdown(), document.body)}
    </>
  );
}
