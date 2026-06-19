import React from "react";

export default function GlassLoader({ size = "md", fullPage = false, text = "Loading..." }) {
  const sizeClasses = {
    sm: "w-6 h-6 border-2",
    md: "w-10 h-10 border-3",
    lg: "w-16 h-16 border-4",
  };

  const loader = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div 
        className={`${sizeClasses[size]} rounded-full border-brand-primary/30 border-t-brand-primary animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {text && <p className="text-sm font-semibold text-muted dark:text-slate-400 animate-pulse">{text}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/80 dark:bg-slate-900/80 backdrop-blur-sm">
        {loader}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      {loader}
    </div>
  );
}
