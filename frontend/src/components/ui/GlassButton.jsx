import React from "react";
import Loader from "./Loader";

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
  "inline-flex items-center justify-center font-bold transition-all duration-200 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed";

 // Size classes
 const sizeClasses = {
 sm: "px-3 py-1.5 text-xs",
 md: "px-4 py-2 text-sm",
 lg: "px-6 py-3 text-base uppercase tracking-widest",
 };

  // Variant classes — fully themed for both golden white & golden black
   const variantClasses = {
     primary:
       "bg-brand text-on-brand shadow-md hover:bg-brand-accent hover:-translate-y-px",
     secondary:
       "bg-surface text-main border border-border-primary shadow-sm hover:bg-card-hover hover:-translate-y-px",
     danger:
       "bg-[var(--color-error)] text-white shadow-md hover:brightness-90 hover:-translate-y-px",
     ghost:
       "bg-transparent text-muted hover:bg-card-hover hover:text-main",
   };


 return (
 <button
 type={type}
 disabled={disabled || isLoading}
 className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
 {...props}
 >
 {isLoading ? (
 <Loader variant="spinner" size="sm" className="-ml-1 mr-2 text-current" />
 ) : Icon ? (
 <Icon className={`h-4 w-4 ${children ? "mr-2" : ""}`} />
 ) : null}
 {children}
 </button>
 );
}
