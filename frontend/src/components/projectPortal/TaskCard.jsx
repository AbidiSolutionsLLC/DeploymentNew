import { FaCalendar, FaComment, FaClock, FaGripLines, FaFlag } from "react-icons/fa";
import { TablePriority, TableAvatar } from "../ui/TableCells";
import { shortDate, isOverdue, taskProgress, getTaskAssignee, getAssigneeName } from "./helpers";

/**
 * TaskCard — polished compact card for Kanban columns and list view.
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
  const assignee = getTaskAssignee(task);
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

  const getStatusColor = (status) => {
    const statusLower = (status || "").toLowerCase();
    switch (statusLower) {
      case "backlog": return "bg-neutral";
      case "todo": return "bg-amber-500";
      case "in progress": return "bg-info";
      case "in review": return "bg-warning";
      case "done": return "bg-success";
      default: return "bg-neutral";
    }
  };

  const statusColor = getStatusColor(task.status);

  return (
    <div
      draggable={draggable}
      className={`p-3.5 rounded-xl shadow-sm border border-border-subtle bg-surface cursor-pointer hover:shadow-md hover:border-border-accent hover:bg-card-hover/20 transition-all duration-200 select-none relative ${
        isDragging ? "rotate-2 shadow-lg scale-105 z-50 opacity-80 ring-2 ring-brand" : ""
      }`}
      onClick={onClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Status indicator bar on left */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${statusColor} opacity-80`} aria-hidden="true" />

      {/* Header: Drag handle + Title + Priority */}
      <div className="flex items-start justify-between gap-2.5 mb-2.5 pl-1">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {draggable && (
            <FaGripLines 
              className="text-muted/50 cursor-grab flex-shrink-0 mt-1 hover:text-muted transition-colors" 
              aria-hidden="true" 
              aria-label="Drag to reorder"
            />
          )}
          <h4 className="font-semibold text-sm leading-snug text-heading overflow-hidden line-clamp-1 flex-1 min-w-0">
            {task.title}
          </h4>
        </div>
        <div className="shrink-0 flex items-center gap-1.5">
          <TablePriority value={task.priority || "Medium"} />
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs mb-2.5 line-clamp-2 text-muted leading-relaxed pl-1">
          {task.description}
        </p>
      )}

      {/* Due date alerts */}
      {overdue && (
        <div className="flex items-center gap-1.5 mb-2.5 px-2.5 py-1.5 bg-danger-bg border border-danger-border text-danger rounded-lg text-xs font-medium pl-1">
          <FaClock className="w-3 h-3 shrink-0" /> Overdue
        </div>
      )}
      {dueSoon && !overdue && (
        <div className="flex items-center gap-1.5 mb-2.5 px-2.5 py-1.5 bg-warning-bg border border-warning-border text-warning rounded-lg text-xs font-medium pl-1">
          <FaClock className="w-3 h-3 shrink-0" /> Due Soon
        </div>
      )}

      {/* Footer: Assignee on left; due date, comments & progress on right */}
      <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-border-subtle/80 mt-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1 pl-1">
          {hasAssignee && (
            <div className="flex items-center gap-1.5 min-w-0" title={assigneeName}>
              <TableAvatar name={assigneeName} src={assignee?.avatar} size="xs" />
              <span className="text-xs truncate max-w-[100px] text-muted font-medium">{assigneeName}</span>
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
              className="p-1.5 rounded-md text-muted hover:bg-card-hover hover:text-heading transition-colors"
              aria-label={`View ${task.commentsCount} comment${task.commentsCount !== 1 ? "s" : ""}`}
            >
              <FaComment className="w-4 h-4" />
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