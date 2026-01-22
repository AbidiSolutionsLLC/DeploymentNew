import React, { useState } from 'react';

const TaskStatusDropDown = ({ status, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const statuses = ['InProgress', 'Hold', 'UnderReview', 'Completed'];

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleStatusChange = (newStatus) => {
    onChange(newStatus);
    setIsOpen(false);
  };

  const statusColor = {
    Completed: 'bg-green-100 text-green-800',
    InProgress: 'bg-slate-200 text-slate-800',
    Hold: 'bg-red-100 text-red-800',
    UnderReview: 'bg-amber-100 text-amber-800',
  };

  return (
    <div className="relative w-full h-full text-left">
      {/* Status Button */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          toggleDropdown();
        }}
        className={`w-full h-full flex items-center justify-center whitespace-nowrap cursor-pointer px-2 py-1 rounded-[0.4rem] text-[9px] font-medium ${statusColor[status] || 'bg-slate-200 text-slate-800'}`}
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