import React from "react";

export default function GlassButton({
 children,
 variant = "primary", // primary, secondary, danger, ghost
 size = "md", // sm, md, lg
 type = "button",
 className = "",
 isLoading = false,
 disabled = false,
 icon: Icon,
 ...props
}) {
 // Base classes that are applied to all variants
 const baseClasses =
 "inline-flex items-center justify-center font-bold transition-all duration-200 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed";

 // Size classes
 const sizeClasses = {
 sm: "px-3 py-1.5 text-xs",
 md: "px-4 py-2 text-sm",
 lg: "px-6 py-3 text-base uppercase tracking-widest",
 };

 // Variant classes — fully themed for both gold-white & gold-black
 const variantClasses = {
 primary:
 "bg-amber-400 dark:bg-amber-500 text-main dark:text-main shadow-md hover:bg-amber-500 dark:hover:bg-amber-400 hover:-translate-y-px",
 secondary:
 "bg-surface dark:bg-slate-800 text-main dark:text-slate-200 border border-amber-400 dark:border-amber-500 shadow-sm hover:bg-amber-50 dark:hover:bg-slate-700 hover:-translate-y-px",
 danger:
 "bg-red-500 dark:bg-red-600 text-white shadow-md hover:bg-red-600 dark:hover:bg-red-500 hover:-translate-y-px",
 ghost:
 "bg-transparent text-muted dark:text-slate-300 hover:bg-app dark:hover:bg-slate-800 hover:text-main dark:hover:text-white",
 };

 return (
 <button
 type={type}
 disabled={disabled || isLoading}
 className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
 {...props}
 >
 {isLoading ? (
 <svg
 className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
 xmlns="http://www.w3.org/2000/svg"
 fill="none"
 viewBox="0 0 24 24"
 >
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
 <path
 className="opacity-75"
 fill="currentColor"
 d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
 />
 </svg>
 ) : Icon ? (
 <Icon className={`h-4 w-4 ${children ? "mr-2" : ""}`} />
 ) : null}
 {children}
 </button>
 );
}
