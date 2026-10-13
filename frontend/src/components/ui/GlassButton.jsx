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
  "inline-flex items-center justify-center font-bold transition-all duration-300 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden";

  // Size classes
  const sizeClasses = {
  sm: "px-4 py-2 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base uppercase tracking-wider",
  };

// Variant classes — Light mode: gold theme | Dark mode: bright gold (#FDE68A)
   const variantClasses = {
       primary:
         "bg-[linear-gradient(135deg,#F7E7B4_0%,#EDBB3E_38%,#D9A21F_62%,#F5D77A_100%)] text-black shadow-[0_4px_14px_rgba(217,162,31,0.45),0_0_0_1px_rgba(217,162,31,0.3)] hover:shadow-[0_10px_28px_rgba(217,162,31,0.55),0_0_0_1px_rgba(217,162,31,0.35)] hover:-translate-y-1 active:translate-y-0 active:shadow-[0_3px_10px_rgba(217,162,31,0.4)] dark:bg-[linear-gradient(135deg,#F7E7B4_0%,#EDBB3E_38%,#D9A21F_62%,#F5D77A_100%)] dark:text-slate-900 dark:shadow-[0_4px_14px_rgba(245,215,122,0.4),0_0_0_1px_rgba(217,162,31,0.3)]",
     secondary:
         "bg-[linear-gradient(135deg,#F7E7B4_0%,#EDBB3E_38%,#D9A21F_62%,#F5D77A_100%)] text-black shadow-[0_4px_14px_rgba(217,162,31,0.45),0_0_0_1px_rgba(217,162,31,0.3)] hover:shadow-[0_10px_28px_rgba(217,162,31,0.55),0_0_0_1px_rgba(217,162,31,0.35)] hover:-translate-y-1 active:translate-y-0 active:shadow-[0_3px_10px_rgba(217,162,31,0.4)] dark:bg-[linear-gradient(135deg,#F7E7B4_0%,#EDBB3E_38%,#D9A21F_62%,#F5D77A_100%)] dark:text-slate-900 dark:shadow-[0_4px_14px_rgba(245,215,122,0.4),0_0_0_1px_rgba(217,162,31,0.3)]",
   goldFoil:
         "bg-[linear-gradient(135deg,#F7E7B4_0%,#EDBB3E_38%,#D9A21F_62%,#F5D77A_100%)] text-black shadow-[0_4px_14px_rgba(217,162,31,0.45),0_0_0_1px_rgba(217,162,31,0.3)] hover:shadow-[0_10px_28px_rgba(217,162,31,0.55),0_0_0_1px_rgba(217,162,31,0.35)] hover:-translate-y-1 active:translate-y-0 active:shadow-[0_3px_10px_rgba(217,162,31,0.4)] dark:bg-[linear-gradient(135deg,#F7E7B4_0%,#EDBB3E_38%,#D9A21F_62%,#F5D77A_100%)] dark:text-slate-900 dark:shadow-[0_4px_14px_rgba(245,215,122,0.4),0_0_0_1px_rgba(217,162,31,0.3)]",
       danger:
         "bg-gradient-to-br from-red-600 via-red-700 to-red-800 text-white shadow-[0_4px_14px_rgba(239,68,68,0.35)] hover:from-red-700 hover:via-red-800 hover:to-red-900 hover:shadow-[0_8px_24px_rgba(239,68,68,0.45)] hover:-translate-y-1 active:translate-y-0 dark:from-red-500 dark:via-red-600 dark:to-red-700 dark:hover:from-red-400 dark:hover:via-red-500 dark:hover:to-red-600 dark:shadow-[0_4px_14px_rgba(239,68,68,0.25)] dark:hover:shadow-[0_8px_24px_rgba(239,68,68,0.35)]",
       ghost:
         "bg-transparent text-yellow-700 hover:bg-yellow-100 hover:text-yellow-700 dark:text-amber-300 dark:hover:bg-amber-900/30 dark:hover:text-amber-100",
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
