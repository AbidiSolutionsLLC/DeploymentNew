import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  CalendarDaysIcon,
  PlusIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import {
  FaBolt,
  FaCheckCircle,
  FaClock,
  FaFolderOpen,
  FaProjectDiagram,
  FaTasks,
} from "react-icons/fa";
import { fetchProjectDashboard } from "../../store/projectSlice";
import projectApi from "../../api/projectApi";
import Loader from "../../components/ui/Loader";
import PageContainer from "../../components/ui/PageContainer";
import PortalHero from "../../components/ui/PortalHero";
import AddCardMenu from "../../components/home/AddCardMenu";
import DashboardCard from "../../components/projectPortal/DashboardCard";
import { PROJECT_DASHBOARD_CARD_OPTIONS } from "../../components/projectPortal/dashboardCardOptions";
import NewProjectDrawer from "../../components/NewProjectDrawer";
import GlassButton from "../../components/ui/GlassButton";

/**
 * Project Dashboard — 4 Clickable KPI Cards + Consolidated Action Deck:
 * 1. KPI cards row: 4 cards in single row (Total, Active, Completed, Delayed), fully interactive & redirecting.
 * 2. Consolidated Action Card: Single card combining both "+ Project" and "+ Add Card" triggers.
 */
const KPIS = [
  {
    label: "Total Projects",
    key: "totalProjects",
    Icon: FaFolderOpen,
    sub: "All portfolio projects",
    tone: "amber",
    path: "/project/projects",
    filterStatus: "All",
  },
  {
    label: "Active Projects",
    key: "activeProjects",
    Icon: FaProjectDiagram,
    sub: "Currently in flight",
    tone: "sky",
    path: "/project/projects?status=Active",
    filterStatus: "Active",
  },
  {
    label: "Completed Projects",
    key: "completedProjects",
    Icon: FaCheckCircle,
    sub: "Delivered to date",
    tone: "emerald",
    path: "/project/projects?status=Completed",
    filterStatus: "Completed",
  },
  {
    label: "Delayed Projects",
    key: "delayedProjects",
    Icon: FaClock,
    sub: "Past target date",
    tone: "rose",
    path: "/project/projects?status=Delayed",
    filterStatus: "Delayed",
  },
];

/*
 * Explicit colour pairs per KPI tone.
 * NOTE: these use raw rgba/hex values instead of Tailwind's `amber-*` scale —
 * that scale is remapped to color-mix() tokens in tailwind.config.js, which
 * makes `/opacity` dark utilities silently drop out of the build.
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
  rose: {
    wash: "dark:hover:bg-[rgba(244,63,94,0.05)]",
    tile: "border-border-subtle bg-app text-muted group-hover:border-border-accent group-hover:text-brand-text dark:border-[rgba(244,63,94,0.4)] dark:bg-[rgba(244,63,94,0.16)] dark:text-[#FDA4AF] dark:shadow-[0_0_24px_-8px_rgba(244,63,94,0.75)]",
    rail: "via-[rgba(244,63,94,0.75)]",
    glow: "dark:bg-[radial-gradient(circle_at_18%_0%,rgba(244,63,94,0.14),transparent_62%)]",
    value: "dark:[text-shadow:0_0_24px_rgba(244,63,94,0.35)]",
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
  const [cards, setCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(true);

  // Split-action and new project drawer states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const projectMenuRef = useRef();

  useEffect(() => {
    dispatch(fetchProjectDashboard());
  }, [dispatch]);

  useEffect(() => {
    let active = true;

    const loadCards = async () => {
      try {
        const nextCards = await projectApi.getProjectDashboardCards();
        if (active) setCards(Array.isArray(nextCards) ? nextCards : []);
      } catch {
        if (active) toast.error("Failed to load dashboard cards");
      } finally {
        if (active) setCardsLoading(false);
      }
    };

    loadCards();
    return () => {
      active = false;
    };
  }, []);

  // Close split project menu when clicking outside
  useEffect(() => {
    const handleOutside = (e) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(e.target)) {
        setProjectMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const addCard = async (type) => {
    if (cards.some((card) => card.type === type)) {
      toast.info("Card is already added");
      return;
    }

    try {
      const nextCards = await projectApi.addProjectDashboardCard(type);
      setCards(Array.isArray(nextCards) ? nextCards : []);
    } catch {
      toast.error("Failed to add card");
    }
  };

  const removeCard = async (cardId) => {
    try {
      const nextCards = await projectApi.removeProjectDashboardCard(cardId);
      setCards(Array.isArray(nextCards) ? nextCards : []);
    } catch {
      toast.error("Failed to remove card");
    }
  };

  const openNewProjectDrawer = () => {
    setDrawerOpen(true);
  };

  const closeNewProjectDrawer = () => {
    setDrawerOpen(false);
  };

  const handleCreateProject = async (payload) => {
    try {
      await projectApi.createProject(payload);
      toast.success("Project created successfully");
      closeNewProjectDrawer();
      dispatch(fetchProjectDashboard());
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to create project");
    }
  };

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

  return (
    <PageContainer isCard={false}>
      <div className="flex flex-col gap-4 w-full">
      {/* Command header */}
      <PortalHero
        label={isEmployee ? "My workspace overview" : "Project command center overview"}
        title={isEmployee ? "Project Dashboard" : "Project Command Center"}
        description={isEmployee ? "Live status of your assigned tasks, projects, and upcoming deadlines." : "Live status of your projects, tasks and team."}
      />

        {/* 1. KPI command deck — 4 Clickable / Redirecting Cards in a single row */}
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
                const tone = KPI_TONES[kpi.tone] || KPI_TONES.amber;
                const borders = [
                  index > 0 ? "border-t border-border-subtle dark:border-white/10" : "",
                  index % 2 === 1 ? "sm:border-l sm:border-border-subtle sm:dark:border-white/10" : "sm:border-l-0",
                  index >= 2 ? "sm:border-t sm:border-border-subtle sm:dark:border-white/10" : "sm:border-t-0",
                  index > 0 ? "lg:border-l lg:border-border-subtle lg:dark:border-white/10" : "lg:border-l-0",
                  "lg:border-t-0",
                ]
                  .filter(Boolean)
                  .join(" ");

                const rawVal = d[kpi.key];
                const value =
                  kpi.key === "totalProjects"
                    ? (rawVal ?? ((d.activeProjects || 0) + (d.completedProjects || 0) + (d.delayedProjects || 0)))
                    : (rawVal ?? 0);

                return (
                  <div
                    key={kpi.key}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(kpi.path, { state: { status: kpi.filterStatus } })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(kpi.path, { state: { status: kpi.filterStatus } });
                      }
                    }}
                    title={`View ${kpi.label} on Projects page`}
                    className={`group relative flex items-center gap-3.5 sm:gap-4 overflow-hidden px-5 py-5 text-left cursor-pointer select-none transition-all duration-300 ease-out hover:bg-amber-500/[0.04] dark:hover:bg-white/[0.04] hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${tone.wash} ${borders}`}
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
                      className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl border shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-0.5 ${tone.tile}`}
                    >
                      <Icon size={18} />
                    </span>

                    <div className="relative min-w-0 flex-1">
                      <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-muted transition-colors duration-200 group-hover:text-brand-text dark:text-slate-300">
                        {kpi.label}
                      </p>
                      <p className={`mt-1.5 text-2xl font-black leading-none text-heading tabular-nums dark:text-white ${tone.value}`}>
                        {value}
                      </p>
                      <p className="mt-1 truncate text-[10px] font-medium text-muted dark:text-slate-400">
                        {kpi.sub}
                      </p>
                    </div>

                    <div className="relative shrink-0 text-muted/30 transition-all duration-300 group-hover:text-brand-text group-hover:translate-x-1">
                      <ChevronRightIcon className="w-4 h-4" />
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
              <p className="text-xs font-medium text-muted mt-0.5 truncate">
                {cards.length} card{cards.length === 1 ? "" : "s"} · customise your project view
              </p>
            </div>
          </div>

          {/* Right Action Triggers: "+ Project" (with split-action option) and "+ Add Card" */}
          <div className="flex items-center gap-2.5 flex-shrink-0 self-end sm:self-center">
            {/* Action Trigger 1: + Project with Split-Action option */}
            <div className="relative inline-flex" ref={projectMenuRef}>
              <div className="inline-flex rounded-2xl shadow-sm overflow-hidden">
                <GlassButton
                  variant="primary"
                  size="sm"
                  icon={PlusIcon}
                  onClick={openNewProjectDrawer}
                  className="!rounded-r-none font-bold uppercase tracking-wider"
                >
                  Project
                </GlassButton>
                <button
                  type="button"
                  onClick={() => setProjectMenuOpen((prev) => !prev)}
                  className="inline-flex items-center px-2 py-2 text-xs font-bold bg-[linear-gradient(135deg,#F7E7B4_0%,#EDBB3E_38%,#D9A21F_62%,#F5D77A_100%)] text-black border-l border-amber-700/20 hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  title="Project options"
                  aria-label="Project options"
                >
                  <ChevronDownIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              {projectMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-2xl border bg-surface border-border-subtle py-1.5 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setProjectMenuOpen(false);
                      openNewProjectDrawer();
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-heading hover:bg-card-hover flex items-center gap-2.5 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4 text-brand" />
                    New Project
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProjectMenuOpen(false);
                      navigate("/project/projects");
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-heading hover:bg-card-hover flex items-center gap-2.5 transition-colors border-t border-border-subtle"
                  >
                    <FolderIcon className="w-4 h-4 text-muted" />
                    View All Projects
                  </button>
                </div>
              )}
            </div>

            {/* Action Trigger 2: + Add Card */}
            <AddCardMenu
              onAdd={addCard}
              currentCards={cards}
              options={PROJECT_DASHBOARD_CARD_OPTIONS}
              heading="Project cards"
              buttonLabel="Add Card"
              variant="secondary"
              size="sm"
            />
          </div>
        </div>

        {/* Dashboard cards deck — dynamic customizable cards */}
        <div className="flex flex-col gap-4 w-full">
          {cardsLoading ? (
            <div className="glass-card p-10 text-center">
              <Loader size="lg" text="Loading dashboard cards..." />
            </div>
          ) : cards.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand/10 text-brand-text flex items-center justify-center mx-auto mb-4">
                <FaBolt size={22} />
              </div>
              <p className="text-sm font-bold text-heading mb-1">
                Your dashboard is empty
              </p>
              <p className="text-xs text-muted mb-4">
                Add cards to personalise your project dashboard.
              </p>
              <AddCardMenu
                onAdd={addCard}
                currentCards={cards}
                options={PROJECT_DASHBOARD_CARD_OPTIONS}
                heading="Project cards"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {cards.map((card) => (
                <DashboardCard
                  key={card.id || card.type}
                  card={card}
                  data={d}
                  onDelete={removeCard}
                />
              ))}
            </div>
          )}
        </div>

        {/* Project creation drawer modal */}
        <NewProjectDrawer
          isOpen={drawerOpen}
          onClose={closeNewProjectDrawer}
          onSubmit={handleCreateProject}
        />
      </div>
    </PageContainer>
  );
};

export default ProjectDashBoard;
