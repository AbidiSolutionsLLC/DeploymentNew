import React, { useState, useRef, useEffect, useCallback } from "react";
import { FiChevronDown } from "react-icons/fi";
import { createPortal } from "react-dom";

/**
 * ModernSelect — themed select component using design tokens only.
 * Uses CSS variables (--color-*) for full theme support (light/dark).
 */
const ModernSelect = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = "Select Option",
  required = false,
  className = "",
  error = null,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  const selectedOption = options.find((opt) => opt.value === value);

  const updatePosition = useCallback(() => {
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
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange({
      target: {
        name,
        value: optionValue,
      },
    });
    setIsOpen(false);
  };

  const renderDropdown = () => {
    if (!isOpen) return null;

    return (
      <div
        ref={dropdownRef}
        data-modern-select-dropdown="true"
        className="fixed z-[99999] rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar animate-fadeIn text-left
          bg-card border border-border-subtle"
        style={{
          ...(dropdownPosition.top !== undefined ? { top: `${dropdownPosition.top}px` } : {}),
          ...(dropdownPosition.bottom !== undefined ? { bottom: `${dropdownPosition.bottom}px` } : {}),
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {options.length > 0 ? (
          options.map((opt) => (
            <div
              key={opt.value}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelect(opt.value);
              }}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors text-left
                ${
                  opt.value === value
                    ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-semibold"
                    : "text-main hover:bg-amber-50 dark:hover:bg-amber-900/20"
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
          >
            No options available
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className={`w-full ${className}`} ref={containerRef}>
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
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium outline-none flex justify-between items-center transition-all shadow-sm text-left
              bg-surface
              ${isOpen
                ? "border-amber-400 ring-2 ring-amber-100 dark:ring-amber-500/20"
                : error
                ? "border-red-400 dark:border-red-500"
                : "border-border-subtle hover:border-border-accent"
              }
              border
              ${!selectedOption ? "text-muted" : "text-heading"}
            `}
          >
            <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
            <FiChevronDown
              className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ml-2
                ${isOpen
                  ? "rotate-180 text-amber-500"
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