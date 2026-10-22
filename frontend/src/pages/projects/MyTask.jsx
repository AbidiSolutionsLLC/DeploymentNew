import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { PlusIcon, ArrowsUpDownIcon, EyeIcon } from "@heroicons/react/24/outline";
import { FaClipboardList, FaSpinner, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import AddTaskDrawer from "../../components/addTaskModal";
import TaskDetailDrawer from "../../components/projectPortal/TaskDetailDrawer";
import { fetchMyTasks, createTask, updateTask, addTaskComment, fetchTaskComments, deleteTaskComment } from "../../store/taskSlice";
import { toast } from "react-toastify";
import PageContainer from "../../components/ui/PageContainer";
import PortalHero from "../../components/ui/PortalHero";
import PortalToolbar, { ToolbarSelect } from "../../components/projectPortal/PortalToolbar";
import GlobalTable from "../../components/ui/GlobalTable";
import {
  TableDate,
  TablePriority,
  TableProgress,
  TableText,
  TableTitle,
} from "../../components/ui/TableCells";
import ModernSelect from "../../components/ui/ModernSelect";
import { isOverdue, taskProgress } from "../../components/projectPortal/helpers";

/**
 * My Tasks — "Command Center" list page (PROJECT_PORTAL_DESIGN.md §9.3).
 * Uses the same KPI + FilterPanel + GlobalTable kit as Leave Management so the
 * table chrome stays identical across the app. Functional status select
 * (PUT /tasks/:id), row click → TaskDetailDrawer.
 */
const STATUSES = ["All", "Backlog", "Todo", "In Progress", "In Review", "Done"];
const TASK_STATUS_OPTIONS = ["Backlog", "Todo", "In Progress", "In Review", "Done"];
const SORTS = [
  { key: "dueDate", label: "Due date" },
  { key: "priority", label: "Priority" },
  { key: "title", label: "Title" },
  { key: "project", label: "Project" },
  { key: "completionPercent", label: "Progress" },
];

const KPIS = [
  { label: "Assigned", key: "assigned", Icon: FaClipboardList, sub: "All your tasks", tone: "amber" },
  { label: "In progress", key: "inProgress", Icon: FaSpinner, sub: "Active work", tone: "sky" },
  { label: "Completed", key: "completed", Icon: FaCheckCircle, sub: "Done", tone: "emerald" },
  { label: "Overdue", key: "overdue", Icon: FaExclamationTriangle, sub: "Past due", tone: "rose" },
];

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
    wash: "dark:hover:bg-[rgba(251,113,133,0.05)]",
    tile: "border-border-subtle bg-app text-muted group-hover:border-border-accent group-hover:text-brand-text dark:border-[rgba(251,113,133,0.4)] dark:bg-[rgba(251,113,133,0.16)] dark:text-[#FDA4AF] dark:shadow-[0_0_24px_-8px_rgba(251,113,133,0.75)]",
    rail: "via-[rgba(251,113,133,0.75)]",
    glow: "dark:bg-[radial-gradient(circle_at_18%_0%,rgba(251,113,133,0.14),transparent_62%)]",
    value: "dark:[text-shadow:0_0_24px_rgba(251,113,133,0.35)]",
  },
};

const apiError = (err, fallback) => err?.response?.data?.message || err?.message || fallback;

const MyTask = () => {
  const dispatch = useDispatch();
  const { tasks, taskComments = {}, loading, error } = useSelector((state) => state.tasks);
  const authStateUser = useSelector((state) => state.auth.user);
  const user = authStateUser?.data?.user || authStateUser?.user || authStateUser || null;
  const userRole = (user?.role || '').replace(/\s+/g, '').toLowerCase();
  const isSuperAdmin = userRole === 'superadmin';
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const canCreateTask = isSuperAdmin || isAdmin || isManager;
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState({ key: "dueDate", direction: "asc" });
  const [showModal, setShowModal] = useState(false);
  const [detailTask, setDetailTask] = useState(null);

  useEffect(() => {
    dispatch(fetchMyTasks());
  }, [dispatch]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter(
      (t) =>
        (status === "All" || t.status === status) &&
        (!q || (t.title || "").toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q))
    );
  }, [tasks, query, status]);

  const countFor = (s) => (s === "All" ? tasks.length : tasks.filter((t) => t.status === s).length);
  const completedCount = tasks.filter((task) => task.status === "Done").length;
  const activeCount = tasks.filter((task) => ["In Progress", "In Review"].includes(task.status)).length;
  const overdueCount = tasks.filter((task) => isOverdue(task.dueDate, task.status)).length;

  const kpiData = {
    assigned: tasks.length,
    inProgress: activeCount,
    completed: completedCount,
    overdue: overdueCount,
  };

  useEffect(() => {
    if (detailTask?._id) {
      dispatch(fetchTaskComments(detailTask._id));
    }
  }, [detailTask?._id, dispatch]);

  const handleAddComment = async (taskId, commentData) => {
    try {
      const payload = typeof commentData === 'string'
        ? { taskId, content: commentData }
        : { taskId, ...commentData };
      await dispatch(addTaskComment(payload)).unwrap();
      toast.success("Comment added");
    } catch (err) {
      toast.error(apiError(err, "Failed to add comment"));
      throw err;
    }
  };

  const handleDeleteComment = async (taskId, commentId) => {
    try {
      await dispatch(deleteTaskComment({ taskId, commentId })).unwrap();
    } catch (err) {
      toast.error(apiError(err, "Failed to delete comment"));
      throw err;
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      await dispatch(createTask(taskData)).unwrap();
      toast.success("Task created successfully");
      setShowModal(false);
      // Refetch so the new row carries populated project data
      dispatch(fetchMyTasks());
    } catch (err) {
      toast.error(apiError(err, "Failed to create task"));
    }
  };

  const handleUpdateTask = async (id, updates) => {
    try {
      const updated = await dispatch(updateTask({ id, updates })).unwrap();
      toast.success("Task updated successfully");
      setDetailTask((prev) => (prev?._id === id ? { ...prev, ...updated } : prev));
    } catch (err) {
      toast.error(apiError(err, "Failed to update task"));
    }
  };

  const hasFilters = status !== "All" || query.trim() !== "";
  const resetFilters = () => {
    setStatus("All");
    setQuery("");
  };

  const columns = [
    {
      key: "_index",
      label: "#",
      type: "index",
      sortable: false,
      width: 56,
      hideBelow: "sm",
    },
    {
      key: "title",
      label: "Task",
      render: (v) => (
        <TableTitle title={v} maxWidth="max-w-[260px]" titleClassName="font-medium" />
      ),
    },
    {
      key: "project",
      label: "Project",
      hideBelow: "md",
      render: (v) => <TableText value={v?.title} />,
    },
    {
      key: "priority",
      label: "Priority",
      hideBelow: "lg",
      render: (v) => <TablePriority value={v || "Medium"} />,
    },
    {
      key: "dueDate",
      label: "Due",
      render: (v, row) => {
        const overdue = isOverdue(v, row.status);
        return <TableDate value={v} tone={overdue ? "danger" : "default"} subtitle={overdue ? "Overdue" : undefined} />;
      },
    },
    {
      key: "status",
      label: "Status",
      sortable: false,
      render: (v, row) => (
        <div onClick={(e) => e.stopPropagation()} className="w-fit">
          <ModernSelect
            value={v || "Todo"}
            onChange={(e) => handleUpdateTask(row._id, { status: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Status for ${row.title}`}
            options={TASK_STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
            className="w-[130px]"
          />
        </div>
      ),
    },
    {
      key: "completionPercent",
      label: "Progress",
      hideBelow: "lg",
      render: (_v, row) => <TableProgress value={taskProgress(row)} />,
    },
  ];

  const actions = [
    {
      icon: <EyeIcon className="w-4 h-4" />,
      title: "View task",
      onClick: (task) => setDetailTask(task),
    },
  ];

  const statusOptions = STATUSES.map((s) => ({
    value: s,
    label: `${s} (${countFor(s)})`,
  }));

  return (
    <PageContainer isCard={false}>
      <div className="flex flex-col gap-4 w-full">
        {/* ==================== HERO ==================== */}
        <PortalHero
          label="My tasks overview"
          title="My Tasks"
          description="Prioritize your assigned work and keep delivery moving."
        />

        {/* ==================== KPI CARDS ==================== */}
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
                        {kpiData[kpi.key] ?? 0}
                      </p>
                      <p className="mt-1 truncate text-[10px] font-medium text-muted dark:text-slate-400">{kpi.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================== FILTERS ==================== */}
        <PortalToolbar
          searchValue={query}
          onSearchChange={(e) => setQuery(e.target.value)}
          searchPlaceholder="Search tasks..."
          showing={rows.length}
          total={tasks.length}
          countLabel="tasks"
          filtersActive={hasFilters}
          onReset={resetFilters}
          filters={
            <>
              <ToolbarSelect
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={statusOptions}
                ariaLabel="Filter tasks by status"
              />
              <ToolbarSelect
                label="Sort by"
                value={sort.key}
                onChange={(e) => setSort({ key: e.target.value, direction: "asc" })}
                options={SORTS.map((s) => ({ value: s.key, label: s.label }))}
                ariaLabel="Sort tasks"
              />
              <button
                type="button"
                onClick={() =>
                  setSort((current) => ({
                    ...current,
                    direction: current.direction === "asc" ? "desc" : "asc",
                  }))
                }
                className="lm-filter-reset"
                title="Toggle sort direction"
              >
                <ArrowsUpDownIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {sort.direction === "asc" ? "Ascending" : "Descending"}
              </button>
            </>
          }
          actions={
            canCreateTask ? (
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="btn btn-primary py-2.5 px-4 whitespace-nowrap"
              >
                <PlusIcon className="w-4 h-4 mr-2" /> New Task
              </button>
            ) : null
          }
        />

        {/* ==================== TABLE ==================== */}
        <GlobalTable
          columns={columns}
          data={rows}
          loading={loading}
          error={error ? error.message || "Failed to load tasks" : null}
          onRowClick={(task) => setDetailTask(task)}
          actions={actions}
          sort={sort}
          onSortChange={setSort}
          rowsPerPage={10}
          countLabel="tasks"
          defaultSort={{ key: "dueDate", direction: "asc" }}
          emptyMessage={tasks.length === 0 ? "No tasks assigned" : "No matching tasks"}
          emptyHint={
            tasks.length === 0
              ? "New tasks assigned to you will appear here."
              : "Try a different search or status filter."
          }
          onEmptyAction={hasFilters ? resetFilters : undefined}
          emptyActionLabel="Clear all filters"
        />

        <AddTaskDrawer isOpen={showModal} onClose={() => setShowModal(false)} onSubmit={handleCreateTask} />
        <TaskDetailDrawer
          task={detailTask}
          canManageTasks={canCreateTask}
          currentUserId={user?._id || user?.id}
          onClose={() => setDetailTask(null)}
          onStatusChange={(status) => handleUpdateTask(detailTask?._id, { status })}
          onAddComment={(commentData) => handleAddComment(detailTask?._id, commentData)}
          onAddcomment={(commentData) => handleAddComment(detailTask?._id, commentData)}
          onDeleteComment={(commentId) => handleDeleteComment(detailTask?._id, commentId)}
          comments={taskComments[detailTask?._id] || []}
          projectTasks={tasks}
          onTaskUpdate={(updates) => handleUpdateTask(detailTask?._id, updates)}
        />
      </div>
    </PageContainer>
  );
};

export default MyTask;
