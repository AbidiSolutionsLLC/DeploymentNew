/**
 * PROTOTYPE — Variant C "Board & Metrics" (My Tasks).
 * Task kanban: columns per task status, snap-scrolling and dominant on
 * phones. Priority + search filter cards client-side.
 */
import { useMemo, useState } from "react";
import { MagnifyingGlassIcon, PlusIcon, CalendarDaysIcon, Bars3Icon } from "@heroicons/react/24/outline";
import Loader from "../../../../components/ui/Loader";
import { Column, BoardScroll, Chip, EmptyState, shortDate, TASK_COLUMNS, PRIORITY_TONE } from "./bits";

const PRIORITIES = ["All", "High", "Medium", "Low"];
const COLUMN_TONE = {
  Todo: "neutral",
  "In Progress": "info",
  "In Review": "warning",
  Blocked: "danger",
  Done: "success",
};

export default function MyTasksC({ tasks = [], loading, onNew }) {
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter(
      (t) =>
        (priority === "All" || t.priority === priority) &&
        (!q || (t.title || "").toLowerCase().includes(q) || (t.project?.title || "").toLowerCase().includes(q))
    );
  }, [tasks, query, priority]);

  const overdue = (t) => {
    if (!t.dueDate || t.status === "Done") return false;
    const d = new Date(t.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return !Number.isNaN(d.getTime()) && d < today;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header + toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-brand-text">
              Project portal
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-heading tracking-tight mt-1">Tasks Board</h2>
            <p className="text-sm text-muted mt-1">{filtered.length} of {tasks.length} cards in view</p>
          </div>
          <button onClick={onNew} className="btn btn-primary py-2.5 px-4 self-start sm:self-auto whitespace-nowrap">
            <PlusIcon className="w-4 h-4 mr-2" /> New Task
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks..."
              className="glass-input !pl-10 w-full"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`shrink-0 px-3.5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                  priority === p
                    ? "bg-brand text-on-brand shadow-[0_4px_15px_rgba(212,175,55,0.3)]"
                    : "bg-card text-muted border border-border-subtle hover:border-border-accent hover:text-brand-text"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Board */}
      {loading ? (
        <div className="glass-card flex justify-center items-center py-16">
          <Loader text="Loading tasks..." size="md" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card">
          <EmptyState
            title={tasks.length === 0 ? "No tasks assigned" : "No matching tasks"}
            hint={tasks.length === 0 ? "New tasks assigned to you will appear here." : "Try a different search or priority."}
          />
        </div>
      ) : (
        <BoardScroll>
          {TASK_COLUMNS.map((col) => {
            const items = filtered.filter((t) => (t.status || "Todo") === col);
            return (
              <Column key={col} title={col} count={items.length} tone={COLUMN_TONE[col]}>
                {items.length === 0 ? (
                  <p className="text-[11px] text-muted text-center py-3">No tasks</p>
                ) : (
                  items.map((t, i) => (
                    <article
                      key={t._id || i}
                      className="rounded-lg bg-surface border border-border-subtle p-3 hover:border-border-accent transition-colors min-w-0"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-heading line-clamp-2 min-w-0">{t.title}</p>
                        <Bars3Icon className="w-4 h-4 text-muted shrink-0 opacity-60" title="Drag (demo only)" />
                      </div>
                      {t.project?.title && (
                        <p className="text-[10px] uppercase tracking-widest text-muted mt-1.5 truncate">
                          {t.project.title}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                        <Chip tone={PRIORITY_TONE[t.priority] || "neutral"}>{t.priority || "Medium"}</Chip>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider ${
                            overdue(t) ? "text-danger" : "text-muted"
                          }`}
                        >
                          <CalendarDaysIcon className="w-3.5 h-3.5" />
                          {shortDate(t.dueDate)}
                          {overdue(t) && " · late"}
                        </span>
                      </div>
                      {typeof t.completionPercent === "number" && (
                        <div className="mt-2.5">
                          <div className="w-full h-1 rounded-full bg-border-subtle overflow-hidden">
                            <div
                              className="h-full rounded-full bg-brand"
                              style={{ width: `${Math.min(100, t.completionPercent)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </article>
                  ))
                )}
              </Column>
            );
          })}
        </BoardScroll>
      )}
    </div>
  );
}
