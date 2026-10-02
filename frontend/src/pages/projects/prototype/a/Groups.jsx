/**
 * PROTOTYPE — Variant A "Command Center" (Project Groups).
 * Summary strip (mini stats) + dense table with row actions.
 */
import { useMemo, useState } from "react";
import { MagnifyingGlassIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Loader from "../../../../components/ui/Loader";
import { formatDate, EmptyState } from "./bits";

export default function GroupsA({ groups = [], loading, onNew, onDelete }) {
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups.filter((g) => !q || (g.name || "").toLowerCase().includes(q) || (g.description || "").toLowerCase().includes(q));
  }, [groups, query]);

  const totalProjects = groups.reduce((sum, g) => sum + (Array.isArray(g.projects) ? g.projects.length : Number(g.projects) || 0), 0);
  const owners = new Set(
    groups.map((g) => g.owner?._id || g.owner?.email || g.owner?.name || (typeof g.owner === "string" ? g.owner : null))
  ).size;

  const stats = [
    { label: "Total Groups", value: groups.length },
    { label: "Projects Covered", value: totalProjects },
    { label: "Group Owners", value: owners },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Summary strip + toolbar */}
      <div className="glass-card flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-heading uppercase tracking-tight">Project Groups</h2>
            <p className="text-muted text-[10px] sm:text-xs font-medium uppercase tracking-wide mt-1">
              Portfolios and groupings
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-56">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search groups..."
                className="glass-input !pl-9 w-full"
              />
            </div>
            <button onClick={onNew} className="btn btn-primary py-2.5 px-4 whitespace-nowrap">
              <PlusIcon className="w-4 h-4 mr-2" /> New Group
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-px bg-border-subtle -mx-1 px-1">
          {stats.map((s) => (
            <div key={s.label} className="bg-surface rounded-lg px-3 py-3 text-center min-w-0">
              <p className="text-lg sm:text-xl font-black text-heading tabular-nums leading-none">{s.value}</p>
              <p className="mt-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted truncate">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Table card */}
      <div className="glass-card !p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader text="Loading groups..." size="md" />
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title={groups.length === 0 ? "No project groups yet" : "No matching groups"}
            hint={groups.length === 0 ? "Group projects into portfolios to organize your work." : "Try a different search."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left align-middle">
              <thead>
                <tr className="bg-card text-[10px] font-black uppercase tracking-widest text-muted">
                  <th className="px-4 py-3">Group</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Description</th>
                  <th className="px-4 py-3 hidden md:table-cell">Owner</th>
                  <th className="px-4 py-3">Projects</th>
                  <th className="px-4 py-3 hidden xl:table-cell">Created</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {rows.map((g, i) => {
                  const count = Array.isArray(g.projects) ? g.projects.length : Number(g.projects) || 0;
                  return (
                    <tr key={g._id || i} className="border-t border-border-subtle hover:bg-amber-50 transition-colors">
                      <td className="px-4 py-3 max-w-[220px]">
                        <p className="text-sm font-semibold text-heading truncate">{g.name}</p>
                        <p className="lg:hidden text-[11px] text-muted truncate">{g.description || "—"}</p>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted max-w-[260px] truncate">
                        {g.description || "—"}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-sm text-main whitespace-nowrap">
                        {g.owner?.firstName
                          ? `${g.owner.firstName} ${g.owner.lastName || ""}`
                          : g.owner?.name || g.owner?.email || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center min-w-8 px-2 py-1 rounded-md bg-amber-50 border border-border-accent text-brand-text text-xs font-black tabular-nums">
                          {count}
                        </span>
                        <span className="ml-2 text-[10px] uppercase tracking-widest text-muted">projects</span>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell text-xs text-muted whitespace-nowrap">
                        {formatDate(g.createdAt)}
                      </td>
                      <td className="px-2 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete?.(g._id);
                          }}
                          title="Delete group"
                          className="p-2 rounded-lg text-danger hover:bg-danger-bg transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
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
              Showing {rows.length} of {groups.length}
            </p>
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-text">Page 1</p>
          </div>
        )}
      </div>
    </div>
  );
}
