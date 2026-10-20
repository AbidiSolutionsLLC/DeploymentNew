import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  CheckCircleIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  PlusIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { FaFolderOpen, FaCheckCircle, FaListUl, FaThLarge } from "react-icons/fa";
import { fetchProjectDashboard } from "../../store/projectSlice";
import Loader from "../../components/ui/Loader";
import PageContainer from "../../components/ui/PageContainer";
import StatCard from "../../components/ui/StatCard";
import PortalHero from "../../components/ui/PortalHero";
import Pill, { PROJECT_STATUS_TONE, TASK_STATUS_TONE } from "../../components/projectPortal/Pill";
import Progress from "../../components/projectPortal/Progress";
import PanelHead from "../../components/projectPortal/PanelHead";
import EmptyState from "../../components/projectPortal/EmptyState";
import { shortDate, isOverdue, projectProgress } from "../../components/projectPortal/helpers";

/**
 * Project Dashboard — "Command Center" layout (PROJECT_PORTAL_DESIGN.md §9.1):
 * header card + KPI ribbon (one card, hairline grid) + asymmetric bento grid.
 * Responsive: KPI 2→4 cols, bento 1→2→3 cols. All data from GET /projects/dashboard.
 */
const KPIS = [
  { label: "Active Projects", key: "activeProjects", Icon: FaFolderOpen, sub: "Currently in flight", tone: "text-amber-600 dark:text-amber-400" },
  { label: "Completed Projects", key: "completedProjects", Icon: FaCheckCircle, sub: "Delivered to date", tone: "text-emerald-600 dark:text-emerald-400" },
  { label: "Open Tasks", key: "openTasks", Icon: FaListUl, sub: "Assigned to you", tone: "text-sky-600 dark:text-sky-400" },
  { label: "Project Groups", key: "projectGroups", Icon: FaThLarge, sub: "Delivery portfolios", tone: "text-indigo-600 dark:text-indigo-400" },
];

const ProjectDashBoard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { dashboardData, loading, error } = useSelector((state) => state.projects);

  useEffect(() => {
    dispatch(fetchProjectDashboard());
  }, [dispatch]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader size="xl" text="Loading Project Dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-danger bg-danger-bg border border-danger-border rounded-xl px-4 py-3">
        {String(error)}
      </div>
    );
  }

  const d = dashboardData || {};
  const projects = d.recentProjects || [];
  const tasks = d.recentTasks || [];
  const deadlines = d.upcomingDeadlines || [];
  const team = d.teamMembers || [];
  const taskPriorities = d.taskPriorities || {
    high: tasks.filter((t) => t.priority === "High").length,
    medium: tasks.filter((t) => t.priority === "Medium" || !t.priority).length,
    low: tasks.filter((t) => t.priority === "Low").length,
    overdue: deadlines.filter((dl) => isOverdue(dl.dueDate, dl.status)).length,
    total: d.openTasks ?? tasks.length,
  };

  return (
    <PageContainer isCard={false}>
      <div className="flex flex-col gap-4 w-full">
      {/* Command header */}
      <PortalHero
        label="Project command center overview"
        title="Project Command Center"
        description="Live status of your projects, tasks and team."
      />

      {/* KPI cards */}
      <div className="lm-stagger grid grid-cols-2 xl:grid-cols-4 gap-4">
        {KPIS.map((kpi) => (
          <StatCard
            key={kpi.key}
            title={kpi.label}
            value={d[kpi.key] ?? 0}
            sub={kpi.sub}
            icon={kpi.Icon}
            tone={kpi.tone}
          />
        ))}
      </div>

      {/* Toolbar card — navigation & actions live here, never in the hero */}
      <div className="glass-card !p-3.5 sm:!p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-brand-text">
            <CalendarDaysIcon className="w-4 h-4" />
            {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:ml-auto">
            <button
              type="button"
              onClick={() => navigate("/project/myTasks")}
              className="btn btn-secondary py-2.5 px-3"
            >
              <ClipboardDocumentListIcon className="w-4 h-4 mr-2" />
              My tasks
            </button>
            <button
              type="button"
              onClick={() => navigate("/project/projects")}
              className="btn btn-primary py-2.5 px-3"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Projects
            </button>
          </div>
        </div>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Active projects — wide panel */}
        <section className="glass-card sm:col-span-2 lg:col-span-2 flex flex-col min-w-0 bg-surface">
          <PanelHead
            title="Active Projects"
            subtitle="Ongoing work & status"
            action={
              <button
                type="button"
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
              {projects.map((p, i) => {
                const pct = projectProgress(p);
                return (
                  <li key={p._id || i} className="py-3 flex flex-col gap-2 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-heading truncate">{p.title}</span>
                      <Pill tone={PROJECT_STATUS_TONE[p.status] || "neutral"}>{p.status || "Planning"}</Pill>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={pct} />
                      <span className="text-[10px] font-bold text-muted tabular-nums shrink-0 w-9 text-right">{pct}%</span>
                      <span className="text-[10px] font-medium text-muted shrink-0 whitespace-nowrap">
                        Due {shortDate(p.dueDate)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Task Priorities & Urgency */}
        <section className="glass-card flex flex-col min-w-0 bg-surface justify-between">
          <div>
            <PanelHead
              title="Task Priorities"
              subtitle={`${taskPriorities.high} urgent · ${taskPriorities.total} open`}
              action={
                <button
                  type="button"
                  onClick={() => navigate("/project/myTasks")}
                  className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-brand-text hover:underline shrink-0"
                >
                  View all <ArrowRightIcon className="w-3.5 h-3.5" />
                </button>
              }
            />

            <div className="flex flex-col gap-3 mt-1">
              {/* High Priority */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Pill tone="danger">High</Pill>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Urgent</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-heading tabular-nums">{taskPriorities.high}</span>
                    <span className="text-[10px] font-bold text-muted tabular-nums">
                      ({taskPriorities.total > 0 ? Math.round((taskPriorities.high / taskPriorities.total) * 100) : 0}%)
                    </span>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-border-subtle overflow-hidden">
                  <div
                    className="h-full rounded-full bg-danger transition-all duration-500"
                    style={{
                      width: `${taskPriorities.total > 0 ? Math.round((taskPriorities.high / taskPriorities.total) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Medium Priority */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Pill tone="warning">Medium</Pill>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">In flight</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-heading tabular-nums">{taskPriorities.medium}</span>
                    <span className="text-[10px] font-bold text-muted tabular-nums">
                      ({taskPriorities.total > 0 ? Math.round((taskPriorities.medium / taskPriorities.total) * 100) : 0}%)
                    </span>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-border-subtle overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-500"
                    style={{
                      width: `${taskPriorities.total > 0 ? Math.round((taskPriorities.medium / taskPriorities.total) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Low Priority */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Pill tone="neutral">Low</Pill>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Routine</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-heading tabular-nums">{taskPriorities.low}</span>
                    <span className="text-[10px] font-bold text-muted tabular-nums">
                      ({taskPriorities.total > 0 ? Math.round((taskPriorities.low / taskPriorities.total) * 100) : 0}%)
                    </span>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-border-subtle overflow-hidden">
                  <div
                    className="h-full rounded-full bg-neutral transition-all duration-500"
                    style={{
                      width: `${taskPriorities.total > 0 ? Math.round((taskPriorities.low / taskPriorities.total) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom health indicator */}
          <div className="pt-3 mt-3 border-t border-border-subtle">
            {taskPriorities.overdue > 0 ? (
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-danger-bg border border-danger-border">
                <div className="flex items-center gap-2 min-w-0">
                  <ExclamationTriangleIcon className="w-4 h-4 text-danger shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-danger truncate">
                    {taskPriorities.overdue} {taskPriorities.overdue === 1 ? "task is" : "tasks are"} past due
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/project/myTasks")}
                  className="text-[10px] font-black uppercase tracking-wider text-danger hover:underline shrink-0 ml-1"
                >
                  Review
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-success-bg border border-success-border">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircleIcon className="w-4 h-4 text-success shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-success truncate">
                    All deadlines on schedule
                  </span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-success">Healthy</span>
              </div>
            )}
          </div>
        </section>

        {/* Recent tasks */}
        <section className="glass-card flex flex-col min-w-0 bg-surface">
          <PanelHead
            title="Open Tasks"
            subtitle="Assigned to you"
            action={
              <button
                type="button"
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
        <section className="glass-card flex flex-col min-w-0 bg-surface">
          <PanelHead title="Upcoming Deadlines" subtitle="Next tasks due" />
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
        <section className="glass-card flex flex-col min-w-0 bg-surface">
          <PanelHead title="Team Members" subtitle={`${team.length} people across your projects`} />
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
    </PageContainer>
  );
};

export default ProjectDashBoard;
