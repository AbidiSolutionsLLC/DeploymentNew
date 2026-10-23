import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { EyeIcon } from "@heroicons/react/24/outline";
import TaskDetailDrawer from "../../components/projectPortal/TaskDetailDrawer";
import { fetchMyTasks, updateTask, addTaskComment, fetchTaskComments, deleteTaskComment } from "../../store/taskSlice";
import { toast } from "react-toastify";
import PageContainer from "../../components/ui/PageContainer";
import PortalHero from "../../components/ui/PortalHero";
import FilterPanel from "../../components/ui/FilterPanel";
import FilterRow from "../../components/ui/FilterRow";
import GlassInput from "../../components/ui/GlassInput";
import GlassButton from "../../components/ui/GlassButton";
import ModernSelect from "../../components/ui/ModernSelect";
import TaskStatusFilter, { TASK_STATUS_FILTER_OPTIONS } from "../../components/projectPortal/TaskStatusFilter";
import PortalTable from "../../components/projectPortal/PortalTable";
import {
  TableDate,
  TablePriority,
  TableProgress,
  TableText,
  TableTitle,
} from "../../components/ui/TableCells";
import { isOverdue, taskProgress } from "../../components/projectPortal/helpers";

/**
 * My Tasks — "Command Center" list page (PROJECT_PORTAL_DESIGN.md §9.3).
 * Follows the Project Portal standard with compact PortalHero, horizontal FilterPanel
 * with GlassInput, ModernSelect dropdown filters, and PortalTable.
 */
const STATUS_OPTIONS = TASK_STATUS_FILTER_OPTIONS;

const PRIORITY_OPTIONS = [
  { value: "All", label: "Priority" },
  { value: "High", label: "High" },
  { value: "Medium", label: "Medium" },
  { value: "Low", label: "Low" },
];

const TASK_STATUS_OPTIONS = ["Backlog", "Todo", "In Progress", "In Review", "Done"];

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
  const [priority, setPriority] = useState("All");
  const [sort, setSort] = useState({ key: "dueDate", direction: "asc" });
  const [detailTask, setDetailTask] = useState(null);

  useEffect(() => {
    dispatch(fetchMyTasks());
  }, [dispatch]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => {
      const s = String(t.status || "").toLowerCase().replace(/[\s_-]+/g, "");
      const matchStatus =
        status === "All" ||
        t.status === status ||
        s === String(status || "").toLowerCase().replace(/[\s_-]+/g, "");
      const matchPriority = priority === "All" || (t.priority || "Medium").toLowerCase() === priority.toLowerCase();
      const matchQuery =
        !q ||
        (t.title || "").toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q) ||
        (t.project?.title || "").toLowerCase().includes(q);
      return matchStatus && matchPriority && matchQuery;
    });
  }, [tasks, query, status, priority]);

  const taskCounts = useMemo(() => {
    const counts = {
      All: tasks.length,
      Backlog: 0,
      Todo: 0,
      "In Progress": 0,
      "In Review": 0,
      Done: 0,
    };
    tasks.forEach((t) => {
      const s = String(t.status || "").toLowerCase().replace(/[\s_-]+/g, "");
      if (s === "backlog") counts.Backlog += 1;
      else if (s === "todo") counts.Todo += 1;
      else if (s === "inprogress") counts["In Progress"] += 1;
      else if (s === "inreview") counts["In Review"] += 1;
      else if (s === "done") counts.Done += 1;
      else if (counts[t.status] !== undefined) counts[t.status] += 1;
    });
    return counts;
  }, [tasks]);

  const hasFilters = status !== "All" || priority !== "All" || query.trim() !== "";
  const resetFilters = () => {
    setStatus("All");
    setPriority("All");
    setQuery("");
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

  const handleUpdateTask = async (id, updates) => {
    try {
      const updated = await dispatch(updateTask({ id, updates })).unwrap();
      toast.success("Task updated successfully");
      setDetailTask((prev) => (prev?._id === id ? { ...prev, ...updated } : prev));
    } catch (err) {
      toast.error(apiError(err, "Failed to update task"));
    }
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
            variant="badge"
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
      icon: EyeIcon,
      title: "View task",
      onClick: (task) => setDetailTask(task),
    },
  ];

  return (
    <PageContainer isCard={false}>
      <div className="flex flex-col gap-4 w-full">
        {/* ==================== HERO ==================== */}
        <PortalHero
          label="My tasks overview"
          title="My Tasks"
          compact
        />

        {/* ==================== FILTERS ==================== */}
        <FilterPanel>
          <FilterRow className="items-center">
            <GlassInput
              placeholder="Search tasks..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 min-w-[220px]"
            />
            <TaskStatusFilter
              value={status}
              onChange={(next) => setStatus(next)}
              counts={taskCounts}
            />
            <div className="min-w-[140px]">
              <ModernSelect
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                options={PRIORITY_OPTIONS}
                placeholder="Priority"
              />
            </div>
            {hasFilters && (
              <GlassButton variant="ghost" size="sm" onClick={resetFilters}>
                RESET
              </GlassButton>
            )}
          </FilterRow>
        </FilterPanel>

        {/* ==================== TABLE ==================== */}
        <PortalTable
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
          emptyTitle={tasks.length === 0 ? "No tasks assigned" : "No matching tasks"}
          emptyHint={
            tasks.length === 0
              ? "New tasks assigned to you will appear here."
              : "Try a different search or filter."
          }
        />

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
