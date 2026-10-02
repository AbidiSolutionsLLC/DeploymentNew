/**
 * PROTOTYPE — Variant A "Command Center" (Projects list).
 * One dense table in a single glass card: toolbar (search + status chips),
 * hairline rows with hover, column prioritization for small screens
 * (`hidden md:table-cell` etc.) + inner horizontal scroll as last resort.
 */
import { useMemo, useState } from "react";
import { MagnifyingGlassIcon, PlusIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import Loader from "../../../../components/ui/Loader";
import { Pill, Progress, formatDate, EmptyState, PROJECT_STATUS_TONE } from "./bits";

const STATUSES = ["All", "Planning", "Active", "On Hold", "Completed", "Cancelled"];

export default function ProjectsA({ projects = [], loading, error, onNew, onRowClick }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter(
      (p) =>
        (status === "All" || p.status === status) &&
        (!q ||
          (p.title || "").toLowerCase().includes(q) ||
          (p.projectID || "").toLowerCase().includes(q))
    );
  }, [projects, query, status]);

  const countFor = (s) => (s === "All" ? projects.length : projects.filter((p) => p.status === s).length);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="glass-card flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-heading uppercase tracking-tight">Projects</h2>
            <p className="text-muted text-[10px] sm:text-xs font-medium uppercase tracking-wide mt-1">
              {rows.length} of {projects.length} projects in view
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects..."
                className="glass-input !pl-9 w-full"
              />
            </div>
            <button onClick={onNew} className="btn btn-primary py-2.5 px-4 whitespace-nowrap">
              <PlusIcon className="w-4 h-4 mr-2" /> New Project
            </button>
          </div>
        </div>

        {/* Status chips — horizontally scrollable */}
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

      {error && <div className="text-danger text-sm bg-danger-bg border border-danger-border rounded-xl px-4 py-3">{String(error)}</div>}

      {/* Table card */}
      <div className="glass-card !p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader text="Loading projects..." size="md" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title={projects.length === 0 ? "No projects yet" : "No matching projects"}
            hint={projects.length === 0 ? "Create your first project to get started." : "Try a different search or status filter."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left align-middle">
              <thead>
                <tr className="bg-card text-[10px] font-black uppercase tracking-widest text-muted">
                  <th className="px-4 py-3 hidden xl:table-cell">ID</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Owner</th>
                  <th className="px-4 py-3 hidden xl:table-cell">Team</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 hidden md:table-cell">Start</th>
                  <th className="px-4 py-3 hidden md:table-cell">End</th>
                  <th className="px-4 py-3">Progress</th>
                  <th className="px-4 py-3 w-8" />
                </tr>
              </thead>
              <tbody>
                {rows.map((p, i) => {
                  const pct = typeof p.progress === "number" ? p.progress : p.status === "Completed" ? 100 : p.status === "Active" ? 50 : 20;
                  return (
                    <tr
                      key={p._id || i}
                      onClick={() => onRowClick?.(p)}
                      className="border-t border-border-subtle hover:bg-amber-50 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 hidden xl:table-cell text-xs font-medium text-muted whitespace-nowrap">
                        {p.projectID || "—"}
                      </td>
                      <td className="px-4 py-3 max-w-[240px]">
                        <p className="text-sm font-semibold text-heading truncate">{p.title}</p>
                        {p.description && <p className="text-[11px] text-muted truncate">{p.description}</p>}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-sm text-main whitespace-nowrap">
                        {p.owner?.firstName
                          ? `${p.owner.firstName} ${p.owner.lastName || ""}`
                          : p.owner?.name || p.owner?.email || "—"}
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell text-sm text-main whitespace-nowrap">
                        {p.team?.length || 0} people
                      </td>
                      <td className="px-4 py-3">
                        <Pill tone={PROJECT_STATUS_TONE[p.status] || "neutral"}>{p.status || "Planning"}</Pill>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-muted whitespace-nowrap">{formatDate(p.startDate)}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-muted whitespace-nowrap">{formatDate(p.dueDate)}</td>
                      <td className="px-4 py-3 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <Progress value={pct} />
                          <span className="text-[10px] font-bold text-muted tabular-nums shrink-0">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-2 py-3">
                        <ChevronRightIcon className="w-4 h-4 text-muted" />
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
              Showing {rows.length} of {projects.length}
            </p>
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-text">Page 1</p>
          </div>
        )}
      </div>
    </div>
  );
}
