import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { PlusIcon, ArrowsUpDownIcon, EyeIcon } from "@heroicons/react/24/outline";
import AddTaskDrawer from "../../components/addTaskModal";
import TaskDetailModal from "../../components/TaskDetailModal";
import { fetchMyTasks, createTask, updateTask } from "../../store/taskSlice";
import { toast } from "react-toastify";
import PortalHeader from "../../components/projectPortal/PortalHeader";
import ToolbarSearch from "../../components/projectPortal/ToolbarSearch";
import FilterChips from "../../components/projectPortal/FilterChips";
import PortalTable from "../../components/projectPortal/PortalTable";
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
        <select
          value={v || "Todo"}
          onChange={(e) => handleUpdateTask(row._id, { status: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Status for ${row.title}`}
          className="max-w-[130px] rounded-lg border border-border-subtle bg-surface px-2 py-1.5 text-xs font-bold text-heading outline-none focus:border-brand cursor-pointer"
        >
          {TASK_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
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
        title="My Tasks"
        subtitle={`${rows.length} of ${tasks.length} tasks in view`}
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
      <TaskDetailModal task={detailTask} onClose={() => setDetailTask(null)} />
    </div>
  );
};

export default MyTask;
