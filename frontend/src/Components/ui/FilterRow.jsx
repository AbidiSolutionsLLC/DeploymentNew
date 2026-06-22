import React from "react";

/**
 * FilterRow - Standardized filter bar wrapper for the Admin Panel.
 * Wraps any combination of GlassInput, ModernSelect, DatePicker, etc.
 * Enforces consistent flex layout, gap, and responsive wrap.
 *
 * @param {React.ReactNode} children - Filter controls to render
 * @param {string} className - Optional extra classes
 */
export default function FilterRow({ children, className = "" }) {
 return (
 <div
 className={`flex flex-wrap items-center gap-3 w-full ${className}`}
 >
 {children}
 </div>
 );
}
