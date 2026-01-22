import React, { useRef } from 'react';

const TaskDetailModal = ({ task, onClose }) => {
  const modalRef = useRef(null);

  if (!task) return null;

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex justify-center items-center p-4 sm:p-6"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative flex flex-col max-h-[90vh] animate-fadeIn overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-red-500 transition-all text-2xl font-light z-10"
        >
          &times;
        </button>

        {/* Header */}
        <div className="px-6 py-6 sm:px-10 sm:py-8 border-b border-slate-50 text-center flex-shrink-0">
          <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-widest uppercase">
            TASK DETAILS
          </h2>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-10 space-y-6 overflow-y-auto custom-scrollbar">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">
              TITLE
            </label>
            <p className="text-sm sm:text-base text-slate-700 font-medium">
              {task.title}
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">
              DESCRIPTION
            </label>
            <p className="text-sm text-slate-600 leading-relaxed italic">
              {task.description || "no description provided"}
            </p>
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">
                START DATE
              </label>
              <p className="text-xs font-bold text-slate-700">{task.startDate}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <label className="block text-[9px] font-black text-slate-400 mb-1 uppercase tracking-widest">
                END DATE
              </label>
              <p className="text-xs font-bold text-slate-700">{task.endDate}</p>
            </div>
          </div>

          {/* Assignment Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ASSIGNED TO</span>
              <span className="text-sm font-bold text-blue-600">{task.assignee}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ASSIGNED BY</span>
              <span className="text-sm font-bold text-slate-700">{task.assignedBy}</span>
            </div>
          </div>

          {/* Status and Priority Badge Row */}
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col items-center p-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">PRIORITY</span>
              <span className="text-[10px] font-black text-[#64748b] bg-white px-3 py-1 rounded-full shadow-sm uppercase">
                {task.priority}
              </span>
            </div>
            <div className="flex-1 flex flex-col items-center p-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">STATUS</span>
              <span className="text-[10px] font-black text-emerald-600 bg-white px-3 py-1 rounded-full shadow-sm uppercase">
                {task.status}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-6 sm:px-10 sm:py-8 border-t border-slate-100 bg-white flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 sm:py-4 bg-[#64748b] text-white rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest shadow-lg shadow-slate-100 hover:brightness-110 active:scale-95 transition-all"
          >
            CLOSE DETAILS
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;