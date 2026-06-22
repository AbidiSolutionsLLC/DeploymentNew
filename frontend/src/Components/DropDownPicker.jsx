import React, { useState, useRef, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";

const DropDownPicker = ({
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
 <label className="block text-[10px] font-black text-amber-700/70 mb-2 uppercase tracking-widest">
 {label} {required && <span className="text-red-500">*</span>}
 </label>
 )}

 {/* The Trigger Box */}
 <div className="relative">
 <button
 type="button"
 onClick={() => setIsOpen(!isOpen)}
 className={`w-full bg-surface border rounded-xl px-4 py-3 text-sm font-bold outline-none flex justify-between items-center transition-all shadow-sm
 ${isOpen ? "border-amber-400 ring-2 ring-amber-200 shadow-md bg-surface" : "border-white/60 hover:border-amber-300 hover:bg-surface"}
 ${!selectedOption ? "text-amber-900/50" : "text-amber-900"}
 `}
 >
 <span className="truncate">
 {selectedOption ? selectedOption.label : placeholder}
 </span>
 <FiChevronDown
 className={`w-4 h-4 transition-transform duration-200 ${
 isOpen ? "rotate-180 text-amber-600" : "text-amber-700/50"
 }`}
 />
 </button>

 {/* The Custom Dropdown Menu */}
 {isOpen && (
 <div className="absolute z-50 w-full mt-2 bg-surface border border-white/60 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-h-60 overflow-y-auto custom-scrollbar animate-fadeIn">
 {options.length > 0 ? (
 options.map((opt) => (
 <div
 key={opt.value}
 onClick={() => handleSelect(opt.value)}
 className={`px-4 py-3 text-sm cursor-pointer transition-all duration-200
 ${
 opt.value === value
 ? "bg-amber-500/10 text-amber-700 font-black border-l-4 border-amber-500"
 : "text-amber-900/80 font-medium hover:bg-surface hover:text-amber-700 border-l-4 border-transparent"
 }
 `}
 >
 {opt.label}
 </div>
 ))
 ) : (
 <div className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-amber-700/50 text-center">
 No options available
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 );
};

export default DropDownPicker;