import React from "react";

const CardWrapper = ({ title, icon, children, onDelete }) => (
 <div className="relative bg-surface rounded-[1.2rem] shadow-md border border-amber-100 p-4">
 <div className="flex justify-between items-start mb-3">
 <div className="flex items-center gap-2">
 <span className="text-main text-sm">{icon}</span>
 <h3 className="text-xs font-bold text-main uppercase tracking-tight">{title}</h3>
 </div>
 <button
 onClick={onDelete}
 className="text-[10px] text-muted hover:text-red-500 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition"
 >
 Remove
 </button>
 </div>
 {children}
 </div>
);

export default CardWrapper;