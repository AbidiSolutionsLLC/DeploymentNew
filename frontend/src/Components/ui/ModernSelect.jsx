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

 // Detect dark mode from the root element
 const isDark = () => document.documentElement.classList.contains("dark");

 // Update dropdown position when open
 useEffect(() => {
 const updatePosition = () => {
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
 const dark = isDark();

 return (
 <div
 ref={dropdownRef}
 data-modern-select-dropdown="true"
 className={`fixed z-[99999] rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar animate-fadeIn text-left
 ${dark
 ? "bg-slate-800 border border-slate-700 shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
 : "bg-surface border border-slate-100 shadow-xl"
 }`}
 style={{
 ...(dropdownPosition.top !== undefined ? { top: `${dropdownPosition.top}px` } : {}),
 ...(dropdownPosition.bottom !== undefined ? { bottom: `${dropdownPosition.bottom}px` } : {}),
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
 ? dark
 ? "bg-amber-500/20 text-amber-400 font-semibold"
 : "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-semibold"
 : dark
 ? "text-slate-300 hover:bg-slate-700 hover:text-white"
 : "text-muted hover:bg-app hover:text-main"
 }
 `}
 >
 {opt.label}
 </div>
 ))
 ) : (
 <div
 className={`px-4 py-3 text-xs text-center ${dark ? "text-muted" : "text-muted"}`}
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
 <label className="block text-[10px] font-black text-muted dark:text-muted mb-2 uppercase tracking-widest">
 {label} {required && <span className="text-red-500">*</span>}
 </label>
 )}

 {/* The Trigger Box */}
 <div className="relative">
 <button
 type="button"
 onClick={() => setIsOpen(!isOpen)}
 className={`w-full rounded-xl px-4 py-3 text-sm font-medium outline-none flex justify-between items-center transition-all shadow-sm text-left
 bg-surface dark:bg-slate-800
 ${isOpen
 ? "border-amber-400 ring-2 ring-amber-100 dark:ring-amber-500/20 dark:border-amber-500"
 : error
 ? "border-red-400 dark:border-red-500"
 : "border-subtle dark:border-slate-600 hover:border-subtle dark:hover:border-slate-500"
 }
 border
 ${!selectedOption
 ? "text-muted dark:text-muted"
 : "text-main dark:text-slate-100"
 }
 `}
 >
 <span className="truncate">
 {selectedOption ? selectedOption.label : placeholder}
 </span>
 <FiChevronDown
 className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ml-2
 ${isOpen
 ? "rotate-180 text-amber-500 dark:text-amber-400"
 : "text-muted dark:text-muted"
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