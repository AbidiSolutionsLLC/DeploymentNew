import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiCalendar } from "react-icons/fi";

/**
 * ModernDatePicker — themed date picker using design tokens.
 * Uses CSS variables for full theme support.
 */
const ModernDatePicker = ({
  label,
  name,
  value,
  onChange,
  placeholder = "Select Date",
  required = false,
  className = "",
  error = null,
  maxDate = null,
}) => {
  const handleDateChange = (date) => {
    const formattedDate = date ? date.toLocaleDateString("en-CA") : "";

    onChange({
      target: {
        name,
        value: formattedDate,
      },
    });
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-[10px] font-black text-muted mb-2 uppercase tracking-widest">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative w-full">
        <DatePicker
          selected={value ? new Date(value + "T00:00:00") : null}
          onChange={handleDateChange}
          dateFormat="yyyy-MM-dd"
          placeholderText={placeholder}
          required={required}
          className={`w-full
            bg-surface
            border ${error ? "border-red-400 dark:border-red-500" : "border-border-subtle hover:border-border-accent"}
            rounded-xl px-4 py-3 pl-10
            text-sm text-main font-medium
            outline-none focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-500/20 focus:border-amber-400
            placeholder:text-slate-300 dark:placeholder:text-muted
            transition-all shadow-sm`}
          popperClassName="z-[99999]"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          portalId="portal-root"
          maxDate={maxDate}
        />

        {/* Calendar Icon */}
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
          <FiCalendar className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

export default ModernDatePicker;