import React from "react";

export default function GlassCard({ 
  children, 
  className = "", 
  title, 
  action, 
  noPadding = false 
}) {
  return (
    <div className={`glass-card flex flex-col ${noPadding ? "p-0" : ""} ${className}`}>
      {(title || action) && (
        <div className={`flex items-center justify-between border-b border-border-subtle pb-4 mb-4 ${noPadding ? "p-4" : ""}`}>
          {title && <h3 className="text-lg font-bold text-heading dark:text-white">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={`flex-1 ${noPadding ? "p-4" : ""}`}>
        {children}
      </div>
    </div>
  );
}
