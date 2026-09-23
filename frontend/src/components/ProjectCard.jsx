import React from 'react';

const ProjectCard = ({ title, value, badgeColor, icon }) => {
  return (
    <div className="w-full bg-surface border border-border-subtle rounded-xl shadow-sm p-5 hover:border-brand/30 transition-all group overflow-hidden relative">
      {/* Decorative subtle background element */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-150 ${badgeColor}`}></div>
      
      <div className="flex items-center gap-4 relative z-10">
        {/* Icon */}
        <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${badgeColor} bg-opacity-20 text-brand`}>
          {icon}
        </div>
        
        {/* Content */}
        <div className="flex flex-col flex-grow">
          <p className="text-sm font-semibold text-muted uppercase tracking-wider">{title}</p>
          <div className="flex items-end gap-2 mt-1">
            <span className="text-2xl font-bold text-heading">{value}</span>
            <span className="text-xs font-medium text-muted mb-1">Total</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;

// import React from "react";

// const ProjectCard = ({ title, value, icon, badgeColor }) => {
// return (
// <div className="w-full p-4 sm:p-5 bg-surface rounded-lg shadow flex items-center justify-between">
// {/* Left: Icon + Title */}
// <div className="flex items-center gap-3">
// <div className={`p-2 rounded-full ${badgeColor}`}>
// {icon}
// </div>
// <div className="text-sm sm:text-base font-semibold text-main">
// {title}
// </div>
// </div>

// {/* Optional Divider */}
// <div className="w-px h-8 bg-gray-200 mx-2 hidden sm:block"></div>

// {/* Right: Value */}
// <div className="text-lg font-bold text-heading">{value}</div>
// </div>
// );
// };

// export default ProjectCard;

