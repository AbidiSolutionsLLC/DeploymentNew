/**
 * PROTOTYPE — Variant A "Command Center" (Project Dashboard).
 * KPI ribbon in a single glass card + asymmetric bento grid of panels.
 * Responsive: KPI ribbon 2 cols → 4 cols, bento 1 → 2 → 3 cols.
 */
import { useNavigate } from "react-router-dom";
import {
  FolderIcon,
  CheckCircleIcon,
  ListBulletIcon,
  Squares2X2Icon,
  ArrowRightIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import {
  Pill,
  Progress,
  SectionHead,
  EmptyState,
  shortDate,
  isOverdue,
  TASK_STATUS_TONE,
  PROJECT_STATUS_TONE,
} from "./bits";

const KPIS = [
  { label: "Active Projects", key: "activeProjects", Icon: FolderIcon },
  { label: "Completed Projects", key: "completedProjects", Icon: CheckCircleIcon },
  { label: "Open Tasks", key: "openTasks", Icon: ListBulletIcon },
  { label: "Project Groups", key: "projectGroups", Icon: Squares2X2Icon },
];

function projectProgress(p) {
  if (typeof p?.progress === "number") return p.progress;
  if (p?.status === "Completed") return 100;
  if (p?.status === "Active") return 50;
  return 20;
}

export default function DashboardA({ data }) {
  const navigate = useNavigate();
  const d = data || {};
  const projects = d.recentProjects || [];
  const tasks = d.recentTasks || [];
  const deadlines = d.upcomingDeadlines || [];
  const team = d.teamMembers || [];
  const tracking = d.timeTracking || { totalHours: 0, targetHours: 40, dailyBreakdown: [] };
  const days = tracking.dailyBreakdown || [];
  const barMaxPx = 88;
  const maxDay = Math.max(8, ...days.map((x) => x.hours || 0));

  return (
    <div className="flex flex-col gap-4">
      {/* Command header */}
      <div className="glass-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-heading uppercase tracking-tight">Project Command Center</h2>
          <p className="text-muted text-[10px] sm:text-xs font-medium uppercase tracking-wide mt-1">
            Live status of your projects, tasks and team
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-brand-text shrink-0">
          <CalendarDaysIcon className="w-4 h-4" />
          {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
        </div>
      </div>

      {/* KPI ribbon — one card, hairline grid inside */}
      <div className="glass-card overflow-hidden !p-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border-subtle">
          {KPIS.map((kpi) => {
            const KpiIcon = kpi.Icon;
            return (
              <div key={kpi.key} className="bg-surface px-4 py-4 sm:px-5 sm:py-5 flex items-center gap-3 min-w-0">
                <span className="w-9 h-9 shrink-0 rounded-lg bg-amber-50 border border-border-accent text-brand-text flex items-center justify-center">
                  <KpiIcon className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-black text-heading leading-none tabular-nums">
                    {d[kpi.key] ?? 0}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted truncate">{kpi.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Active projects — wide panel */}
        <section className="glass-card sm:col-span-2 lg:col-span-2 flex flex-col min-w-0">
          <SectionHead
            title="Active Projects"
            subtitle="Ongoing work & status"
            action={
              <button
                onClick={() => navigate("/project/projects")}
                className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-brand-text hover:underline shrink-0"
              >
                View all <ArrowRightIcon className="w-3.5 h-3.5" />
              </button>
            }
          />
          {projects.length === 0 ? (
            <EmptyState title="No active projects" hint="Projects in Planning or Active status show up here." />
          ) : (
            <ul className="divide-y divide-border-subtle -mx-1 px-1">
              {projects.map((p, i) => (
                <li key={p._id || i} className="py-3 flex flex-col gap-2 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-heading truncate">{p.title}</span>
                    <Pill tone={PROJECT_STATUS_TONE[p.status] || "neutral"}>{p.status || "Planning"}</Pill>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={projectProgress(p)} />
                    <span className="text-[10px] font-bold text-muted tabular-nums shrink-0 w-9 text-right">
                      {projectProgress(p)}%
                    </span>
                    <span className="text-[10px] font-medium text-muted shrink-0 whitespace-nowrap">
                      Due {shortDate(p.dueDate)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Time tracking */}
        <section className="glass-card flex flex-col min-w-0">
          <SectionHead title="Time This Week" subtitle={`${tracking.totalHours || 0}h of ${tracking.targetHours || 40}h target`} />
          <div className="flex items-end gap-2 h-24 mb-2">
            {days.length === 0 && (
              <p className="text-xs text-muted self-center mx-auto">No hours logged this week.</p>
            )}
            {days.map((dd) => {
              const h = dd.hours || 0;
              const px = Math.round((h / maxDay) * barMaxPx);
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
          <div className="mt-auto">
            <Progress value={Math.min(100, Math.round(((tracking.totalHours || 0) / (tracking.targetHours || 40)) * 100))} />
            <p className="text-[10px] uppercase tracking-widest text-muted mt-1.5">
              {Math.min(100, Math.round(((tracking.totalHours || 0) / (tracking.targetHours || 40)) * 100))}% of weekly target
            </p>
          </div>
        </section>

        {/* Recent tasks */}
        <section className="glass-card flex flex-col min-w-0">
          <SectionHead
            title="Open Tasks"
            subtitle="Assigned to you"
            action={
              <button
                onClick={() => navigate("/project/myTasks")}
                className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-brand-text hover:underline shrink-0"
              >
                View all <ArrowRightIcon className="w-3.5 h-3.5" />
              </button>
            }
          />
          {tasks.length === 0 ? (
            <EmptyState title="No open tasks" hint="Tasks assigned to you appear here." />
          ) : (
            <ul className="divide-y divide-border-subtle -mx-1 px-1 flex-1">
              {tasks.map((t, i) => (
                <li key={t._id || i} className="py-2.5 flex items-start justify-between gap-2 min-w-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-heading truncate">{t.title}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted truncate mt-0.5">
                      {t.project?.title || "No project"}
                    </p>
                  </div>
                  <div className="shrink-0 pt-0.5">
                    <Pill tone={TASK_STATUS_TONE[t.status] || "neutral"}>{t.status || "Todo"}</Pill>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Deadlines */}
        <section className="glass-card flex flex-col min-w-0">
          <SectionHead title="Upcoming Deadlines" subtitle="Next tasks due" />
          {deadlines.length === 0 ? (
            <EmptyState title="No deadlines soon" hint="Tasks with due dates appear here." />
          ) : (
            <ul className="flex flex-col gap-2.5 flex-1">
              {deadlines.map((dl, i) => {
                const dd = new Date(dl.dueDate);
                const overdue = isOverdue(dl.dueDate, dl.status);
                return (
                  <li key={i} className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 shrink-0 rounded-lg text-center py-1 border ${
                        overdue ? "bg-danger-bg border-danger-border" : "bg-amber-50 border-border-accent"
                      }`}
                    >
                      <p
                        className={`text-[9px] font-black uppercase leading-none ${
                          overdue ? "text-danger" : "text-brand-text"
                        }`}
                      >
                        {Number.isNaN(dd.getTime()) ? "—" : dd.toLocaleDateString(undefined, { month: "short" })}
                      </p>
                      <p className={`text-base font-black leading-tight ${overdue ? "text-danger" : "text-heading"}`}>
                        {Number.isNaN(dd.getTime()) ? "?" : dd.getDate()}
                      </p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-heading truncate">{dl.task}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted truncate">{dl.project}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Team */}
        <section className="glass-card flex flex-col min-w-0">
          <SectionHead title="Team Members" subtitle={`${team.length} people across your projects`} />
          {team.length === 0 ? (
            <EmptyState title="No team members yet" hint="People on your projects appear here." />
          ) : (
            <ul className="flex flex-col gap-2.5 flex-1 overflow-y-auto max-h-[240px] pr-1">
              {team.map((m, i) => (
                <li key={i} className="flex items-center gap-3 min-w-0">
                  <img
                    src={m.avatar}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover border border-border-accent shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.visibility = "hidden";
                    }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-heading truncate">{m.name}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted truncate">{m.role}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
