import React, { useState } from 'react';

const TaskStatusDropDown = ({ status, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const statuses = ['To Do', 'InProgress', 'Hold', 'UnderReview', 'Completed'];

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleStatusChange = (newStatus) => {
    onChange(newStatus);
    setIsOpen(false);
  };

  const statusColor = {
    'To Do': 'bg-slate-100 text-slate-800',
    Hold: 'bg-slate-100 text-slate-800', // Treated as gray/To Do
    InProgress: 'bg-amber-100 text-amber-800',
    UnderReview: 'bg-purple-100 text-purple-800',
    Completed: 'bg-green-100 text-green-800',
  };

  // Map generic values or missing keys to gray
  const colorClass = statusColor[status] || 'bg-slate-100 text-slate-800';

  return (
    <div className="relative w-full h-full text-left">
      {/* Status Button */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          toggleDropdown();
        }}
        className={`w-full h-full flex items-center justify-center whitespace-nowrap cursor-pointer px-2 py-1 rounded-[0.4rem] text-[9px] font-medium ${colorClass}`}
      >
        {status}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute mt-1 w-full bg-white border border-slate-200 rounded-[0.6rem] shadow-md z-10 overflow-visible">
          {statuses.map((s) => (
            <div
              key={s}
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(s);
              }}
              className="w-full px-2 py-1.5 hover:bg-slate-50 cursor-pointer text-[9px] text-slate-700"
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskStatusDropDown;