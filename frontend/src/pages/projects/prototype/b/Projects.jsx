/**
 * PROTOTYPE — Variant B "Split Workspace" (Projects list).
 * No table: full-width list rows with status stripe, meta line, avatar stack
 * and inline progress. Segmented filter scrolls horizontally on small screens;
 * rows restack vertically on phones.
 */
import { useMemo, useState } from "react";
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
import Loader from "../../../../components/ui/Loader";
import { DotStatus, Progress, AvatarStack, formatDate, EmptyState, PROJECT_STATUS_TONE } from "./bits";

const STATUSES = ["All", "Planning", "Active", "On Hold", "Completed", "Cancelled"];

const STRIPE = {
  Planning: "bg-info",
  Active: "bg-success",
  "On Hold": "bg-warning",
  Completed: "bg-neutral",
  Cancelled: "bg-danger",
};

export default function ProjectsB({ projects = [], loading, error, onNew, onRowClick }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter(
      (p) =>
        (status === "All" || p.status === status) &&
        (!q || (p.title || "").toLowerCase().includes(q) || (p.projectID || "").toLowerCase().includes(q))
    );
  }, [projects, query, status]);

  const countFor = (s) => (s === "All" ? projects.length : projects.filter((p) => p.status === s).length);

  return (
    <div className="flex flex-col gap-4">
      {/* Header + search + primary action */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-brand-text">
              Project portal
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-heading tracking-tight mt-1">Projects</h2>
            <p className="text-sm text-muted mt-1">{rows.length} of {projects.length} in view</p>
          </div>
          <button onClick={onNew} className="btn btn-primary py-2.5 px-4 self-start sm:self-auto whitespace-nowrap">
            <PlusIcon className="w-4 h-4 mr-2" /> New Project
          </button>
        </div>

        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or ID..."
            className="glass-input !pl-10 w-full"
          />
        </div>

        {/* Segmented filter — horizontal scroll on small screens */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-0.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`shrink-0 px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                status === s
                  ? "bg-brand text-on-brand shadow-[0_4px_15px_rgba(212,175,55,0.3)]"
                  : "bg-card text-muted border border-border-subtle hover:border-border-accent hover:text-brand-text"
              }`}
            >
              {s} <span className="ml-1 tabular-nums opacity-70">{countFor(s)}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="text-danger text-sm bg-danger-bg border border-danger-border rounded-xl px-4 py-3">{String(error)}</div>
      )}

      {/* List rows */}
      <div className="glass-card !p-0">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader text="Loading projects..." size="md" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title={projects.length === 0 ? "No projects yet" : "No matching projects"}
              hint={projects.length === 0 ? "Create your first project to get started." : "Try a different search or filter."}
            />
          </div>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {rows.map((p, i) => {
              const pct = typeof p.progress === "number" ? p.progress : p.status === "Completed" ? 100 : p.status === "Active" ? 50 : 20;
              return (
                <li
                  key={p._id || i}
                  onClick={() => onRowClick?.(p)}
                  className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 cursor-pointer hover:bg-amber-50/60 transition-colors min-w-0"
                >
                  <span
                    className={`hidden sm:block w-1 self-stretch rounded-full shrink-0 ${
                      STRIPE[p.status] || "bg-neutral"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <p className="text-sm font-bold text-heading truncate group-hover:text-brand-text transition-colors">
                        {p.title}
                      </p>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                        {p.projectID || "—"}
                      </span>
                    </div>
                    {p.description && <p className="text-xs text-muted truncate mt-0.5">{p.description}</p>}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-muted">
                      <span className="whitespace-nowrap">Owner: {ownerName(p)}</span>
                      <span className="hidden sm:inline">·</span>
                      <span className="whitespace-nowrap">
                        {formatDate(p.startDate)} → {formatDate(p.dueDate)}
                      </span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 sm:gap-2 shrink-0 w-full sm:w-auto">
                    <DotStatus tone={PROJECT_STATUS_TONE[p.status] || "neutral"}>{p.status || "Planning"}</DotStatus>
                    <div className="flex items-center gap-3">
                      <div className="w-24 sm:w-32">
                        <Progress value={pct} />
                      </div>
                      <span className="text-[11px] font-bold text-muted tabular-nums w-8 text-right">{pct}%</span>
                      <div className="hidden sm:block">
                        <AvatarStack people={p.team || (p.owner ? [p.owner] : [])} max={3} />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function ownerName(p) {
  const o = p?.owner;
  if (!o) return "—";
  if (o.firstName) return `${o.firstName} ${o.lastName || ""}`.trim();
  return o.name || o.email || "—";
}
