import { FaCalendar, FaComment, FaClock } from "react-icons/fa";
import Pill, { TASK_STATUS_TONE, PRIORITY_TONE } from "./Pill";
import Progress from "./Progress";
import { formatDate, isOverdue, taskProgress, personName } from "./helpers";

/**
 * TaskCard — compact card for Kanban columns and list view.
 * Uses only design tokens; no hard-coded colors.
 */
export default function TaskCard({
  task,
  onClick,
  onOpenComments,
  isDragging = false,
}) {
  const overdue = isOverdue(task.dueDate, task.status);
  const dueSoon = task.dueDate && new Date(task.dueDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) && !overdue;
  const pct = taskProgress(task);

  return (
    <div
      className={`p-3 rounded-lg shadow-sm border border-border-subtle cursor-pointer hover:shadow-md hover:bg-amber-50/50 transition-all duration-200 ${isDragging ? "rotate-2 shadow-lg scale-105 z-50 opacity-80" : ""}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-sm leading-tight break-words text-heading flex-1 min-w-0">{task.title}</h4>
        <Pill tone={PRIORITY_TONE[task.priority] || "neutral"}>{task.priority || "Medium"}</Pill>
      </div>

      {/* Description */}
      {task.description && <p className="text-xs mb-2 line-clamp-2 text-muted">{task.description}</p>}

      {/* Due date alerts */}
      {overdue && (
        <div className="flex items-center gap-1 mb-2 px-2 py-1 bg-danger-bg border border-danger-border text-danger rounded text-xs">
          <FaClock className="w-3 h-3" /> Overdue
        </div>
      )}
      {dueSoon && !overdue && (
        <div className="flex items-center gap-1 mb-2 px-2 py-1 bg-warning-bg border border-warning-border text-warning rounded text-xs">
          <FaClock className="w-3 h-3" /> Due Soon
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {task.assignee && (
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-50 border border-border-accent flex items-center justify-center flex-shrink-0">
                <span className="text-brand-text font-black text-xs">{personName(task.assignee)?.[0] || "U"}</span>
              </div>
              <span className="text-xs truncate max-w-[80px] text-muted">{personName(task.assignee)}</span>
            </div>
          )}
          {task.dueDate && (
            <div className="flex items-center">
              <FaCalendar className="w-3 h-3 mr-1 flex-shrink-0 text-muted" />
              <span className={`text-xs whitespace-nowrap ${overdue ? "text-danger" : "text-muted"}`}>
                {formatDate(task.dueDate)}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {task.commentsCount > 0 && onOpenComments && (
            <button
              onClick={(e) => { e.stopPropagation(); onOpenComments(); }}
              className="p-1.5 rounded-lg text-muted hover:bg-card-hover hover:text-heading transition-colors"
              aria-label="Comments"
            >
              <FaComment className="w-3.5 h-3.5" />
            </button>
          )}
          <span className={`px-2 py-1 rounded-full text-[10px] font-black tabular-nums ${pct === 100 ? "bg-success-bg text-success" : "bg-card text-muted"}`}>
            {pct}%
          </span>
        </div>
      </div>
    </div>
  );
}