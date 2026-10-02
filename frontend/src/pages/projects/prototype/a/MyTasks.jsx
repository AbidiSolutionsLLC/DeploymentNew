/**
 * PROTOTYPE — Variant A "Command Center" (My Tasks).
 * Dense table + toolbar chips (status / priority) + sort. Client-side only.
 */
import { useMemo, useState } from "react";
import { MagnifyingGlassIcon, PlusIcon, ArrowsUpDownIcon } from "@heroicons/react/24/outline";
import Loader from "../../../../components/ui/Loader";
import { Pill, Progress, formatDate, EmptyState, isOverdue, TASK_STATUS_TONE, PRIORITY_TONE } from "./bits";

const STATUSES = ["All", "Todo", "In Progress", "In Review", "Blocked", "Done"];
const SORTS = [
  { key: "due", label: "Due date" },
  { key: "priority", label: "Priority" },
  { key: "title", label: "Title" },
];
const PRIORITY_RANK = { High: 0, Medium: 1, Low: 2 };

export default function MyTasksA({ tasks = [], loading, onNew }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState("due");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = tasks.filter(
      (t) => (status === "All" || t.status === status) && (!q || (t.title || "").toLowerCase().includes(q))
    );
    return [...list].sort((a, b) => {
      if (sort === "title") return (a.title || "").localeCompare(b.title || "");
      if (sort === "priority") return (PRIORITY_RANK[a.priority] ?? 3) - (PRIORITY_RANK[b.priority] ?? 3);
      const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return da - db;
    });
  }, [tasks, query, status, sort]);

  const countFor = (s) => (s === "All" ? tasks.length : tasks.filter((t) => t.status === s).length);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="glass-card flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-heading uppercase tracking-tight">My Tasks</h2>
            <p className="text-muted text-[10px] sm:text-xs font-medium uppercase tracking-wide mt-1">
              {rows.length} of {tasks.length} tasks in view
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-56">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks..."
                className="glass-input !pl-9 w-full"
              />
            </div>
            <button
              onClick={() => setSort(SORTS[(SORTS.findIndex((s) => s.key === sort) + 1) % SORTS.length].key)}
              className="btn btn-secondary py-2.5 px-4 whitespace-nowrap"
              title="Change sort"
            >
              <ArrowsUpDownIcon className="w-4 h-4 mr-2" />
              {SORTS.find((s) => s.key === sort)?.label}
            </button>
            <button onClick={onNew} className="btn btn-primary py-2.5 px-4 whitespace-nowrap">
              <PlusIcon className="w-4 h-4 mr-2" /> New Task
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-0.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`shrink-0 px-3.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors ${
                status === s
                  ? "bg-brand text-on-brand border-brand shadow-[0_4px_15px_rgba(212,175,55,0.3)]"
                  : "bg-card text-muted border-border-subtle hover:border-border-accent hover:text-brand-text"
              }`}
            >
              {s} <span className="ml-1 tabular-nums opacity-70">{countFor(s)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table card */}
      <div className="glass-card !p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader text="Loading tasks..." size="md" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title={tasks.length === 0 ? "No tasks assigned" : "No matching tasks"}
            hint={tasks.length === 0 ? "New tasks assigned to you will appear here." : "Try a different search or filter."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left align-middle">
              <thead>
                <tr className="bg-card text-[10px] font-black uppercase tracking-widest text-muted">
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3 hidden md:table-cell">Project</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Priority</th>
                  <th className="px-4 py-3 hidden xl:table-cell">Description</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Progress</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t, i) => {
                  const overdue = isOverdue(t.dueDate, t.status);
                  const pct = typeof t.completionPercent === "number" ? t.completionPercent : t.status === "Done" ? 100 : 0;
                  return (
                    <tr key={t._id || i} className="border-t border-border-subtle hover:bg-amber-50 transition-colors">
                      <td className="px-4 py-3 max-w-[240px]">
                        <p className="text-sm font-semibold text-heading truncate">{t.title}</p>
                        <p className="md:hidden text-[11px] text-muted truncate">{t.project?.title || "No project"}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-sm text-main whitespace-nowrap">
                        {t.project?.title || "—"}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <Pill tone={PRIORITY_TONE[t.priority] || "neutral"}>{t.priority || "Medium"}</Pill>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell text-xs text-muted max-w-[220px] truncate">
                        {t.description || "—"}
                      </td>
                      <td className={`px-4 py-3 text-xs whitespace-nowrap font-bold ${overdue ? "text-danger" : "text-muted"}`}>
                        {formatDate(t.dueDate)}
                        {overdue && <span className="block text-[9px] uppercase tracking-widest">Overdue</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Pill tone={TASK_STATUS_TONE[t.status] || "neutral"}>{t.status || "Todo"}</Pill>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell min-w-[110px]">
                        <div className="flex items-center gap-2">
                          <Progress value={pct} />
                          <span className="text-[10px] font-bold text-muted tabular-nums shrink-0">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && rows.length > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border-subtle bg-card">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted">
              Showing {rows.length} of {tasks.length}
            </p>
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-text">Page 1</p>
          </div>
        )}
      </div>
    </div>
  );
}
