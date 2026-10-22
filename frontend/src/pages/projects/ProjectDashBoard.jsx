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
  RectangleStackIcon,
} from "@heroicons/react/24/outline";
import { FaCheckCircle, FaLayerGroup, FaProjectDiagram, FaTasks } from "react-icons/fa";
import { fetchProjectDashboard } from "../../store/projectSlice";
import Loader from "../../components/ui/Loader";
import PageContainer from "../../components/ui/PageContainer";
import PortalHero from "../../components/ui/PortalHero";
import { TableAvatar, TableStatus } from "../../components/ui/TableCells";
import Progress from "../../components/projectPortal/Progress";
import PanelHead from "../../components/projectPortal/PanelHead";
import EmptyState from "../../components/projectPortal/EmptyState";
import { shortDate, isOverdue, projectProgress, personName } from "../../components/projectPortal/helpers";

/**
 * Project Dashboard — "Command Center" layout (PROJECT_PORTAL_DESIGN.md §9.1):
 * header card + KPI ribbon (one card, hairline grid) + asymmetric bento grid.
 * Responsive: KPI 2→4 cols, bento 1→2→3 cols. All data from GET /projects/dashboard.
 */
const KPIS = [
  { label: "Active Projects", key: "activeProjects", Icon: FaProjectDiagram, sub: "Currently in flight", tone: "amber" },
  { label: "Completed Projects", key: "completedProjects", Icon: FaCheckCircle, sub: "Delivered to date", tone: "emerald" },
  { label: "Open Tasks", key: "openTasks", Icon: FaTasks, sub: "Assigned to you", tone: "sky" },
  { label: "Project Groups", key: "projectGroups", Icon: FaLayerGroup, sub: "Delivery portfolios", tone: "violet" },
];

/*
 * Explicit colour pairs per KPI tone.
 * NOTE: these use raw rgba/hex values instead of Tailwind's `amber-*` scale —
 * that scale is remapped to color-mix() tokens in tailwind.config.js, which
 * makes `/opacity` dark utilities (e.g. dark:bg-amber-900/20) silently drop
 * out of the build. Raw values also bypass the `.dark .bg-amber-*` safety-net
 * layer in index.css, so the dark palette below is exactly what renders.
 */
const KPI_TONES = {
  amber: {
    wash: "bg-[rgba(232,213,160,0.25)] dark:bg-[rgba(251,191,36,0.09)]",
    tile: "border-accent bg-[linear-gradient(135deg,#E8D5A0,#C5B588)] text-brand-text dark:border-[rgba(251,191,36,0.45)] dark:bg-[linear-gradient(135deg,rgba(251,191,36,0.30),rgba(245,158,11,0.10))] dark:text-[#FFE7A3] dark:shadow-[0_0_26px_-6px_rgba(251,191,36,0.65)]",
    rail: "via-[rgba(251,191,36,0.8)]",
    glow: "dark:bg-[radial-gradient(circle_at_18%_0%,rgba(251,191,36,0.16),transparent_62%)]",
    value: "dark:[text-shadow:0_0_24px_rgba(251,191,36,0.4)]",
  },
  emerald: {
    wash: "dark:hover:bg-[rgba(16,185,129,0.05)]",
    tile: "border-border-subtle bg-app text-muted group-hover:border-border-accent group-hover:text-brand-text dark:border-[rgba(52,211,153,0.4)] dark:bg-[rgba(16,185,129,0.16)] dark:text-[#6EE7B7] dark:shadow-[0_0_24px_-8px_rgba(16,185,129,0.75)]",
    rail: "via-[rgba(52,211,153,0.75)]",
    glow: "dark:bg-[radial-gradient(circle_at_18%_0%,rgba(16,185,129,0.14),transparent_62%)]",
    value: "dark:[text-shadow:0_0_24px_rgba(16,185,129,0.35)]",
  },
  sky: {
    wash: "dark:hover:bg-[rgba(56,189,248,0.05)]",
    tile: "border-border-subtle bg-app text-muted group-hover:border-border-accent group-hover:text-brand-text dark:border-[rgba(56,189,248,0.4)] dark:bg-[rgba(56,189,248,0.16)] dark:text-[#7DD3FC] dark:shadow-[0_0_24px_-8px_rgba(56,189,248,0.75)]",
    rail: "via-[rgba(56,189,248,0.75)]",
    glow: "dark:bg-[radial-gradient(circle_at_18%_0%,rgba(56,189,248,0.14),transparent_62%)]",
    value: "dark:[text-shadow:0_0_24px_rgba(56,189,248,0.35)]",
  },
  violet: {
    wash: "dark:hover:bg-[rgba(167,139,250,0.05)]",
    tile: "border-border-subtle bg-app text-muted group-hover:border-border-accent group-hover:text-brand-text dark:border-[rgba(167,139,250,0.4)] dark:bg-[rgba(167,139,250,0.16)] dark:text-[#C4B5FD] dark:shadow-[0_0_24px_-8px_rgba(167,139,250,0.75)]",
    rail: "via-[rgba(167,139,250,0.75)]",
    glow: "dark:bg-[radial-gradient(circle_at_18%_0%,rgba(167,139,250,0.14),transparent_62%)]",
    value: "dark:[text-shadow:0_0_24px_rgba(167,139,250,0.35)]",
  },
};

const ProjectDashBoard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { dashboardData, loading, error } = useSelector((state) => state.projects);
  const authStateUser = useSelector((state) => state.auth.user);
  const user = authStateUser?.data?.user || authStateUser?.user || authStateUser || null;
  const userRole = (user?.role || '').replace(/\s+/g, '').toLowerCase();
  const isSuperAdmin = userRole === 'superadmin';
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const isEmployee = !isSuperAdmin && !isAdmin && !isManager;

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

  const priorityTotal = taskPriorities.total || 0;
  const priorityPct = (count) =>
    priorityTotal > 0 ? Math.round(((count || 0) / priorityTotal) * 100) : 0;
  const priorityBreakdown = [
    {
      key: "high",
      label: "High priority",
      hint: "Urgent · needs attention",
      count: taskPriorities.high || 0,
      dot: "bg-danger",
      bar: "bg-danger",
      tone: "text-danger",
    },
    {
      key: "medium",
      label: "Medium priority",
      hint: "In flight · steady progress",
      count: taskPriorities.medium || 0,
      dot: "bg-amber-500",
      bar: "bg-amber-500",
      tone: "text-brand-text",
    },
    {
      key: "low",
      label: "Low priority",
      hint: "Routine · flexible timing",
      count: taskPriorities.low || 0,
      dot: "bg-neutral",
      bar: "bg-neutral",
      tone: "text-muted",
    },
  ];

  return (
    <PageContainer isCard={false}>
      <div className="flex flex-col gap-4 w-full">
      {/* Command header */}
      <PortalHero
        label={isEmployee ? "My workspace overview" : "Project command center overview"}
        title={isEmployee ? "Project Dashboard" : "Project Command Center"}
        description={isEmployee ? "Live status of your assigned tasks, projects, and upcoming deadlines." : "Live status of your projects, tasks and team."}
      />

      {/* KPI command deck — one cohesive overview panel */}
      <section className="relative overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-[0_4px_20px_0_rgba(15,23,42,0.06)] backdrop-blur-[16px] dark:border-white/10 dark:bg-[linear-gradient(145deg,#1e293b_0%,#1a2436_55%,#162031_100%)] dark:shadow-[0_22px_60px_-24px_rgba(0,0,0,0.85)]">
        <span
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[rgba(232,213,160,0.7)] blur-3xl dark:bg-[rgba(251,191,36,0.16)]"
          aria-hidden="true"
        />
        <span
          className="pointer-events-none absolute -bottom-28 left-1/4 h-56 w-56 rounded-full bg-[rgba(232,213,160,0.3)] blur-3xl dark:bg-[rgba(251,191,36,0.08)]"
          aria-hidden="true"
        />

        <div className="relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {KPIS.map((kpi, index) => {
              const Icon = kpi.Icon;
              const tone = KPI_TONES[kpi.tone];
              const borders = [
                index > 0 ? "border-t border-border-subtle dark:border-white/10" : "",
                index % 2 === 1 ? "sm:border-l sm:border-border-subtle sm:dark:border-white/10" : "",
                index < 2 ? "sm:border-t-0" : "",
                index > 0 ? "lg:border-l lg:border-border-subtle lg:dark:border-white/10" : "",
                "lg:border-t-0",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div
                  key={kpi.key}
                  className={`group relative flex items-center gap-4 overflow-hidden px-5 py-5 transition-colors duration-300 ${tone.wash} ${borders}`}
                >
                  <span
                    className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent opacity-0 dark:opacity-100 ${tone.rail}`}
                    aria-hidden="true"
                  />
                  <span
                    className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${tone.glow}`}
                    aria-hidden="true"
                  />
                  <span
                    className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl border shadow-sm transition-all duration-300 group-hover:-translate-y-0.5 ${tone.tile}`}
                  >
                    <Icon size={18} />
                  </span>

                  <div className="relative min-w-0">
                    <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-muted dark:text-slate-300">
                      {kpi.label}
                    </p>
                    <p className={`mt-1.5 text-2xl font-black leading-none text-heading tabular-nums dark:text-white ${tone.value}`}>
                      {d[kpi.key] ?? 0}
                    </p>
                    <p className="mt-1 truncate text-[10px] font-medium text-muted dark:text-slate-400">{kpi.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

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
              className={`py-2.5 px-3 ${isEmployee ? "btn btn-primary" : "btn btn-secondary"}`}
            >
              <ClipboardDocumentListIcon className="w-4 h-4 mr-2" />
              My tasks
            </button>
            <button
              type="button"
              onClick={() => navigate("/project/projects")}
              className={`py-2.5 px-3 ${isEmployee ? "btn btn-secondary" : "btn btn-primary"}`}
            >
              <RectangleStackIcon className="w-4 h-4 mr-2" />
              {isEmployee ? "Assigned Projects" : "Projects"}
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
            subtitle={isEmployee ? "Your assigned projects" : "Ongoing work & status"}
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
            <EmptyState title={isEmployee ? "No assigned projects" : "No active projects"} hint={isEmployee ? "Projects you are assigned to as a team member show up here." : "Projects in Planning or Active status show up here."} />
          ) : (
            <ul className="divide-y divide-border-subtle -mx-1 px-1">
              {projects.map((p, i) => {
                const pct = projectProgress(p);
                return (
                  <li key={p._id || i} className="py-3 flex flex-col gap-2 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border-accent bg-amber-50 text-brand-text dark:bg-amber-900/30">
                          <RectangleStackIcon className="h-4 w-4" />
                        </span>
                        <span className="truncate text-sm font-semibold text-heading">{p.title}</span>
                      </div>
                      <TableStatus value={p.status || "Planning"} />
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
        <section className="glass-card flex flex-col min-w-0 bg-surface">
          <div className="flex-1">
            <PanelHead
              title="Task Priorities"
              subtitle={`${taskPriorities.high || 0} urgent · ${priorityTotal} open`}
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

            <div className="mt-1 flex flex-col gap-4">
              {/* Workload summary + distribution */}
              <div className="rounded-xl border border-border-subtle bg-app px-3.5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">
                      Open workload
                    </p>
                    <p className="mt-1.5 text-2xl font-black leading-none text-heading tabular-nums">
                      {priorityTotal}
                      <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                        tasks
                      </span>
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-danger">
                      {taskPriorities.high || 0} urgent
                    </p>
                    <p className="mt-1 text-[10px] font-medium text-muted">
                      {priorityPct(taskPriorities.high)}% of workload
                    </p>
                  </div>
                </div>

                <div
                  className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-border-subtle"
                  role="img"
                  aria-label="Task priority distribution"
                >
                  {priorityBreakdown.map((row) => (
                    <div
                      key={row.key}
                      className={`h-full ${row.bar} transition-all duration-500`}
                      style={{
                        width: row.count ? `${Math.max(priorityPct(row.count), 2)}%` : "0%",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Priority legend */}
              <div className="flex flex-col gap-2">
                {priorityBreakdown.map((row) => (
                  <div
                    key={row.key}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-app px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${row.dot}`} />
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-bold leading-tight text-heading">
                          {row.label}
                        </p>
                        <p className="truncate text-[10px] font-medium text-muted">{row.hint}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-black leading-tight text-heading tabular-nums">
                        {row.count}
                      </p>
                      <p className={`text-[10px] font-bold tabular-nums ${row.tone}`}>
                        {priorityPct(row.count)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom health indicator */}
          <div className="mt-3 border-t border-border-subtle pt-3">
            {taskPriorities.overdue > 0 ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-danger-border bg-danger-bg px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <ExclamationTriangleIcon className="h-4 w-4 shrink-0 text-danger" />
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-black uppercase tracking-wider text-danger">
                      {taskPriorities.overdue} {taskPriorities.overdue === 1 ? "task is" : "tasks are"} past due
                    </p>
                    <p className="truncate text-[10px] font-medium text-muted">
                      Prioritize and reschedule
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/project/myTasks")}
                  className="shrink-0 text-[10px] font-black uppercase tracking-wider text-danger hover:underline"
                >
                  Review
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-success-border bg-success-bg px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <CheckCircleIcon className="h-4 w-4 shrink-0 text-success" />
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-black uppercase tracking-wider text-success">
                      All deadlines on schedule
                    </p>
                    <p className="truncate text-[10px] font-medium text-muted">
                      Workload is healthy
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-[9px] font-black uppercase tracking-widest text-success">
                  Healthy
                </span>
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
                <li key={t._id || i} className="flex items-start justify-between gap-2 py-2.5 min-w-0">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-border-accent bg-amber-50 text-brand-text dark:bg-amber-900/30">
                      <ClipboardDocumentListIcon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-heading">{t.title}</p>
                      <p className="mt-0.5 truncate text-[10px] uppercase tracking-wider text-muted">
                        {t.project?.title || "No project"}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 pt-0.5">
                    <TableStatus value={t.status || "Backlog"} />
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
                  <TableAvatar name={personName(m)} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-heading truncate">{personName(m)}</p>
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
