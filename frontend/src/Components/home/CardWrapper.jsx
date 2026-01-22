import React from "react";

const CardWrapper = ({ title, icon, children, onDelete }) => (
  <div className="relative bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4">
    <div className="flex justify-between items-start mb-3">
      <div className="flex items-center gap-2">
        <span className="text-slate-700 text-sm">{icon}</span>
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">{title}</h3>
      </div>
      <button
        onClick={onDelete}
        className="text-[10px] text-slate-500 hover:text-red-500 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition"
      >
        Remove
      </button>
    </div>
    {children}
  </div>
);

export default CardWrapper;