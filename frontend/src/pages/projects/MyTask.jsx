import { useEffect, useMemo, useState } from "react";
import { createElement } from "react";
import { useDispatch, useSelector } from "react-redux";
import { PlusIcon, ArrowsUpDownIcon, EyeIcon, CheckCircleIcon, ExclamationCircleIcon, ClockIcon } from "@heroicons/react/24/outline";
import AddTaskDrawer from "../../components/addTaskModal";
import TaskDetailDrawer from "../../components/projectPortal/TaskDetailDrawer";
import { fetchMyTasks, createTask, updateTask } from "../../store/taskSlice";
import { toast } from "react-toastify";
import PortalHeader from "../../components/projectPortal/PortalHeader";
import ToolbarSearch from "../../components/projectPortal/ToolbarSearch";
import FilterChips from "../../components/projectPortal/FilterChips";
import PortalTable from "../../components/projectPortal/PortalTable";
import ModernSelect from "../../components/ui/ModernSelect";
import Pill, { TASK_STATUS_TONE, PRIORITY_TONE } from "../../components/projectPortal/Pill";
import Progress from "../../components/projectPortal/Progress";
import { formatDate, isOverdue, taskProgress } from "../../components/projectPortal/helpers";

/**
 * My Tasks — "Command Center" list page (PROJECT_PORTAL_DESIGN.md §9.3).
 * Functional status select (PUT /tasks/:id), row click → TaskDetailModal.
 */
const STATUSES = ["All", "Todo", "In Progress", "In Review", "Blocked", "Done"];
const TASK_STATUS_OPTIONS = ["Todo", "In Progress", "In Review", "Done", "Blocked"];
const SORTS = [
  { key: "dueDate", label: "Due date" },
  { key: "priority", label: "Priority" },
  { key: "title", label: "Title" },
];

const apiError = (err, fallback) => err?.response?.data?.message || err?.message || fallback;

const MyTask = () => {
  const dispatch = useDispatch();
  const { tasks, loading, error } = useSelector((state) => state.tasks);
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
      await dispatch(updateTask({ id, updates })).unwrap();
      toast.success("Task updated successfully");
    } catch (err) {
      toast.error(apiError(err, "Failed to update task"));
    }
  };

  const cycleSort = () => {
    const idx = SORTS.findIndex((s) => s.key === sort.key);
    const next = SORTS[(idx + 1) % SORTS.length];
    setSort({ key: next.key, direction: "asc" });
  };

  const columns = [
    {
      key: "title",
      label: "Task",
      render: (v, row) => (
        <div className="min-w-0 max-w-[240px]">
          <p className="text-sm font-semibold text-heading truncate">{v}</p>
          <p className="md:hidden text-[11px] text-muted truncate">{row.project?.title || "No project"}</p>
        </div>
      ),
    },
    {
      key: "project",
      label: "Project",
      hideBelow: "md",
      render: (v) => <span className="text-sm text-main whitespace-nowrap">{v?.title || "—"}</span>,
    },
    {
      key: "priority",
      label: "Priority",
      hideBelow: "lg",
      render: (v) => <Pill tone={PRIORITY_TONE[v] || "neutral"}>{v || "Medium"}</Pill>,
    },
    {
      key: "dueDate",
      label: "Due",
      render: (v, row) => {
        const overdue = isOverdue(v, row.status);
        return (
          <span className={`text-xs whitespace-nowrap font-bold ${overdue ? "text-danger" : "text-muted"}`}>
            {formatDate(v)}
            {overdue && <span className="block text-[9px] uppercase tracking-widest">Overdue</span>}
          </span>
        );
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
      render: (_v, row) => {
        const pct = taskProgress(row);
        return (
          <div className="flex items-center gap-2 min-w-[110px]">
            <Progress value={pct} />
            <span className="text-[10px] font-bold text-muted tabular-nums shrink-0">{pct}%</span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PortalHeader
        eyebrow="Personal workspace"
        title="My Tasks"
        subtitle="Prioritize your assigned work and keep delivery moving."
        actions={
          <>
            <ToolbarSearch
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks..."
            />
            <button
              type="button"
              onClick={cycleSort}
              className="btn btn-secondary py-2.5 px-4 whitespace-nowrap"
              title="Change sort"
            >
              <ArrowsUpDownIcon className="w-4 h-4 mr-2" />
              {SORTS.find((s) => s.key === sort.key)?.label || "Sort by"}
            </button>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="btn btn-primary py-2.5 px-4 whitespace-nowrap"
            >
              <PlusIcon className="w-4 h-4 mr-2" /> New Task
            </button>
          </>
        }
      >
        <FilterChips
          value={status}
          onChange={setStatus}
          options={STATUSES.map((s) => ({ value: s, label: s, count: countFor(s) }))}
        />
      </PortalHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Assigned", value: tasks.length, Icon: ClockIcon, tone: "text-brand-text" },
          { label: "In progress", value: activeCount, Icon: ClockIcon, tone: "text-info" },
          { label: "Completed", value: completedCount, Icon: CheckCircleIcon, tone: "text-success" },
          { label: "Overdue", value: overdueCount, Icon: ExclamationCircleIcon, tone: "text-danger" },
        ].map(({ label, value, Icon, tone }) => (
          <div key={label} className="glass-card !p-4 sm:!p-5 flex items-center gap-3 bg-surface">
            <div className={`w-10 h-10 rounded-xl bg-card border border-border-subtle flex items-center justify-center ${tone}`}>
              {createElement(Icon, { className: "w-5 h-5" })}
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-black text-heading tabular-nums leading-none">{value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted mt-1 truncate">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <PortalTable
        columns={columns}
        data={rows}
        sort={sort}
        onSortChange={setSort}
        loading={loading}
        error={error}
        onRowClick={(task) => setDetailTask(task)}
        actions={[{ title: "View task", icon: EyeIcon, onClick: (task) => setDetailTask(task) }]}
        rowsPerPage={10}
        emptyTitle={tasks.length === 0 ? "No tasks assigned" : "No matching tasks"}
        emptyHint={
          tasks.length === 0
            ? "New tasks assigned to you will appear here."
            : "Try a different search or status filter."
        }
      />

      <AddTaskDrawer isOpen={showModal} onClose={() => setShowModal(false)} onSubmit={handleCreateTask} />
      <TaskDetailDrawer
        task={detailTask}
        onClose={() => setDetailTask(null)}
        onStatusChange={(status) => handleUpdateTask(detailTask?._id, { status })}
      />
    </div>
  );
};

export default MyTask;
