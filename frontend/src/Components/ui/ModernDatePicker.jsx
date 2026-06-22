import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiCalendar } from "react-icons/fi";

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
 // Handle Date Change (Convert standard JS Date to Event-like object for your forms)
 const handleDateChange = (date) => {
 // Format to YYYY-MM-DD for consistency with backend
 const formattedDate = date ? date.toLocaleDateString("en-CA") : "";

 onChange({
 target: {
 name: name,
 value: formattedDate,
 },
 });
 };

 return (
 <div className={`w-full ${className}`}>
 {/* Label */}
 {label && (
 <label className="block text-[10px] font-black text-muted dark:text-muted mb-2 uppercase tracking-widest">
 {label} {required && <span className="text-red-500">*</span>}
 </label>
 )}

 {/* Input Container */}
 <div className="relative w-full">
 <DatePicker
 selected={
 value
 ? new Date(value + "T00:00:00")
 : null
 }
 onChange={handleDateChange}
 dateFormat="yyyy-MM-dd"
 placeholderText={placeholder}
 required={required}
 className={`w-full
 bg-surface dark:bg-slate-800
 border ${error ? "border-red-400 dark:border-red-500" : "border-subtle dark:border-slate-600 hover:border-subtle dark:hover:border-slate-500"}
 rounded-xl px-4 py-3 pl-10
 text-sm text-main dark:text-slate-100 font-medium
 outline-none focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-500/20 focus:border-amber-400 dark:focus:border-amber-500
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
 <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted dark:text-muted pointer-events-none">
 <FiCalendar className="w-4 h-4" />
 </div>
 </div>
 </div>
 );
};

export default ModernDatePicker;