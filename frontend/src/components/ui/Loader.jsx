import React from "react";
import { Loader2 } from "lucide-react";

export default function Loader({ 
  size = "md", 
  variant = "glass", 
  fullPage = false, 
  text = "Loading...",
  className = "" 
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10",
    xl: "w-16 h-16",
  };

  const actualSize = sizeClasses[size] || sizeClasses.md;

  if (variant === "spinner" && !fullPage) {
    return (
      <Loader2 
        className={`${actualSize} animate-spin ${className}`} 
        strokeWidth={2.5}
        role="status"
        aria-label="Loading"
      />
    );
  }

  const loaderContent = (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Outer glowing ring */}
        <div className="absolute inset-0 rounded-full blur-md bg-brand-primary/30 animate-pulse" />
        {/* Inner spinner */}
        <Loader2 
          className={`${actualSize} text-brand-primary animate-spin drop-shadow-sm`} 
          strokeWidth={2.5}
          role="status"
          aria-label="Loading"
        />
      </div>
      {text && (
        <p className="text-sm font-semibold tracking-wide text-brand-text dark:text-brand-primary animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/80 dark:bg-slate-900/80 backdrop-blur-sm transition-all duration-300">
        <div className="p-8 rounded-2xl bg-card border border-border shadow-2xl flex items-center justify-center min-w-[200px]">
          {loaderContent}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8 w-full h-full min-h-[100px]">
      {loaderContent}
    </div>
  );
}
