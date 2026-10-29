import React from 'react';
import GlassModal from "./ui/GlassModal";
import GlassButton from "./ui/GlassButton";
import { TablePriority, TableStatus, TableAvatar } from "./ui/TableCells";
import Progress from "../projectPortal/Progress";
import { formatDate, isOverdue, taskProgress, getTaskAssignees, personName } from "../projectPortal/helpers";
import { getFileIcon, formatFileSize } from "../utils/fileIcons";
import { downloadFile } from "../utils/downloadFile";

/**
 * TaskDetailModal — read-only task detail using design tokens.
 * Replaces the old hardcoded-color modal.
 */
const TaskDetailModal = ({ task, onClose }) => {
  if (!task) return null;

  const overdue = isOverdue(task?.dueDate, task?.status);
  const assignees = getTaskAssignees(task);

  const shortTitle = task?.title
    ? (task.title.length > 80 ? `${task.title.slice(0, 80)}...` : task.title)
    : "Task Details";

  return (
    <GlassModal
      isOpen={!!task}
      onClose={onClose}
      title={shortTitle}
      description={`Task · ${task?.status || "Backlog"}`}
      maxWidth="max-w-xl sm:max-w-2xl w-full"
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
          <div className="max-h-40 overflow-y-auto custom-scrollbar-visible pr-1.5 rounded-lg bg-card/60 p-2.5 border border-border-subtle">
            <p className="text-sm font-semibold text-heading break-words whitespace-pre-wrap">{task?.title}</p>
          </div>
        </div>

        {/* Description with Scroller */}
        <div>
          <label className="block text-[10px] font-black text-muted mb-1 uppercase tracking-widest">
            Description
          </label>
          <div className="max-h-60 overflow-y-auto custom-scrollbar-visible pr-2 rounded-xl bg-card p-3 border border-border-subtle shadow-inner">
            <p className="text-sm text-main whitespace-pre-wrap break-words">{task?.description || "No description provided"}</p>
          </div>
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
          {assignees.length > 0 ? (
            <div className="flex items-start justify-between py-2 border-b border-border-subtle">
              <span className="text-[10px] font-black text-muted uppercase tracking-widest pt-1">
                Assigned To {assignees.length > 1 ? `(${assignees.length})` : ""}
              </span>
              <div className="flex flex-col items-end gap-2">
                {assignees.map((m, idx) => (
                  <div key={m?._id || m?.id || idx} className="flex items-center gap-2">
                    <TableAvatar name={personName(m)} src={m?.avatar} size="xs" />
                    <span className="text-sm font-semibold text-heading">{personName(m)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between py-2 border-b border-border-subtle">
              <span className="text-[10px] font-black text-muted uppercase tracking-widest">Assigned To</span>
              <span className="text-sm text-muted">Unassigned</span>
            </div>
          )}
        </div>

        {/* Status and Priority */}
        <div className="flex gap-3">
          <div className="flex-1 flex flex-col items-center p-3 bg-card rounded-xl border border-border-subtle">
            <span className="text-[9px] font-black text-muted mb-1 uppercase tracking-widest">Priority</span>
            <TablePriority value={task?.priority || "Medium"} />
          </div>
          <div className="flex-1 flex flex-col items-center p-3 bg-card rounded-xl border border-border-subtle">
            <span className="text-[9px] font-black text-muted mb-1 uppercase tracking-widest">Status</span>
            <TableStatus value={task?.status || "Backlog"} />
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

        {/* Attachments */}
        {task?.attachments?.length > 0 && (
          <div className="pt-2">
            <span className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">
              Attachments ({task.attachments.length})
            </span>
            <div className="space-y-2">
              {task.attachments.map((att, idx) => {
                const name = att.originalname || att.name || `Attachment ${idx + 1}`;
                const source = att.blobName || att.url;
                return (
                  <div
                    key={att._id || att.id || idx}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-surface border border-border-subtle text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {getFileIcon(name, 14)}
                      <span className="truncate font-medium text-heading" title={name}>{name}</span>
                      {att.size && <span className="text-[10px] text-muted">({formatFileSize(att.size)})</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadFile(source, name)}
                      className="text-brand hover:text-brand-text font-semibold shrink-0 text-xs"
                    >
                      Download
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </GlassModal>
  );
};

export default TaskDetailModal;
