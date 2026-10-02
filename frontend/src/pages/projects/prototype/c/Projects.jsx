/**
 * PROTOTYPE — Variant C "Board & Metrics" (Projects list).
 * Kanban board grouped by status: snap-scrolling columns that become a single
 * dominant column on phones (`w-[78vw]`). Search filters cards client-side.
 * Row actions/detail navigation: tap a card → project detail.
 */
import { useMemo, useState } from "react";
import { MagnifyingGlassIcon, PlusIcon, UserGroupIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";
import Loader from "../../../../components/ui/Loader";
import { Column, BoardScroll, Chip, EmptyState, shortDate, PROJECT_COLUMNS, PROJECT_STATUS_TONE } from "./bits";

export default function ProjectsC({ projects = [], loading, error, onNew, onRowClick }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter(
      (p) => !q || (p.title || "").toLowerCase().includes(q) || (p.projectID || "").toLowerCase().includes(q)
    );
  }, [projects, query]);

  const columns = [...PROJECT_COLUMNS, "Cancelled"];

  return (
    <div className="flex flex-col gap-4">
      {/* Header + toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-brand-text">
              Project portal
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-heading tracking-tight mt-1">Projects Board</h2>
            <p className="text-sm text-muted mt-1">{filtered.length} of {projects.length} cards in view</p>
          </div>
          <button onClick={onNew} className="btn btn-primary py-2.5 px-4 self-start sm:self-auto whitespace-nowrap">
            <PlusIcon className="w-4 h-4 mr-2" /> New Project
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search board..."
              className="glass-input !pl-10 w-full"
            />
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted shrink-0">
            <span className="px-2 py-1 rounded-md bg-amber-50 border border-border-accent text-brand-text">
              Swipe →
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-danger text-sm bg-danger-bg border border-danger-border rounded-xl px-4 py-3">{String(error)}</div>
      )}

      {/* Board */}
      {loading ? (
        <div className="glass-card flex justify-center items-center py-16">
          <Loader text="Loading projects..." size="md" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card">
          <EmptyState
            title={projects.length === 0 ? "No projects yet" : "No matching projects"}
            hint={projects.length === 0 ? "Create your first project to get started." : "Try a different search."}
          />
        </div>
      ) : (
        <BoardScroll>
          {columns.map((col) => {
            const items = filtered.filter((p) => (p.status || "Planning") === col);
            return (
              <Column key={col} title={col} count={items.length} tone={PROJECT_STATUS_TONE[col]}>
                {items.length === 0 ? (
                  <p className="text-[11px] text-muted text-center py-3">No projects</p>
                ) : (
                  items.map((p, i) => {
                    const pct =
                      typeof p.progress === "number" ? p.progress : p.status === "Completed" ? 100 : p.status === "Active" ? 50 : 20;
                    return (
                      <article
                        key={p._id || i}
                        onClick={() => onRowClick?.(p)}
                        className="rounded-lg bg-surface border border-border-subtle p-3.5 hover:border-border-accent hover:shadow-sm transition-all cursor-pointer min-w-0"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-muted">
                            {p.projectID || "—"}
                          </span>
                          <Chip tone={PROJECT_STATUS_TONE[p.status] || "neutral"}>{p.status || "Planning"}</Chip>
                        </div>
                        <p className="text-sm font-bold text-heading mt-2 line-clamp-2">{p.title}</p>
                        {p.description && <p className="text-[11px] text-muted mt-1 line-clamp-2">{p.description}</p>}

                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[10px] font-bold text-muted mb-1">
                            <span className="uppercase tracking-widest">Progress</span>
                            <span className="tabular-nums text-brand-text">{pct}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-border-subtle overflow-hidden">
                            <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-border-subtle text-[11px] text-muted">
                          <span className="inline-flex items-center gap-1 min-w-0">
                            <CalendarDaysIcon className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{shortDate(p.dueDate)}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 shrink-0">
                            <UserGroupIcon className="w-3.5 h-3.5" />
                            {p.team?.length || 0}
                          </span>
                        </div>
                      </article>
                    );
                  })
                )}
              </Column>
            );
          })}
        </BoardScroll>
      )}
    </div>
  );
}
