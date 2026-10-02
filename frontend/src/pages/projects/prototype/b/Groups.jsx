/**
 * PROTOTYPE — Variant B "Split Workspace" (Project Groups).
 * Card grid of "collection" tiles: big project count, description-forward,
 * owner footer. Tiles: 1 col → 2 cols (sm) → 3 cols (2xl).
 */
import { useMemo, useState } from "react";
import { MagnifyingGlassIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Loader from "../../../../components/ui/Loader";
import { EmptyState, formatDate } from "./bits";

export default function GroupsB({ groups = [], loading, onNew, onDelete }) {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups.filter(
      (g) => !q || (g.name || "").toLowerCase().includes(q) || (g.description || "").toLowerCase().includes(q)
    );
  }, [groups, query]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header + controls */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-brand-text">
              Project portal
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-heading tracking-tight mt-1">Project Groups</h2>
            <p className="text-sm text-muted mt-1">{rows.length} of {groups.length} collections in view</p>
          </div>
          <button onClick={onNew} className="btn btn-primary py-2.5 px-4 self-start sm:self-auto whitespace-nowrap">
            <PlusIcon className="w-4 h-4 mr-2" /> New Group
          </button>
        </div>

        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search groups..."
            className="glass-input !pl-10 w-full"
          />
        </div>
      </div>

      {/* Tiles */}
      {loading ? (
        <div className="glass-card flex justify-center items-center py-16">
          <Loader text="Loading groups..." size="md" />
        </div>
      ) : rows.length === 0 ? (
        <div className="glass-card">
          <EmptyState
            title={groups.length === 0 ? "No project groups yet" : "No matching groups"}
            hint={
              groups.length === 0
                ? "Group projects into portfolios to organize your work."
                : "Try a different search."
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-4">
          {rows.map((g, i) => {
            const count = Array.isArray(g.projects) ? g.projects.length : Number(g.projects) || 0;
            const owner = g.owner?.firstName
              ? `${g.owner.firstName} ${g.owner.lastName || ""}`.trim()
              : g.owner?.name || g.owner?.email || "—";
            return (
              <article
                key={g._id || i}
                className="glass-card flex flex-col gap-3 min-w-0 hover:-translate-y-0.5 transition-transform"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-black text-heading tracking-tight truncate">{g.name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted mt-0.5">Collection</p>
                  </div>
                  <button
                    onClick={() => onDelete?.(g._id)}
                    title="Delete group"
                    className="p-2 -m-1 rounded-lg text-muted hover:text-danger hover:bg-danger-bg transition-colors shrink-0"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-end gap-3">
                  <span className="text-3xl font-black text-brand-text tabular-nums leading-none">{count}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted pb-1">
                    projects<br />inside
                  </span>
                </div>

                <p className="text-xs text-muted line-clamp-2 min-h-[2rem]">{g.description || "No description."}</p>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border-subtle mt-auto">
                  <span className="text-[11px] font-semibold text-main truncate">Owner: {owner}</span>
                  <span className="text-[10px] uppercase tracking-widest text-muted whitespace-nowrap">
                    {formatDate(g.createdAt)}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
