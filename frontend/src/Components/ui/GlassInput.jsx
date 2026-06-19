import React from "react";
import { Search } from "lucide-react";

export default function GlassInput({ 
  placeholder = "Search...", 
  icon: Icon = Search, 
  value, 
  onChange, 
  className = "",
  ...props 
}) {
  return (
    <div className={`relative w-full sm:w-64 ${className}`}>
      {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />}
      <input
        {...props}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="glass-input w-full"
        style={{ paddingLeft: Icon ? '2.75rem' : '1rem' }}
      />
    </div>
  );
}
