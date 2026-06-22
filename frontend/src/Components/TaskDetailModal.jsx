import React from 'react';
import GlassModal from "./ui/GlassModal";
import GlassButton from "./ui/GlassButton";

const TaskDetailModal = ({ task, onClose }) => {
 if (!task) return null;

 return (
 <GlassModal
 isOpen={!!task}
 onClose={onClose}
 title="TASK DETAILS"
 maxWidth="max-w-md"
 footer={
 <GlassButton variant="secondary" onClick={onClose} className="w-full">
 CLOSE DETAILS
 </GlassButton>
 }
 >
 <div className="space-y-6">
 {/* Title */}
 <div>
 <label className="block text-[10px] font-black text-muted dark:text-muted mb-1 uppercase tracking-widest">
 TITLE
 </label>
 <p className="text-sm sm:text-base text-heading dark:text-white font-medium">
 {task.title}
 </p>
 </div>

 {/* Description */}
 <div>
 <label className="block text-[10px] font-black text-muted dark:text-muted mb-1 uppercase tracking-widest">
 DESCRIPTION
 </label>
 <p className="text-sm text-muted dark:text-muted leading-relaxed italic">
 {task.description || "no description provided"}
 </p>
 </div>

 {/* Dates Grid */}
 <div className="grid grid-cols-2 gap-4">
 <div className="p-3 bg-surface/50 dark:bg-slate-800/50 rounded-xl border border-border-subtle dark:border-slate-700">
 <label className="block text-[9px] font-black text-muted dark:text-muted mb-1 uppercase tracking-widest">
 START DATE
 </label>
 <p className="text-xs font-bold text-heading dark:text-white">{task.startDate}</p>
 </div>
 <div className="p-3 bg-surface/50 dark:bg-slate-800/50 rounded-xl border border-border-subtle dark:border-slate-700">
 <label className="block text-[9px] font-black text-muted dark:text-muted mb-1 uppercase tracking-widest">
 END DATE
 </label>
 <p className="text-xs font-bold text-heading dark:text-white">{task.endDate}</p>
 </div>
 </div>

 {/* Assignment Info */}
 <div className="space-y-4">
 <div className="flex items-center justify-between border-b border-border-subtle dark:border-slate-700 pb-2">
 <span className="text-[10px] font-black text-muted dark:text-muted uppercase tracking-widest">ASSIGNED TO</span>
 <span className="text-sm font-bold text-brand-primary">{task.assignee}</span>
 </div>
 <div className="flex items-center justify-between border-b border-border-subtle dark:border-slate-700 pb-2">
 <span className="text-[10px] font-black text-muted dark:text-muted uppercase tracking-widest">ASSIGNED BY</span>
 <span className="text-sm font-bold text-heading dark:text-white">{task.assignedBy}</span>
 </div>
 </div>

 {/* Status and Priority Badge Row */}
 <div className="flex gap-3">
 <div className="flex-1 flex flex-col items-center p-3 bg-surface/50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-border-subtle dark:border-slate-700">
 <span className="text-[9px] font-black text-muted dark:text-muted uppercase tracking-widest mb-1">PRIORITY</span>
 <span className="text-[10px] font-black text-brand-secondary bg-brand-secondary/10 px-3 py-1 rounded-full shadow-sm uppercase">
 {task.priority}
 </span>
 </div>
 <div className="flex-1 flex flex-col items-center p-3 bg-surface/50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-border-subtle dark:border-slate-700">
 <span className="text-[9px] font-black text-muted dark:text-muted uppercase tracking-widest mb-1">STATUS</span>
 <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1 rounded-full shadow-sm uppercase">
 {task.status}
 </span>
 </div>
 </div>
 </div>
 </GlassModal>
 );
};

export default TaskDetailModal;