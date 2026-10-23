import React, { useState, useRef, useEffect, useCallback } from "react";
import { FiChevronDown } from "react-icons/fi";
import { createPortal } from "react-dom";

/**
 * ModernSelect — themed select component using design tokens only.
 * Uses CSS variables (--color-*) for full theme support (light/dark).
 * Supports `variant="badge"` for compact table-field status badges.
 */
const ModernSelect = ({
  label,
  name,
  value,
  onChange,
  onClick,
  options = [],
  placeholder = "Select Option",
  required = false,
  className = "",
  buttonClassName = "",
  error = null,
  disabled = false,
  variant = "default",
}) => {
  const isBadge = variant === "badge";
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  const selectedOption = (options || []).find(
    (opt) =>
      opt.value === value ||
      (typeof opt.value === "string" &&
        typeof value === "string" &&
        opt.value.toLowerCase().replace(/[\s_-]+/g, "") ===
          value.toLowerCase().replace(/[\s_-]+/g, ""))
  );

  const updatePosition = useCallback(() => {
    if (disabled) return;
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const placeAbove = spaceBelow < 200 && rect.top > spaceBelow;

      if (placeAbove) {
        setDropdownPosition({
          top: undefined,
          bottom: window.innerHeight - rect.top + 8,
          left: rect.left,
          width: rect.width,
        });
      } else {
        setDropdownPosition({
          top: rect.bottom + 8,
          bottom: undefined,
          left: rect.left,
          width: rect.width,
        });
      }
    }
  }, [isOpen, disabled]);

  useEffect(() => {
    if (!isOpen || disabled) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, disabled, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (disabled) return;
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [disabled]);

  const handleSelect = (optionValue) => {
    if (disabled) return;
    onChange({
      target: {
        name,
        value: optionValue,
      },
    });
    setIsOpen(false);
  };

  const renderDropdown = () => {
    if (!isOpen || disabled) return null;

    return (
      <div
        ref={dropdownRef}
        data-modern-select-dropdown="true"
        className="fixed z-[99999] rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar animate-fadeIn text-left
          bg-white dark:bg-slate-900 border border-border-subtle dark:border-slate-700"
        style={{
          ...(dropdownPosition.top !== undefined ? { top: `${dropdownPosition.top}px` } : {}),
          ...(dropdownPosition.bottom !== undefined ? { bottom: `${dropdownPosition.bottom}px` } : {}),
          left: `${dropdownPosition.left}px`,
          width: isBadge ? `${Math.max(dropdownPosition.width, 130)}px` : `${dropdownPosition.width}px`,
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {options.length > 0 ? (
          options.map((opt) => (
            <div
              key={opt.value}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelect(opt.value);
              }}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors text-left
                ${
                  opt.value === value
                    ? "bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 font-semibold"
                    : "text-main hover:bg-amber-50/70 dark:hover:bg-slate-800"
                }
              `}
            >
              {opt.label}
            </div>
          ))
        ) : (
          <div
            className="px-4 py-3 text-xs text-center text-muted"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            No options available
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div
        className={`${isBadge ? "w-fit" : "w-full"} ${className}`}
        ref={containerRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Label */}
        {label && (
          <label className="block text-[10px] font-black text-muted mb-2 uppercase tracking-widest">
            {label} {required && <span className="text-danger">*</span>}
          </label>
        )}

        {/* The Trigger Box */}
        <div className="relative">
          <button
            type="button"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              if (onClick) onClick(e);
              if (!disabled) setIsOpen(!isOpen);
            }}
            className={
              isBadge
                ? `lm-success-badge cursor-pointer transition-all hover:opacity-90 outline-none inline-flex items-center justify-between gap-1.5 ${
                    disabled ? "opacity-60 cursor-not-allowed" : ""
                  } ${isOpen ? "ring-2 ring-emerald-400/40" : ""} ${buttonClassName}`
                : `w-full rounded-lg px-4 py-2.5 text-sm font-medium outline-none flex justify-between items-center transition-all shadow-sm text-left
              bg-white dark:bg-slate-800
              ${disabled
                ? "border-border-subtle opacity-60 cursor-not-allowed bg-muted/10 text-muted"
                : isOpen
                ? "border-amber-400 ring-2 ring-amber-100 dark:ring-amber-500/20 text-heading cursor-pointer"
                : error
                ? "border-red-400 dark:border-red-500 text-heading cursor-pointer"
                : "border-border-subtle hover:border-border-accent text-heading cursor-pointer"
              }
              border
              ${!selectedOption && !disabled ? "text-muted" : ""}
              ${buttonClassName}
            `
            }
          >
            <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
            <FiChevronDown
              className={`${
                isBadge ? "w-2.5 h-2.5 opacity-60 ml-1" : "w-4 h-4 ml-2"
              } transition-transform duration-200 flex-shrink-0
                ${disabled
                  ? "text-muted/50"
                  : isOpen
                  ? isBadge
                    ? "rotate-180 text-current"
                    : "rotate-180 text-amber-500"
                  : isBadge
                  ? "text-current"
                  : "text-muted"
                }`}
            />
          </button>
        </div>
      </div>

      {/* Render dropdown via Portal to escape overflow constraints */}
      {typeof document !== "undefined" && createPortal(renderDropdown(), document.body)}
    </>
  );
};

export default ModernSelect;
