/**
 * PROTOTYPE — Variant C "Board & Metrics" (Project Dashboard).
 * Full-width gradient metrics band + a delivery kanban of recent projects,
 * with stacked widgets (time / deadlines / team) in the right column.
 * Band metrics: 2x2 on phones → 4 across from sm.
 */
import { useNavigate } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import {
  Column,
  BoardScroll,
  Chip,
  EmptyState,
  shortDate,
  PROJECT_COLUMNS,
  TASK_STATUS_TONE,
} from "./bits";

function projectProgress(p) {
  if (typeof p?.progress === "number") return p.progress;
  if (p?.status === "Completed") return 100;
  if (p?.status === "Active") return 50;
  return 20;
}

const COLUMN_TONE = { Planning: "info", Active: "success", "On Hold": "warning", Completed: "neutral" };

export default function DashboardC({ data }) {
  const navigate = useNavigate();
  const d = data || {};
  const projects = d.recentProjects || [];
  const deadlines = d.upcomingDeadlines || [];
  const tasks = d.recentTasks || [];
  const team = d.teamMembers || [];
  const tracking = d.timeTracking || { totalHours: 0, targetHours: 40, dailyBreakdown: [] };

  const metrics = [
    { label: "Active projects", value: d.activeProjects ?? 0 },
    { label: "Completed", value: d.completedProjects ?? 0 },
    { label: "Open tasks", value: d.openTasks ?? 0 },
    { label: "Groups", value: d.projectGroups ?? 0 },
  ];

  const days = tracking.dailyBreakdown || [];
  const maxDay = Math.max(8, ...days.map((x) => x.hours || 0));

  return (
    <div className="flex flex-col gap-4">
      {/* ── Metrics band ── */}
      <div
        className="rounded-[1.75rem] border border-border-accent overflow-hidden shadow-[0_8px_32px_rgba(212,175,55,0.25)]"
        style={{ background: "linear-gradient(120deg, var(--color-brand-primary) 0%, var(--color-brand-accent) 100%)" }}
      >
        <div className="p-5 sm:p-6 text-on-brand flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] opacity-80">
              Delivery overview
            </p>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight mt-1">Project Board & Metrics</h2>
            <p className="text-xs sm:text-sm opacity-90 mt-1">
              {d.activeProjects ?? 0} active · {d.completedProjects ?? 0} completed · {d.openTasks ?? 0} open tasks
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 lg:gap-4 w-full lg:w-auto">
            {metrics.map((m) => (
              <div key={m.label} className="rounded-xl bg-white/20 px-3 py-2.5 min-w-0">
                <p className="text-xl sm:text-2xl font-black tabular-nums leading-none">{m.value}</p>
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-90 mt-1 truncate">
                  {m.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Board + widgets ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 items-start">
        <section className="glass-card min-w-0">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="min-w-0">
              <h3 className="text-sm font-black text-heading uppercase tracking-wider">Delivery Board</h3>
              <p className="text-[10px] uppercase tracking-widest text-muted mt-0.5">Recent projects by status</p>
            </div>
            <button
              onClick={() => navigate("/project/projects")}
              className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-brand-text hover:underline shrink-0"
            >
              Open board <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {projects.length === 0 ? (
            <EmptyState title="No projects on the board" hint="Projects in Planning or Active status show up here." />
          ) : (
            <BoardScroll>
              {PROJECT_COLUMNS.map((col) => {
                const items = projects.filter((p) => p.status === col);
                return (
                  <Column key={col} title={col} count={items.length} tone={COLUMN_TONE[col]}>
                    {items.length === 0 ? (
                      <p className="text-[11px] text-muted text-center py-3">No projects</p>
                    ) : (
                      items.map((p, i) => (
                        <article
                          key={p._id || i}
                          className="rounded-lg bg-surface border border-border-subtle p-3 hover:border-border-accent transition-colors"
                        >
                          <p className="text-xs font-bold text-heading truncate">{p.title}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="w-full h-1 rounded-full bg-border-subtle overflow-hidden">
                              <div
                                className="h-full rounded-full bg-brand"
                                style={{ width: `${projectProgress(p)}%` }}
                              />
                            </div>
                            <span className="text-[9px] font-black text-muted tabular-nums">{projectProgress(p)}%</span>
                          </div>
                          <p className="text-[10px] text-muted mt-1.5">Due {shortDate(p.dueDate)}</p>
                        </article>
                      ))
                    )}
                  </Column>
                );
              })}
            </BoardScroll>
          )}
        </section>

        <aside className="flex flex-col gap-4 min-w-0">
          {/* Time */}
          <section className="glass-card">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-sm font-black text-heading uppercase tracking-wider">Time This Week</h3>
              <span className="text-xs font-black text-brand-text tabular-nums">
                {tracking.totalHours || 0}/{tracking.targetHours || 40}h
              </span>
            </div>
            <div className="flex items-end gap-2 h-24">
              {days.length === 0 && <p className="text-xs text-muted self-center mx-auto">No hours logged this week.</p>}
              {days.map((dd) => {
                const h = dd.hours || 0;
                const px = Math.round((h / maxDay) * 84);
                return (
                  <div key={dd.day} className="flex-1 min-w-0 flex flex-col items-center justify-end h-full gap-1">
                    <span className="text-[9px] font-bold text-heading tabular-nums">{h}h</span>
                    <div
                      className="w-full rounded-t-sm bg-gradient-to-t from-amber-600 to-amber-500"
                      style={{ height: `${Math.max(px, 3)}px` }}
                    />
                    <span className="text-[9px] font-black uppercase tracking-wider text-muted">{dd.day}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Deadlines */}
          <section className="glass-card">
            <h3 className="text-sm font-black text-heading uppercase tracking-wider mb-3">Upcoming Deadlines</h3>
            {deadlines.length === 0 ? (
              <EmptyState title="No deadlines soon" hint="Tasks with due dates appear here." />
            ) : (
              <ul className="flex flex-col gap-2.5">
                {deadlines.map((dl, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-heading truncate">{dl.task}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted truncate">{dl.project}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[11px] font-black text-brand-text whitespace-nowrap">{shortDate(dl.dueDate)}</span>
                      <Chip tone={TASK_STATUS_TONE[dl.status] || "info"}>{dl.status}</Chip>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Open tasks */}
          <section className="glass-card">
            <h3 className="text-sm font-black text-heading uppercase tracking-wider mb-3">Open Tasks</h3>
            {tasks.length === 0 ? (
              <EmptyState title="No open tasks" hint="Tasks assigned to you appear here." />
            ) : (
              <ul className="flex flex-col gap-2.5">
                {tasks.map((t, i) => (
                  <li key={t._id || i} className="flex items-center justify-between gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-heading truncate">{t.title}</p>
                      <p className="text-[10px] text-muted truncate">{t.project?.title || "No project"}</p>
                    </div>
                    <Chip tone={TASK_STATUS_TONE[t.status] || "neutral"}>{t.status || "Todo"}</Chip>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Team */}
          <section className="glass-card">
            <h3 className="text-sm font-black text-heading uppercase tracking-wider mb-3">
              Team <span className="text-muted font-bold">({team.length})</span>
            </h3>
            {team.length === 0 ? (
              <EmptyState title="No team members yet" hint="People on your projects appear here." />
            ) : (
              <div className="flex flex-wrap gap-2">
                {team.map((m, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-2 rounded-full bg-app border border-border-subtle pl-1 pr-3 py-1 max-w-full"
                    title={m.email}
                  >
                    <img src={m.avatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                    <span className="text-[11px] font-semibold text-heading truncate">{m.name}</span>
                  </span>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
