import React, { useState, useRef, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";

const ModernSelect = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = "Select Option",
  required = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Find the label for the currently selected value
  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
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

  return (
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
          className={`w-full bg-white border rounded-xl px-4 py-3 text-sm font-medium outline-none flex justify-between items-center transition-all shadow-sm
            ${isOpen ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300"}
            ${!selectedOption ? "text-slate-400" : "text-slate-700"}
          `}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <FiChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-blue-500" : ""
            }`}
          />
        </button>

        {/* The Custom Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar animate-fadeIn">
            {options.length > 0 ? (
              options.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`px-4 py-2.5 text-sm cursor-pointer transition-colors
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
              <div className="px-4 py-3 text-xs text-slate-400 text-center">
                No options available
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernSelect;