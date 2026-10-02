import React from 'react';
import GlassModal from "./ui/GlassModal";
import GlassButton from "./ui/GlassButton";
import Pill, { TASK_STATUS_TONE, PRIORITY_TONE } from "../projectPortal/Pill";
import Progress from "../projectPortal/Progress";
import { formatDate, isOverdue, taskProgress, getAssigneeName } from "../projectPortal/helpers";

/**
 * TaskDetailModal — read-only task detail using design tokens.
 * Replaces the old hardcoded-color modal.
 */
const TaskDetailModal = ({ task, onClose }) => {
  if (!task) return null;

  const overdue = isOverdue(task?.dueDate, task?.status);

  return (
    <GlassModal
      isOpen={!!task}
      onClose={onClose}
      title={task?.title}
      description={`Task · ${task?.status}`}
      maxWidth="max-w-md"
      footer={
        <GlassButton variant="secondary" onClick={onClose} className="w-full">
          Close
        </GlassButton>
      }
    >
      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-[10px] font-black text-muted mb-1 uppercase tracking-widest">
            Title
          </label>
          <p className="text-sm font-semibold text-heading">{task?.title}</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-[10px] font-black text-muted mb-1 uppercase tracking-widest">
            Description
          </label>
          <p className="text-sm text-main whitespace-pre-wrap">{task?.description || "No description provided"}</p>
        </div>

        {/* Dates Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-card rounded-xl border border-border-subtle">
            <label className="block text-[9px] font-black text-muted mb-1 uppercase tracking-widest">
              Start Date
            </label>
            <p className="text-xs font-bold text-heading">{formatDate(task?.startDate)}</p>
          </div>
          <div className="p-3 bg-card rounded-xl border border-border-subtle">
            <label className="block text-[9px] font-black text-muted mb-1 uppercase tracking-widest">
              Due Date
            </label>
            <p className={`text-xs font-bold ${overdue ? "text-danger" : "text-heading"}`}>
              {formatDate(task?.dueDate)}
              {overdue && <span className="ml-1 text-danger text-[9px] uppercase">(Overdue)</span>}
            </p>
          </div>
        </div>

        {/* Assignment Info */}
        <div className="space-y-3">
          {(() => {
            const assigneeName = getAssigneeName(task);
            if (!assigneeName || assigneeName === "—") return null;
            return (
              <div className="flex items-center justify-between py-2 border-b border-border-subtle">
                <span className="text-[10px] font-black text-muted uppercase tracking-widest">Assigned To</span>
                <span className="text-sm font-semibold text-heading">{assigneeName}</span>
              </div>
            );
          })()}
        </div>

        {/* Status and Priority */}
        <div className="flex gap-3">
          <div className="flex-1 flex flex-col items-center p-3 bg-card rounded-xl border border-border-subtle">
            <span className="text-[9px] font-black text-muted mb-1 uppercase tracking-widest">Priority</span>
            <Pill tone={PRIORITY_TONE[task?.priority] || "neutral"}>{task?.priority || "Medium"}</Pill>
          </div>
          <div className="flex-1 flex flex-col items-center p-3 bg-card rounded-xl border border-border-subtle">
            <span className="text-[9px] font-black text-muted mb-1 uppercase tracking-widest">Status</span>
            <Pill tone={TASK_STATUS_TONE[task?.status] || "neutral"}>{task?.status || "Todo"}</Pill>
          </div>
        </div>

        {/* Progress */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black text-muted uppercase tracking-widest">Progress</span>
            <span className="text-[10px] font-bold text-muted tabular-nums">{taskProgress(task)}%</span>
          </div>
          <Progress value={taskProgress(task)} />
        </div>
      </div>
    </GlassModal>
  );
};

export default TaskDetailModal;