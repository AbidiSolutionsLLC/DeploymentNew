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
  const baseClasses = "inline-flex items-center justify-center font-bold transition-all duration-200 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  // Size classes
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base uppercase tracking-widest", // Matches the .btn in index.css
  };

  // Variant classes
  const variantClasses = {
    primary: "bg-brand-primary text-white shadow-md hover:bg-brand-accent hover:-translate-y-px",
    secondary: "bg-white/80 text-main border border-brand-primary shadow-sm backdrop-blur-md hover:bg-brand-primary/10 hover:-translate-y-px dark:bg-slate-800/80 dark:text-white dark:border-brand-primary",
    danger: "bg-red-500 text-white shadow-md hover:bg-red-600 hover:-translate-y-px",
    ghost: "bg-transparent text-main hover:bg-surface/50 dark:text-white dark:hover:bg-slate-800/50",
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : Icon ? (
        <Icon className={`h-4 w-4 ${children ? "mr-2" : ""}`} />
      ) : null}
      {children}
    </button>
  );
}
