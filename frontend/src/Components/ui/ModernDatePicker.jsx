import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiCalendar } from "react-icons/fi";

// Custom CSS to override default DatePicker styles to match your theme
const customDatePickerStyles = `
  .react-datepicker-wrapper { width: 100%; }
  .react-datepicker {
    font-family: 'Segoe UI', sans-serif;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }
  .react-datepicker__header {
    background-color: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    padding-top: 1rem;
  }
  .react-datepicker__day--selected, .react-datepicker__day--keyboard-selected {
    background-color: #3b82f6 !important; /* Blue-500 */
    border-radius: 0.5rem;
  }
  .react-datepicker__day:hover {
    border-radius: 0.5rem;
  }
  .react-datepicker__triangle { display: none; }
`;

const ModernDatePicker = ({
  label,
  name,
  value,
  onChange,
  placeholder = "Select Date",
  required = false,
  className = "",
}) => {
  // Handle Date Change (Convert standard JS Date to Event-like object for your forms)
  const handleDateChange = (date) => {
    // Format to YYYY-MM-DD for consistency with backend
    const formattedDate = date ? date.toISOString().split("T")[0] : "";
    
    onChange({
      target: {
        name: name,
        value: formattedDate,
      },
    });
  };

  return (
    <div className={`w-full ${className}`}>
      <style>{customDatePickerStyles}</style>

      {/* Label */}
      {label && (
        <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative w-full">
        <DatePicker
          selected={value ? new Date(value) : null}
          onChange={handleDateChange}
          dateFormat="yyyy-MM-dd"
          placeholderText={placeholder}
          required={required}
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pl-10 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300 transition-all shadow-sm hover:border-slate-300"
          popperClassName="z-[99999]" // Ensure it pops over modals
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
        />
        
        {/* Calendar Icon */}
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <FiCalendar className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

export default ModernDatePicker;