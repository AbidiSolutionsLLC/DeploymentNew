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
  Completed: 'lm-success-badge',
  InProgress: 'lm-success-badge',
  Hold: 'lm-success-badge',
  UnderReview: 'lm-success-badge',
};

 return (
 <div className="relative w-full h-full text-left">
 {/* Status Button */}
 <div
 onClick={(e) => {
 e.stopPropagation();
 toggleDropdown();
 }}
 className={`w-full h-full flex items-center justify-center whitespace-nowrap cursor-pointer px-2 py-1 rounded-[0.4rem] text-[9px] font-medium ${statusColor[status] || 'bg-slate-200 text-main'}`}
 >
 {status}
 </div>

 {/* Dropdown */}
 {isOpen && (
 <div className="absolute mt-1 w-full bg-white dark:bg-slate-900 border border-border-subtle dark:border-slate-700 rounded-[0.6rem] shadow-xl z-20 overflow-hidden">
 {statuses.map((s) => (
 <div
 key={s}
 onClick={(e) => {
 e.stopPropagation();
 handleStatusChange(s);
 }}
 className="w-full px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-[9px] text-main"
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