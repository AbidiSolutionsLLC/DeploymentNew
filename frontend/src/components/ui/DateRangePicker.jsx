import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from "lucide-react";

const DateRangePicker = ({
  startDate,
  endDate,
  onChange,
  placeholder = "Select Date Range",
  className = ""
}) => {
  return (
    <div className={`flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2.5 h-[42px] min-w-[240px] hover:border-slate-300 dark:hover:border-slate-600 focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-500 transition-all shadow-sm ${className}`}>
      <Calendar size={16} className="text-slate-400 dark:text-slate-500 mr-2 flex-shrink-0" />
      <DatePicker
        selectsRange={true}
        startDate={startDate}
        endDate={endDate}
        onChange={onChange}
        dateFormat="MMM d, yyyy"
        className="w-full bg-transparent border-none text-sm font-medium text-slate-800 dark:text-slate-100 outline-none cursor-pointer !py-0 !px-0 !rounded-none !shadow-none"
        placeholderText={placeholder}
      />
    </div>
  );
};

export default DateRangePicker;
