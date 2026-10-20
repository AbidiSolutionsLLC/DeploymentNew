import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { PlusIcon, ArrowsUpDownIcon, EyeIcon } from "@heroicons/react/24/outline";
import { FaClipboardList, FaSpinner, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import AddTaskDrawer from "../../components/addTaskModal";
import TaskDetailDrawer from "../../components/projectPortal/TaskDetailDrawer";
import { fetchMyTasks, createTask, updateTask } from "../../store/taskSlice";
import { toast } from "react-toastify";
import PageContainer from "../../components/ui/PageContainer";
import StatCard from "../../components/ui/StatCard";
import PortalHero from "../../components/ui/PortalHero";
import FilterPanel from "../../components/ui/FilterPanel";
import FilterRow from "../../components/ui/FilterRow";
import GlassInput from "../../components/ui/GlassInput";
import GlassButton from "../../components/ui/GlassButton";
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

  const hasFilters = status !== "All" || query.trim() !== "";
  const resetFilters = () => {
    setStatus("All");
    setQuery("");
  };

  const columns = [
    {
      key: "title",
      label: "Task",
      render: (v) => <TableTitle title={v} maxWidth="max-w-[240px]" />,
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
        <div className="lm-stagger grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="Assigned"
            value={tasks.length}
            sub="All your tasks"
            icon={FaClipboardList}
            tone="text-amber-600 dark:text-amber-400"
          />
          <StatCard
            title="In progress"
            value={activeCount}
            sub="Active work"
            icon={FaSpinner}
            tone="text-sky-600 dark:text-sky-400"
          />
          <StatCard
            title="Completed"
            value={completedCount}
            sub="Done"
            icon={FaCheckCircle}
            tone="text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            title="Overdue"
            value={overdueCount}
            sub="Past due"
            icon={FaExclamationTriangle}
            tone="text-rose-600 dark:text-rose-400"
          />
        </div>

        {/* ==================== FILTERS ==================== */}
        <FilterPanel
          title="Assigned Tasks"
          subtitle={`${rows.length} of ${tasks.length} tasks · updated just now`}
          hint="Click any row to open the task detail — change status inline, or create a new task."
          actions={
            <>
              {hasFilters && (
                <GlassButton variant="ghost" size="sm" onClick={resetFilters}>
                  RESET
                </GlassButton>
              )}
              <GlassButton variant="secondary" size="sm" icon={ArrowsUpDownIcon} onClick={cycleSort}>
                {SORTS.find((s) => s.key === sort.key)?.label || "Sort by"}
              </GlassButton>
              <GlassButton variant="primary" size="sm" icon={PlusIcon} onClick={() => setShowModal(true)}>
                NEW TASK
              </GlassButton>
            </>
          }
        >
          <FilterRow>
            <GlassInput
              placeholder="Search tasks..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 min-w-[220px]"
            />
            <div className="min-w-[180px]">
              <ModernSelect
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={statusOptions}
                aria-label="Filter tasks by status"
              />
            </div>
          </FilterRow>
        </FilterPanel>

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
          onClose={() => setDetailTask(null)}
          onStatusChange={(status) => handleUpdateTask(detailTask?._id, { status })}
        />
      </div>
    </PageContainer>
  );
};

export default MyTask;
