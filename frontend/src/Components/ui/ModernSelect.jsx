import React, { useState, useRef, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";
import { createPortal } from "react-dom";

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

  // Find the label for the currently selected value
  const selectedOption = options.find((opt) => opt.value === value);

  // Update dropdown position when open
  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    };

    updatePosition();

    // Update position on scroll
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  // Close dropdown if clicking outside
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

  // Handle selection (mimics a native event so your form works without changes)
  const handleSelect = (optionValue) => {
    onChange({
      target: {
        name: name,
        value: optionValue,
      },
    });
    setIsOpen(false);
  };

  // Dropdown content using Portal
  const renderDropdown = () => {
    if (!isOpen) return null;

    return (
      <div
        ref={dropdownRef}
        data-modern-select-dropdown="true"
        className="fixed z-[99999] bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar animate-fadeIn text-left"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
        }}
        onMouseDown={(e) => e.stopPropagation()} // Prevent mousedown from closing dropdown
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
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }
              `}
            >
              {opt.label}
            </div>
          ))
        ) : (
          <div className="px-4 py-3 text-xs text-slate-400 text-center" onMouseDown={(e) => e.stopPropagation()}>
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
          <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}

        {/* The Trigger Box */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full bg-white border rounded-xl px-4 py-3 text-sm font-medium outline-none flex justify-between items-center transition-all shadow-sm text-left
              ${isOpen ? "border-blue-400 ring-2 ring-blue-100" : (error ? "border-red-400" : "border-slate-200 hover:border-slate-300")}
              ${!selectedOption ? "text-slate-400" : "text-slate-700"}
            `}
          >
            <span className="truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <FiChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ml-2 ${
                isOpen ? "rotate-180 text-blue-500" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Render dropdown via Portal to escape overflow constraints */}
      {typeof document !== 'undefined' && createPortal(
        renderDropdown(),
        document.body
      )}
    </>
  );
};

export default ModernSelect;