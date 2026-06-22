import React, { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FiCalendar } from "react-icons/fi";

const GlassDatePicker = ({
 label,
 name,
 selected,
 onChange,
 placeholderText = "Select Date",
 required = false,
 className = "",
 dateFormat = "MM/dd/yyyy",
 ...props
}) => {
 return (
 <div className={`w-full ${className}`}>
 {/* Label */}
 {label && (
 <label className="block text-[10px] font-black text-amber-700/70 mb-2 uppercase tracking-widest">
 {label} {required && <span className="text-red-500">*</span>}
 </label>
 )}

 {/* Date Picker Container */}
 <div className="relative w-full">
 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
 <FiCalendar className="w-4 h-4 text-amber-600" />
 </div>
 
 <DatePicker
 selected={selected}
 onChange={(date) => {
 // Mimic native event for seamless form integration
 if (onChange) {
 onChange({ target: { name, value: date } });
 }
 }}
 placeholderText={placeholderText}
 dateFormat={dateFormat}
 className="w-full bg-surface border border-white/60 rounded-xl pl-11 pr-4 py-3 text-sm font-bold outline-none flex justify-between items-center transition-all shadow-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-200 focus:bg-surface hover:border-amber-300 hover:bg-surface text-amber-900 placeholder:text-amber-900/50"
 calendarClassName="glass-calendar shadow-xl border border-white/60 rounded-xl overflow-hidden font-sans"
 {...props}
 />
 </div>

 {/* Inject custom CSS for the calendar popup to match glassmorphism */}
 <style>{`
 .glass-calendar {
 background-color: rgba(255, 255, 255, 0.9) !important;
 backdrop-filter: blur(12px) !important;
 border-radius: 0.75rem !important;
 border: 1px solid rgba(255, 255, 255, 0.6) !important;
 font-family: inherit !important;
 }
 .react-datepicker__header {
 background-color: rgba(245, 158, 11, 0.1) !important; /* amber-500/10 */
 border-bottom: 1px solid rgba(255, 255, 255, 0.6) !important;
 }
 .react-datepicker__current-month,
 .react-datepicker__day-name {
 color: #78350f !important; /* amber-900 */
 font-weight: 800 !important;
 }
 .react-datepicker__day {
 color: #92400e !important; /* amber-800 */
 font-weight: 600 !important;
 transition: all 0.2s ease-in-out !important;
 }
 .react-datepicker__day:hover {
 background-color: rgba(255, 255, 255, 1) !important;
 color: #d97706 !important; /* amber-600 */
 border-radius: 0.5rem !important;
 }
 .react-datepicker__day--selected,
 .react-datepicker__day--keyboard-selected {
 background-color: #f59e0b !important; /* amber-500 */
 color: white !important;
 border-radius: 0.5rem !important;
 font-weight: 800 !important;
 box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.2), 0 2px 4px -1px rgba(245, 158, 11, 0.1) !important;
 }
 .react-datepicker__navigation-icon::before {
 border-color: #d97706 !important; /* amber-600 */
 }
 .react-datepicker-wrapper {
 width: 100%;
 }
 `}</style>
 </div>
 );
};

export default GlassDatePicker;
