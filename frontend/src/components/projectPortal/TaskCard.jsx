import React, { useState, useRef, useEffect, useMemo } from "react";
import { FaCalendar, FaComment, FaClock, FaGripLines } from "react-icons/fa";
import {
  LinkIcon,
  ChevronDownIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  EyeIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import { TablePriority, TableAvatar, TableStatus } from "../ui/TableCells";
import { shortDate, isOverdue, taskProgress, getTaskAssignee, getAssigneeName } from "./helpers";
import { getDependentTasks, getPrerequisiteTasks, isStatusDone } from "../../utils/taskHierarchy";

/**
 * TaskCard — polished compact card for Kanban columns and list view.
 * Supports native HTML5 drag-and-drop, dependency badges, and interactive popovers.
 */
export default function TaskCard({
  task,
  onClick,
  onOpenComments,
  onDragStart,
  onDragEnd,
  isDragging = false,
  isHighlighted = false,
  columnId,
  draggable = true,
  allTasks = [],
  onLocateTask,
}) {
  const [showDependentsPop, setShowDependentsPop] = useState(false);
  const popoverRef = useRef(null);

  const overdue = isOverdue(task.dueDate, task.status);
  const dueSoon =
    task.dueDate &&
    new Date(task.dueDate) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) &&
    !overdue;
  const pct = taskProgress(task);
  const assignee = getTaskAssignee(task);
  const assigneeName = getAssigneeName(task);
  const hasAssignee = assigneeName && assigneeName !== "—";

  // Sub-dependent tasks (tasks waiting on this task)
  const dependentTasks = useMemo(() => {
    return getDependentTasks(task._id, allTasks);
  }, [task._id, allTasks]);

  // Prerequisite tasks (tasks this task depends on)
  const prerequisites = useMemo(() => {
    return getPrerequisiteTasks(task, allTasks);
  }, [task.dependencies, allTasks]);

  const unresolvedPrerequisites = useMemo(() => {
    return prerequisites.filter((p) => !isStatusDone(p.status));
  }, [prerequisites]);

  // Close popover when clicking outside
  useEffect(() => {
    if (!showDependentsPop) return;
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setShowDependentsPop(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDependentsPop]);

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
      case "backlog":
        return "bg-neutral";
      case "todo":
        return "bg-amber-500";
      case "in progress":
        return "bg-info";
      case "in review":
        return "bg-warning";
      case "done":
        return "bg-success";
      default:
        return "bg-neutral";
    }
  };

  const statusColor = getStatusColor(task.status);

  return (
    <div
      id={`kanban-task-${task._id}`}
      draggable={draggable}
      className={`p-4 rounded-2xl shadow-sm border bg-surface cursor-pointer hover:shadow-md hover:border-border-accent hover:bg-card-hover/20 transition-all duration-200 select-none relative ${
        showDependentsPop ? "z-30" : "z-10"
      } ${
        isDragging ? "rotate-2 shadow-lg scale-105 z-50 opacity-80 ring-2 ring-brand" : ""
      } ${
        isHighlighted
          ? "ring-2 ring-brand ring-offset-2 scale-[1.02] shadow-lg border-brand animate-pulse bg-brand/5"
          : "border-border-subtle"
      }`}
      onClick={onClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Status indicator bar on left */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${statusColor} opacity-80`}
        aria-hidden="true"
      />

      {/* Header: Drag handle + Title + Priority */}
      <div className="flex items-start justify-between gap-2.5 mb-2 pl-1">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {draggable && (
            <FaGripLines
              className="text-muted/50 cursor-grab flex-shrink-0 mt-1 hover:text-muted transition-colors"
              aria-hidden="true"
              aria-label="Drag to reorder"
            />
          )}
          <h4 className="font-semibold text-sm leading-snug text-heading overflow-hidden line-clamp-2 flex-1 min-w-0">
            {task.title}
          </h4>
        </div>
        <div className="shrink-0 flex items-center gap-1.5">
          <TablePriority value={task.priority || "Medium"} />
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs mb-2 line-clamp-2 text-muted leading-relaxed pl-1">
          {task.description}
        </p>
      )}

      {/* Prerequisite Blocker Alert (if task is waiting on unfinished prerequisites) */}
      {unresolvedPrerequisites.length > 0 && (
        <div
          className="flex items-center gap-1.5 mb-2 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-600 rounded-lg text-[11px] font-semibold pl-2"
          title={`Waiting on: ${unresolvedPrerequisites.map((p) => p.title).join(", ")}`}
        >
          <ExclamationCircleIcon className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            Blocked by: {unresolvedPrerequisites[0].title}
            {unresolvedPrerequisites.length > 1 && ` (+${unresolvedPrerequisites.length - 1})`}
          </span>
        </div>
      )}

      {/* Prerequisites Finished Badge */}
      {prerequisites.length > 0 && unresolvedPrerequisites.length === 0 && (
        <div className="flex items-center gap-1 mb-2 px-2 py-0.5 bg-success-bg border border-success-border text-success rounded-md text-[10px] font-bold">
          <CheckCircleIcon className="w-3 h-3 shrink-0" />
          <span>Prerequisites ready</span>
        </div>
      )}

      {/* Due date alerts */}
      {overdue && (
        <div className="flex items-center gap-1.5 mb-2 px-2.5 py-1.5 bg-danger-bg border border-danger-border text-danger rounded-lg text-xs font-medium pl-1">
          <FaClock className="w-3 h-3 shrink-0" /> Overdue
        </div>
      )}
      {dueSoon && !overdue && (
        <div className="flex items-center gap-1.5 mb-2 px-2.5 py-1.5 bg-warning-bg border border-warning-border text-warning rounded-lg text-xs font-medium pl-1">
          <FaClock className="w-3 h-3 shrink-0" /> Due Soon
        </div>
      )}

      {/* Sub-dependent Tasks Dropdown Pill (monday.com / Linear pattern) */}
      {dependentTasks.length > 0 && (
        <div className="relative mb-2 pl-1" ref={popoverRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowDependentsPop((v) => !v);
            }}
            className={`w-full inline-flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
              showDependentsPop
                ? "border-brand bg-amber-500/10 text-brand-text shadow-sm"
                : "border-border-subtle bg-card text-muted hover:text-heading hover:border-border-accent"
            }`}
            title="Click to view sub-dependent tasks"
          >
            <div className="inline-flex items-center gap-1.5 min-w-0">
              <LinkIcon className="w-3.5 h-3.5 text-brand shrink-0" />
              <span className="truncate">
                {dependentTasks.length} Sub-dependent{dependentTasks.length > 1 ? "s" : ""}
              </span>
            </div>
            <ChevronDownIcon
              className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                showDependentsPop ? "rotate-180 text-brand" : "text-muted"
              }`}
            />
          </button>

          {/* Floating Dropdown Overlay: matches horizontal width (left-0 right-0), expands vertically without stretching card height */}
          {showDependentsPop && (
            <div
              className="absolute left-0 right-0 top-full mt-1.5 p-2.5 rounded-xl bg-surface/95 backdrop-blur-md border border-border-accent shadow-2xl z-50 flex flex-col gap-2 transition-all duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-border-subtle">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted truncate">
                  Sub-dependents ({dependentTasks.length})
                </span>
                <span className="text-[9px] text-muted shrink-0">Waiting on this</span>
              </div>

              <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto pr-0.5 custom-scrollbar">
                {dependentTasks.map((dep) => (
                  <div
                    key={dep._id}
                    className="p-2 rounded-lg border border-border-subtle bg-card hover:bg-card-hover transition-colors flex flex-col gap-1 text-xs"
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <span className="font-semibold text-heading truncate flex-1 min-w-0" title={dep.title}>
                        {dep.title}
                      </span>
                      <TableStatus value={dep.status || "Todo"} />
                    </div>

                    <div className="flex items-center justify-between pt-1.5 text-[10px] text-muted border-t border-border-subtle/50 mt-0.5">
                      <span className="font-mono text-muted/80">{dep.taskID || "TSK"}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {onLocateTask && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onLocateTask(dep._id);
                            }}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-brand-text hover:bg-amber-500/10 font-bold transition-colors"
                            title="Scroll to and highlight this card on the board"
                          >
                            <EyeIcon className="w-3 h-3" />
                            <span>Locate</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onClick?.(dep);
                          }}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-muted hover:text-heading hover:bg-card font-semibold transition-colors"
                          title="Open task details"
                        >
                          <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                          <span>View</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer: Assignee on left; due date, comments & progress on right */}
      <div className="flex items-center justify-between gap-2.5 pt-2.5 border-t border-border-subtle/80 mt-2">
        <div className="flex items-center gap-2 min-w-0 flex-1 pl-1">
          {hasAssignee && (
            <div className="flex items-center gap-1.5 min-w-0" title={assigneeName}>
              <TableAvatar name={assigneeName} src={assignee?.avatar} size="xs" />
              <span className="text-xs truncate max-w-[130px] text-muted font-medium">
                {assigneeName}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {task.dueDate && (
            <div
              className={`flex items-center text-xs font-medium shrink-0 ${
                overdue ? "text-danger font-semibold" : "text-muted"
              }`}
            >
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
              aria-label={`View ${task.commentsCount} comment${
                task.commentsCount !== 1 ? "s" : ""
              }`}
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
