/**
 * PROTOTYPE — Variant B "Split Workspace" (Project Dashboard).
 * No stat-card grid: compact editorial header, left "workstream" column of
 * large rows + deadlines timeline, right sticky rail (time ring, stats, team).
 * Responsive: rails stack on mobile; rail becomes sticky from lg up.
 */
import { useNavigate } from "react-router-dom";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { DotStatus, Progress, AvatarStack, RailTitle, EmptyState, shortDate, isOverdue, PROJECT_STATUS_TONE } from "./bits";

function projectProgress(p) {
  if (typeof p?.progress === "number") return p.progress;
  if (p?.status === "Completed") return 100;
  if (p?.status === "Active") return 50;
  return 20;
}

export default function DashboardB({ data }) {
  const navigate = useNavigate();
  const d = data || {};
  const projects = d.recentProjects || [];
  const deadlines = d.upcomingDeadlines || [];
  const team = d.teamMembers || [];
  const tracking = d.timeTracking || { totalHours: 0, targetHours: 40, dailyBreakdown: [] };
  const pctTime = Math.min(
    100,
    Math.round(((tracking.totalHours || 0) / (tracking.targetHours || 40)) * 100)
  );

  const stats = [
    { label: "Active projects", value: d.activeProjects ?? 0 },
    { label: "Completed", value: d.completedProjects ?? 0 },
    { label: "Open tasks", value: d.openTasks ?? 0 },
    { label: "Groups", value: d.projectGroups ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Compact header — no card */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em] text-brand-text">
            Project portal
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-heading tracking-tight mt-1">Your work, this week</h2>
          <p className="text-sm text-muted mt-1">
            {d.activeProjects ?? 0} active projects · {d.openTasks ?? 0} open tasks · {team.length} teammates
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => navigate("/project/projects")} className="btn btn-secondary py-2.5 px-4">
            All projects
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] gap-4 items-start">
        {/* ── Main column ── */}
        <div className="flex flex-col gap-4 min-w-0">
          {/* Workstream rows */}
          <section className="glass-card min-w-0">
            <RailTitle
              eyebrow="Workstream"
              title="Active projects"
              action={
                <button
                  onClick={() => navigate("/project/projects")}
                  className="flex items-center gap-1 text-xs font-bold text-brand-text hover:underline shrink-0"
                >
                  View all <ArrowRightIcon className="w-3.5 h-3.5" />
                </button>
              }
            />
            {projects.length === 0 ? (
              <EmptyState title="No active projects" hint="Projects in Planning or Active status show up here." />
            ) : (
              <ul className="divide-y divide-border-subtle">
                {projects.map((p, i) => (
                  <li
                    key={p._id || i}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4 min-w-0 hover:bg-amber-50/60 transition-colors -mx-2 px-2 rounded-lg"
                  >
                    <span className="hidden sm:block text-[11px] font-black text-brand-text tabular-nums w-5 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-heading truncate">{p.title}</p>
                        <DotStatus tone={PROJECT_STATUS_TONE[p.status] || "neutral"}>{p.status || "Planning"}</DotStatus>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <Progress value={projectProgress(p)} className="max-w-[220px]" />
                        <span className="text-[11px] text-muted whitespace-nowrap">Due {shortDate(p.dueDate)}</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex sm:block">
                      <AvatarStack people={p.team || (p.owner ? [p.owner] : [])} max={3} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Deadlines timeline */}
          <section className="glass-card min-w-0">
            <RailTitle eyebrow="Coming up" title="Deadlines" />
            {deadlines.length === 0 ? (
              <EmptyState title="No deadlines soon" hint="Tasks with upcoming due dates appear here." />
            ) : (
              <ul className="relative pl-5 ml-1">
                <span className="absolute left-1.5 top-2 bottom-2 w-px bg-border-accent" aria-hidden />
                {deadlines.map((dl, i) => {
                  const overdue = isOverdue(dl.dueDate, dl.status);
                  return (
                    <li key={i} className="relative pb-4 last:pb-0 min-w-0">
                      <span
                        className={`absolute -left-[15px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-surface ${
                          overdue ? "bg-danger" : "bg-brand"
                        }`}
                      />
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <p className="text-sm font-bold text-heading truncate">{dl.task}</p>
                        <span className="text-[11px] text-muted">{dl.project}</span>
                        <span
                          className={`text-[11px] font-bold whitespace-nowrap ${overdue ? "text-danger" : "text-brand-text"}`}
                        >
                          {shortDate(dl.dueDate)}
                        </span>
                        <DotStatus tone={PROJECT_STATUS_TONE[dl.status] || TASK_FALLBACK(dl.status)}>
                          {dl.status}
                        </DotStatus>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* ── Sticky right rail ── */}
        <aside className="flex flex-col gap-4 min-w-0 lg:sticky lg:top-0">
          {/* Time ring */}
          <section className="glass-card">
            <RailTitle eyebrow="Time tracking" title="This week" />
            <div className="flex items-center gap-4">
              <div
                className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 rounded-full"
                style={{
                  background: `conic-gradient(var(--color-brand-primary) ${pctTime * 3.6}deg, var(--color-bg-tertiary) 0deg)`,
                }}
              >
                <div className="absolute inset-3 rounded-full bg-surface flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-heading tabular-nums leading-none">
                    {tracking.totalHours || 0}h
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted mt-1">
                    of {tracking.targetHours || 40}h
                  </span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <ul className="flex flex-col gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {(tracking.dailyBreakdown || []).map((dd) => (
                    <li key={dd.day} className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-muted font-semibold uppercase tracking-wider text-[10px]">{dd.day}</span>
                      <span className="text-heading font-bold tabular-nums">{dd.hours || 0}h</span>
                    </li>
                  ))}
                  {(tracking.dailyBreakdown || []).length === 0 && (
                    <li className="text-xs text-muted">No hours logged yet.</li>
                  )}
                </ul>
              </div>
            </div>
          </section>

          {/* Mini stats — rail form instead of KPI cards */}
          <section className="glass-card">
            <RailTitle eyebrow="At a glance" title="Numbers" />
            <ul className="divide-y divide-border-subtle">
              {stats.map((s) => (
                <li key={s.label} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted">{s.label}</span>
                  <span className="text-lg font-black text-heading tabular-nums">{s.value}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Team */}
          <section className="glass-card">
            <RailTitle eyebrow="People" title="Team members" />
            {team.length === 0 ? (
              <EmptyState title="No team members yet" hint="People on your projects appear here." />
            ) : (
              <ul className="flex flex-col gap-3 max-h-56 overflow-y-auto pr-1">
                {team.map((m, i) => (
                  <li key={i} className="flex items-center gap-3 min-w-0">
                    <AvatarStack people={[m]} max={1} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-heading truncate">{m.name}</p>
                      <p className="text-[11px] text-muted truncate">{m.role}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function TASK_FALLBACK(status) {
  if (status === "Done") return "success";
  if (status === "Blocked") return "danger";
  return "info";
}
