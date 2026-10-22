import { FaCalendar, FaComment, FaClock, FaGripLines } from "react-icons/fa";
import { TablePriority } from "../ui/TableCells";
import { shortDate, isOverdue, taskProgress, getAssigneeName } from "./helpers";

/**
 * TaskCard — relaxed compact card for Kanban columns and list view.
 * Uses only design tokens; no hard-coded colors.
 * Supports native HTML5 drag-and-drop for Kanban board.
 */
export default function TaskCard({
  task,
  onClick,
  onOpenComments,
  onDragStart,
  onDragEnd,
  isDragging = false,
  columnId,
  draggable = true,
}) {
  const overdue = isOverdue(task.dueDate, task.status);
  const dueSoon = task.dueDate && new Date(task.dueDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) && !overdue;
  const pct = taskProgress(task);
  const assigneeName = getAssigneeName(task);
  const hasAssignee = assigneeName && assigneeName !== "—";

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("taskId", task._id);
    e.dataTransfer.setData("sourceColumn", columnId || "");
    onDragStart?.(e, task);
  };

  const handleDragEnd = (e) => {
    onDragEnd?.(e);
  };

  return (
    <div
      draggable={draggable}
      className={`p-3.5 rounded-xl shadow-sm border border-border-subtle bg-surface cursor-pointer hover:shadow-md hover:border-border-accent hover:bg-card-hover/20 transition-all duration-200 select-none ${
        isDragging ? "rotate-2 shadow-lg scale-105 z-50 opacity-80 ring-2 ring-brand" : ""
      }`}
      onClick={onClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Header: Title + Priority */}
      <div className="flex items-start justify-between gap-2.5 mb-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {draggable && <FaGripLines className="text-muted/50 cursor-grab flex-shrink-0 mt-1 hover:text-muted transition-colors" aria-hidden="true" />}
          <h4 className="font-semibold text-sm leading-snug break-words text-heading flex-1 min-w-0">
            {task.title}
          </h4>
        </div>
        <div className="shrink-0">
          <TablePriority value={task.priority || "Medium"} />
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs mb-2.5 line-clamp-2 text-muted leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Due date alerts */}
      {overdue && (
        <div className="flex items-center gap-1.5 mb-2.5 px-2.5 py-1 bg-danger-bg border border-danger-border text-danger rounded-lg text-xs font-semibold">
          <FaClock className="w-3 h-3 shrink-0" /> Overdue
        </div>
      )}
      {dueSoon && !overdue && (
        <div className="flex items-center gap-1.5 mb-2.5 px-2.5 py-1 bg-warning-bg border border-warning-border text-warning rounded-lg text-xs font-semibold">
          <FaClock className="w-3 h-3 shrink-0" /> Due Soon
        </div>
      )}

      {/* Footer: Assignee on left; due date, comments & progress on right */}
      <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-border-subtle/80 mt-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {hasAssignee && (
            <div className="flex items-center gap-1.5 min-w-0" title={assigneeName}>
              <div className="w-6 h-6 rounded-full bg-amber-50 border border-border-accent flex items-center justify-center flex-shrink-0 text-brand-text font-black text-xs">
                {assigneeName[0] || "U"}
              </div>
              <span className="text-xs truncate max-w-[95px] text-muted font-medium">{assigneeName}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {task.dueDate && (
            <div className={`flex items-center text-xs font-medium shrink-0 ${overdue ? "text-danger font-semibold" : "text-muted"}`}>
              <FaCalendar className="w-3 h-3 mr-1 shrink-0 opacity-70" />
              <span>{shortDate(task.dueDate)}</span>
            </div>
          )}
          {task.commentsCount > 0 && onOpenComments && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenComments();
              }}
              className="p-1 rounded-md text-muted hover:bg-card-hover hover:text-heading transition-colors"
              aria-label="Comments"
            >
              <FaComment className="w-3.5 h-3.5" />
            </button>
          )}
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-black tabular-nums border ${
              pct === 100
                ? "bg-success-bg border-success-border text-success"
                : "bg-card border-border-subtle text-muted"
            }`}
          >
            {pct}%
          </span>
        </div>
      </div>
    </div>
  );
}