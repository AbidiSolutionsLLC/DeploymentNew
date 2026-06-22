import React from "react";
import { ChevronDown } from "lucide-react";

export default function GlassSelect({ 
 options = [], 
 value, 
 onChange, 
 label,
 className = "",
 ...props 
}) {
 return (
 <div className={`flex items-center gap-2 ${className}`}>
 {label && <label className="text-xs font-medium text-main uppercase tracking-wide">{label}</label>}
 <div className="relative">
 <select
 {...props}
 value={value}
 onChange={onChange}
 className="appearance-none glass-input pr-8 text-sm cursor-pointer"
 >
 {options.map((opt) => (
 <option key={opt.value || opt} value={opt.value || opt} className="text-main bg-surface dark:bg-slate-800">
 {opt.label || opt}
 </option>
 ))}
 </select>
 <ChevronDown className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
 </div>
 </div>
 );
}
