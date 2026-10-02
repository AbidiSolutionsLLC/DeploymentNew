/**
 * PROTOTYPE — Variant C "Board & Metrics" (Project Groups).
 * Typographic index: full-width numbered bars with an oversized project
 * count — no tables, no tile grid.
 */
import { useMemo, useState } from "react";
import { MagnifyingGlassIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Loader from "../../../../components/ui/Loader";
import { Chip, EmptyState, formatDate } from "./bits";

export default function GroupsC({ groups = [], loading, onNew, onDelete }) {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups.filter(
      (g) => !q || (g.name || "").toLowerCase().includes(q) || (g.description || "").toLowerCase().includes(q)
    );
  }, [groups, query]);

  const totalProjects = groups.reduce((sum, g) => sum + (Array.isArray(g.projects) ? g.projects.length : Number(g.projects) || 0), 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Header + toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-brand-text">
              Project portal
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-heading tracking-tight mt-1">Group Index</h2>
            <p className="text-sm text-muted mt-1">
              {rows.length} groups · {totalProjects} projects covered
            </p>
          </div>
          <button onClick={onNew} className="btn btn-primary py-2.5 px-4 self-start sm:self-auto whitespace-nowrap">
            <PlusIcon className="w-4 h-4 mr-2" /> New Group
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the index..."
              className="glass-input !pl-10 w-full"
            />
          </div>
          <div className="hidden sm:flex items-center shrink-0">
            <Chip tone="info">
              {rows.length} of {groups.length}
            </Chip>
          </div>
        </div>
      </div>

      {/* Index bars */}
      {loading ? (
        <div className="glass-card flex justify-center items-center py-16">
          <Loader text="Loading groups..." size="md" />
        </div>
      ) : rows.length === 0 ? (
        <div className="glass-card">
          <EmptyState
            title={groups.length === 0 ? "No project groups yet" : "No matching groups"}
            hint={groups.length === 0 ? "Group projects into portfolios to organize your work." : "Try a different search."}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map((g, i) => {
            const count = Array.isArray(g.projects) ? g.projects.length : Number(g.projects) || 0;
            const owner = g.owner?.firstName
              ? `${g.owner.firstName} ${g.owner.lastName || ""}`.trim()
              : g.owner?.name || g.owner?.email || "—";
            return (
              <article
                key={g._id || i}
                className="glass-card !py-3.5 flex items-center gap-3 sm:gap-5 hover:border-border-accent min-w-0"
              >
                <span className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 rounded-lg bg-amber-50 border border-border-accent text-brand-text flex items-center justify-center text-xs sm:text-sm font-black tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-sm sm:text-base font-black text-heading tracking-tight truncate">{g.name}</p>
                  <p className="text-[11px] text-muted truncate">{g.description || "No description"}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                    <span className="text-[10px] uppercase tracking-widest text-muted truncate">{owner}</span>
                    <span className="text-[10px] uppercase tracking-widest text-muted hidden sm:inline">
                      {formatDate(g.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="hidden md:block shrink-0 text-right">
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted">Projects</p>
                  <p className="text-2xl font-black text-brand-text tabular-nums leading-none mt-0.5">{count}</p>
                </div>

                <div className="md:hidden shrink-0">
                  <span className="inline-flex items-center justify-center min-w-8 px-2 py-1 rounded-md bg-amber-50 border border-border-accent text-brand-text text-xs font-black tabular-nums">
                    {count}
                  </span>
                </div>

                <button
                  onClick={() => onDelete?.(g._id)}
                  title="Delete group"
                  className="shrink-0 p-2.5 rounded-lg text-muted hover:text-danger hover:bg-danger-bg transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
