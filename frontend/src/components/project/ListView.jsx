import React, { useState, useMemo } from "react";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  LinkIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import {
  TableDate,
  TablePriority,
  TableStatus,
  TableTitle,
} from "../ui/TableCells";
import { buildTaskHierarchy, isStatusDone } from "../../utils/taskHierarchy";

export default function ListView({ tasks = [], onTaskClick, projectStatuses = [] }) {
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("hierarchy"); // "hierarchy" | "flat"

  // Build the hierarchical tree of tasks based on dependencies
  const hierarchyRoots = useMemo(() => {
    return buildTaskHierarchy(tasks);
  }, [tasks]);

  // Toggle single task expansion
  const toggleExpand = (e, taskId) => {
    e.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // Expand / Collapse all tasks with children
  const handleToggleExpandAll = () => {
    const allParentIds = new Set();
    const collectParentIds = (nodes) => {
      nodes.forEach((node) => {
        if (node.hasChildren) {
          allParentIds.add(node.id);
          collectParentIds(node.children);
        }
      });
    };
    collectParentIds(hierarchyRoots);

    if (expandedIds.size >= allParentIds.size && allParentIds.size > 0) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(allParentIds);
    }
  };

  // Check if all parents are currently expanded
  const hasParents = useMemo(() => {
    const findHasChildren = (nodes) => nodes.some((n) => n.hasChildren || findHasChildren(n.children));
    return findHasChildren(hierarchyRoots);
  }, [hierarchyRoots]);

  // Filter tasks if search is active
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const q = searchQuery.toLowerCase().trim();
    return tasks.filter(
      (t) =>
        (t.title || "").toLowerCase().includes(q) ||
        (t.taskID || "").toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q) ||
        (t.status || "").toLowerCase().includes(q)
    );
  }, [tasks, searchQuery]);

  // Flatten visible hierarchical tree nodes taking expansion into account
  const visibleTreeRows = useMemo(() => {
    if (viewMode === "flat") {
      return filteredTasks.map((t) => ({
        task: t,
        id: String(t._id || t.id),
        depth: 0,
        hasChildren: false,
        childrenCount: 0,
        parentTitle: null,
      }));
    }

    const rows = [];
    const q = searchQuery.toLowerCase().trim();

    const traverse = (nodes, parentTask = null) => {
      nodes.forEach((node) => {
        const matchesSearch =
          !q ||
          (node.task.title || "").toLowerCase().includes(q) ||
          (node.task.taskID || "").toLowerCase().includes(q);

        const hasMatchingDescendant = (n) => {
          if (!q) return true;
          if (
            (n.task.title || "").toLowerCase().includes(q) ||
            (n.task.taskID || "").toLowerCase().includes(q)
          ) {
            return true;
          }
          return n.children.some(hasMatchingDescendant);
        };

        if (matchesSearch || hasMatchingDescendant(node)) {
          rows.push({
            task: node.task,
            id: node.id,
            depth: node.depth,
            hasChildren: node.hasChildren,
            childrenCount: node.children.length,
            parentTitle: parentTask?.title || null,
          });

          // Show children if expanded or if search is active
          if (node.hasChildren && (expandedIds.has(node.id) || q.length > 0)) {
            traverse(node.children, node.task);
          }
        }
      });
    };

    traverse(hierarchyRoots);
    return rows;
  }, [hierarchyRoots, expandedIds, viewMode, filteredTasks, searchQuery]);

  return (
    <div className="flex flex-col gap-4">
      {/* List Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-xl p-1 bg-card border border-border-subtle">
            <button
              type="button"
              onClick={() => setViewMode("hierarchy")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "hierarchy"
                  ? "bg-surface shadow-sm text-heading border border-border-subtle"
                  : "text-muted hover:text-heading"
              }`}
            >
              Hierarchy View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("flat")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "flat"
                  ? "bg-surface shadow-sm text-heading border border-border-subtle"
                  : "text-muted hover:text-heading"
              }`}
            >
              Flat View
            </button>
          </div>

          {/* Expand/Collapse All Button (Hierarchy Mode) */}
          {viewMode === "hierarchy" && hasParents && (
            <button
              type="button"
              onClick={handleToggleExpandAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-subtle bg-surface text-xs font-semibold text-muted hover:text-heading hover:bg-card-hover transition-colors"
            >
              {expandedIds.size > 0 ? (
                <>
                  <ArrowsPointingInIcon className="w-3.5 h-3.5" />
                  <span>Collapse All</span>
                </>
              ) : (
                <>
                  <ArrowsPointingOutIcon className="w-3.5 h-3.5" />
                  <span>Expand All</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Quick Search in List View */}
        <div className="relative min-w-[200px] max-w-xs flex-1">
          <MagnifyingGlassIcon className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tasks in list..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input !py-1.5 !pl-9 text-xs w-full"
          />
        </div>
      </div>

      {/* Hierarchical Table */}
      <div className="w-full glass-card !p-0 rounded-2xl overflow-hidden border border-border-subtle bg-surface">
        <div className="w-full overflow-x-auto custom-scrollbar">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border-subtle bg-app text-left text-[11px] font-black uppercase tracking-wider text-muted">
                <th className="py-3 px-4 min-w-[320px]">Task</th>
                <th className="py-3 px-4 min-w-[120px]">Status</th>
                <th className="py-3 px-4 min-w-[120px]">Assignees</th>
                <th className="py-3 px-4 min-w-[120px]">Due Date</th>
                <th className="py-3 px-4 min-w-[100px]">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle bg-surface">
              {visibleTreeRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted text-xs">
                    No tasks found in this project.
                  </td>
                </tr>
              ) : (
                visibleTreeRows.map((row) => {
                  const task = row.task;
                  const isExpanded = expandedIds.has(row.id);
                  const indentPx = row.depth * 28;

                  return (
                    <tr
                      key={row.id}
                      onClick={() => onTaskClick?.(task)}
                      className={`group transition-colors duration-150 cursor-pointer hover:bg-card-hover ${
                        row.depth > 0 ? "bg-surface/60" : "bg-surface"
                      }`}
                    >
                      {/* Task Title & Hierarchy Expander Dropdown */}
                      <td className="py-3 px-4 align-middle">
                        <div
                          className="flex items-center gap-2"
                          style={{ paddingLeft: `${indentPx}px` }}
                        >
                          {/* Tree branch connector indicator for children */}
                          {row.depth > 0 && (
                            <span className="text-muted/50 font-mono text-sm shrink-0 select-none">
                              └─
                            </span>
                          )}

                          {/* Expander Dropdown Toggle for Tasks with Sub-dependents */}
                          {row.hasChildren ? (
                            <button
                              type="button"
                              onClick={(e) => toggleExpand(e, row.id)}
                              className="inline-flex items-center gap-1 px-1.5 py-1 rounded-md text-muted hover:text-brand-text hover:bg-amber-500/10 border border-border-subtle transition-colors shrink-0"
                              title={isExpanded ? "Collapse sub-tasks" : "Expand sub-tasks"}
                            >
                              {isExpanded ? (
                                <ChevronDownIcon className="w-3.5 h-3.5 text-brand" />
                              ) : (
                                <ChevronRightIcon className="w-3.5 h-3.5" />
                              )}
                              <span className="text-[10px] font-bold tabular-nums">
                                {row.childrenCount}
                              </span>
                            </button>
                          ) : (
                            <span className="w-5 shrink-0" />
                          )}

                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <TableTitle
                                title={task.title}
                                subtitle={task.taskID || "TSK"}
                                maxWidth="max-w-[260px]"
                              />
                            </div>

                            {/* Prerequisite relationship hint if this is a sub-dependent task */}
                            {row.parentTitle && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-muted/80 mt-0.5 truncate max-w-[260px]">
                                <LinkIcon className="w-3 h-3 text-muted shrink-0" />
                                <span>Prerequisite: {row.parentTitle}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 align-middle whitespace-nowrap">
                        <TableStatus value={task.status || "Todo"} />
                      </td>

                      {/* Assignees */}
                      <td className="py-3 px-4 align-middle whitespace-nowrap">
                        <span className="flex -space-x-2">
                          {task.team && task.team.length > 0 ? (
                            task.team.slice(0, 3).map((user, idx) => (
                              <img
                                key={idx}
                                className="w-7 h-7 rounded-full border-2 border-surface object-cover"
                                src={
                                  user.avatar ||
                                  `https://ui-avatars.com/api/?name=${user.name || "User"}&background=random`
                                }
                                title={user.name}
                                alt="Avatar"
                              />
                            ))
                          ) : (
                            <span className="text-muted text-xs">Unassigned</span>
                          )}
                          {task.team && task.team.length > 3 && (
                            <span className="w-7 h-7 rounded-full border-2 border-surface bg-card flex items-center justify-center text-[10px] font-medium text-muted">
                              +{task.team.length - 3}
                            </span>
                          )}
                        </span>
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-4 align-middle whitespace-nowrap">
                        <TableDate value={task.dueDate} tone="muted" fallback="No date" />
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-4 align-middle whitespace-nowrap">
                        <TablePriority value={task.priority || "Medium"} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
