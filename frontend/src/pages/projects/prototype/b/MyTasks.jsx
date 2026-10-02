/**
 * PROTOTYPE — Variant B "Split Workspace" (My Tasks).
 * Day-planner instead of a table: tasks grouped by due bucket
 * (Overdue → Today → This week → Later → No date) as rows in sections.
 * Priority filter scrolls horizontally on small screens.
 */
import { useMemo, useState } from "react";
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
import Loader from "../../../../components/ui/Loader";
import { DotStatus, EmptyState, isOverdue, shortDate, TASK_STATUS_TONE, PRIORITY_TONE } from "./bits";

const PRIORITIES = ["All", "High", "Medium", "Low"];
const BUCKETS = ["Overdue", "Today", "This week", "Later", "No date"];

const PRIORITY_STRIPE = { High: "bg-danger", Medium: "bg-warning", Low: "bg-neutral" };

function bucketOf(task) {
  if (!task.dueDate) return "No date";
  if (isOverdue(task.dueDate, task.status)) return "Overdue";
  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = (due - now) / 86400000;
  if (diff === 0) return "Today";
  if (diff <= 7) return "This week";
  return "Later";
}

export default function MyTasksB({ tasks = [], loading, onNew }) {
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

  const grouped = useMemo(() => {
    const map = Object.fromEntries(BUCKETS.map((b) => [b, []]));
    filtered.forEach((t) => map[bucketOf(t)].push(t));
    BUCKETS.forEach((b) =>
      map[b].sort((a, x) => {
        const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dx = x.dueDate ? new Date(x.dueDate).getTime() : Infinity;
        return da - dx;
      })
    );
    return map;
  }, [filtered]);

  const countFor = (p) => (p === "All" ? tasks.length : tasks.filter((t) => t.priority === p).length);

  return (
    <div className="flex flex-col gap-4">
      {/* Header + controls */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-brand-text">
              Project portal
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-heading tracking-tight mt-1">My Tasks</h2>
            <p className="text-sm text-muted mt-1">
              {filtered.length} of {tasks.length} tasks · grouped by due date
            </p>
          </div>
          <button onClick={onNew} className="btn btn-primary py-2.5 px-4 self-start sm:self-auto whitespace-nowrap">
            <PlusIcon className="w-4 h-4 mr-2" /> New Task
          </button>
        </div>

        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks or projects..."
            className="glass-input !pl-10 w-full"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-0.5">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className={`shrink-0 px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                priority === p
                  ? "bg-brand text-on-brand shadow-[0_4px_15px_rgba(212,175,55,0.3)]"
                  : "bg-card text-muted border border-border-subtle hover:border-border-accent hover:text-brand-text"
              }`}
            >
              {p} {p !== "All" && <span className="ml-1 tabular-nums opacity-70">{countFor(p)}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Day-grouped sections */}
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
        <div className="flex flex-col gap-4">
          {BUCKETS.filter((b) => grouped[b].length > 0).map((bucket) => (
            <section key={bucket} className="glass-card min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <p
                  className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                    bucket === "Overdue" ? "text-danger" : "text-brand-text"
                  }`}
                >
                  {bucket}
                </p>
                <span className="h-px flex-1 bg-border-accent" />
                <span className="text-[10px] font-black text-muted tabular-nums">{grouped[bucket].length}</span>
              </div>
              <ul className="divide-y divide-border-subtle">
                {grouped[bucket].map((t, i) => (
                  <li
                    key={t._id || i}
                    className="py-3 flex items-start gap-3 min-w-0 hover:bg-amber-50/60 transition-colors -mx-2 px-2 rounded-lg"
                  >
                    <span
                      className={`w-1 self-stretch rounded-full shrink-0 ${PRIORITY_STRIPE[t.priority] || "bg-neutral"}`}
                    />
                    <span className="mt-0.5 w-4 h-4 rounded-full border-2 border-border-accent shrink-0" title="Mark done (demo)" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-heading truncate">{t.title}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        {t.project?.title && (
                          <span className="text-[11px] text-muted truncate max-w-[160px]">{t.project.title}</span>
                        )}
                        <DotStatus tone={PRIORITY_TONE[t.priority] || "neutral"}>{t.priority || "Medium"}</DotStatus>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`text-[11px] font-bold whitespace-nowrap ${
                          bucket === "Overdue" ? "text-danger" : "text-muted"
                        }`}
                      >
                        {shortDate(t.dueDate)}
                      </span>
                      <DotStatus tone={TASK_STATUS_TONE[t.status] || "neutral"}>{t.status || "Todo"}</DotStatus>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
