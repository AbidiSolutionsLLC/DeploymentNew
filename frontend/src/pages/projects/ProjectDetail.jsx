import React, { useState, useEffect, useMemo } from "react";
import PortalTabBar from "../../components/ui/PortalTabBar";
import ManageStatusesModal from "../../components/projectPortal/ManageStatusesModal";
import { ViewColumnsIcon, Squares2X2Icon, ListBulletIcon, Cog6ToothIcon, Bars3Icon } from "@heroicons/react/24/outline";
import ListView from "../../components/project/ListView";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import taskApi from "../../api/taskApi";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  CalendarDaysIcon,
  UsersIcon,
  FlagIcon,
  ClockIcon,
  PlusIcon,
  FolderIcon,
  BoltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { fetchProjectById, updateProject, deleteProject } from "../../store/projectSlice";
import {
  fetchProjectTasks,
  createTask,
  updateTaskStatus,
  updateTask,
  deleteTask,
  addTaskComment,
  fetchTaskComments,
  deleteTaskComment,
  fetchProjectActivities,
} from "../../store/taskSlice";
import { useConfirm } from "../../context/ConfirmContext";
import usePermission from "../../hooks/usePermission";
import Loader from "../../components/ui/Loader";
import PageContainer from "../../components/ui/PageContainer";
import GlassModal from "../../components/ui/GlassModal";
import Progress from "../../components/projectPortal/Progress";
import {
  formatDate,
  shortDate,
  isOverdue,
  projectProgress,
  personName,
} from "../../components/projectPortal/helpers";
import AddTaskForm from "../../components/projectPortal/AddTaskForm";
import EditProjectForm from "../../components/projectPortal/EditProjectForm";
import TaskDetailDrawer from "../../components/projectPortal/TaskDetailDrawer";
import TaskCommentsDrawer from "../../components/projectPortal/TaskCommentsDrawer";
import TaskCard from "../../components/projectPortal/TaskCard";
import { TableStatus } from "../../components/ui/TableCells";
import { getUnresolvedPrerequisites, isStatusDone } from "../../utils/taskHierarchy";

const BUILTIN_COLUMNS = [
  { id: "backlog", title: "Backlog", label: "Backlog", accent: "bg-neutral" },
  { id: "todo", title: "To Do", label: "Todo", accent: "bg-amber-500" },
  { id: "in-progress", title: "In Progress", label: "In Progress", accent: "bg-info" },
  { id: "in-review", title: "In Review", label: "In Review", accent: "bg-warning" },
  { id: "done", title: "Done", label: "Done", accent: "bg-success" },
];
const COLUMN_ACCENTS = {
  backlog: "bg-neutral",
  todo: "bg-amber-500",
  "in-progress": "bg-info",
  "in-review": "bg-warning",
  done: "bg-success",
};

/** Map backend status string to Kanban column ID, aware of dynamic columns */
function toColumnId(status, columns) {
  const cols = columns || BUILTIN_COLUMNS;
  if (!status) return (cols && cols[0]?.id) || "backlog";
  const s = String(status).toLowerCase().trim();
  const byId = cols.find((c) => c.id === s);
  if (byId) return byId.id;
  const byLabel = cols.find(
    (c) => (c.label || c.title || "").toLowerCase() === s
  );
  if (byLabel) return byLabel.id;
  if (s === "backlog" || s === "blocked") return "backlog";
  if (s === "todo") return "todo";
  if (s === "in progress") return "in-progress";
  if (s === "in review") return "in-review";
  if (s === "done") return "done";
  return s.replace(/\s+/g, "-");
}

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const { projects, currentProject } = useSelector((state) => state.projects);
  const { projectTasks, projectTasksLoading, taskComments, projectActivities, projectActivitiesLoading } = useSelector((state) => state.tasks);
  const authStateUser = useSelector((state) => state.auth.user);
  const user = authStateUser?.data?.user || authStateUser?.user || authStateUser || null;
  const { userInfo } = useSelector((state) => state.user || {});
  const currentUserId = (user?._id || user?.id || userInfo?.user?._id || userInfo?._id || userInfo?.id)?.toString();
  const { isProjectAdmin, isProjectManager, isProjectEmployee, projectRole } = usePermission();
  const isSuperAdmin = projectRole === 'superadmin';
  const isAdmin = isProjectAdmin;
  const isManager = isProjectManager;

  const project = currentProject?._id === id ? currentProject : projects?.find((p) => p._id === id);
  const tasks = projectTasks || [];
  const loading = projectTasksLoading;

  const isProjectOwner = (project?.owner?._id || project?.owner)?.toString() === currentUserId;
  const isProjectTeamMember = Boolean(
    project?.team && project.team.some((m) => {
      const mid = (m?._id || m)?.toString();
      return mid === currentUserId;
    })
  );
  const canEditProject = isSuperAdmin || isAdmin || (isManager && isProjectOwner);
  const canDeleteProject = isSuperAdmin || isAdmin;
  const canManageTasks = isSuperAdmin || isAdmin || isManager;
  const canCreateTask = isSuperAdmin || isAdmin || (isManager && (isProjectOwner || isProjectTeamMember));

  const [addTaskStatus, setAddTaskStatus] = useState("Todo");
  const [showAddTask, setShowAddTask] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(null);
  const [showComments, setShowComments] = useState(null);
  const [showEditProject, setShowEditProject] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [draggedColumnId, setDraggedColumnId] = useState(null);
  const [dragOverColumnReorder, setDragOverColumnReorder] = useState(null);
  const [workspaceView, setWorkspaceView] = useState("board");
  const [showManageStatuses, setShowManageStatuses] = useState(false);
  const [highlightedTaskId, setHighlightedTaskId] = useState(null);

  // Locate task on Kanban board (scroll and flash highlight)
  const handleLocateTask = (taskId) => {
    setHighlightedTaskId(taskId);
    setWorkspaceView("board");
    setTimeout(() => {
      const el = document.getElementById(`kanban-task-${taskId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      }
    }, 150);
    setTimeout(() => {
      setHighlightedTaskId((prev) => (prev === taskId ? null : prev));
    }, 3500);
  };

  // Manage statuses visible to Project Admins OR Project Managers assigned to this project
  const canManageStatuses = isSuperAdmin || isAdmin || (isManager && (isProjectOwner || isProjectTeamMember));

  // Dynamic Kanban columns from project's customStatuses
  const customColumns = useMemo(() =>
    (project?.customStatuses || [])
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((cs) => ({
        id: cs.label.toLowerCase().trim().replace(/\s+/g, "-"),
        title: cs.label,
        label: cs.label,
        accent: cs.color || "bg-purple-500",
        hexColor: cs.color || null,
        isCustom: true,
      })),
    [project?.customStatuses]
  );

  // Reorder columns based on project.statuses or project.statusOrder if defined
  const KANBAN_COLUMNS = useMemo(() => {
    if (Array.isArray(project?.statuses) && project.statuses.length > 0) {
      return project.statuses
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((s) => ({
          id: s.id || s.label.toLowerCase().trim().replace(/\s+/g, "-"),
          title: s.label,
          label: s.label,
          accent: s.color || COLUMN_ACCENTS[s.label.toLowerCase()] || "bg-purple-500",
          hexColor: s.color || null,
          category: s.category || "todo",
          isCustom: true,
        }));
    }

    const allCols = [...BUILTIN_COLUMNS, ...customColumns];
    const order = project?.statusOrder;
    if (!Array.isArray(order) || order.length === 0) {
      return allCols;
    }
    return allCols.slice().sort((a, b) => {
      const aName = (a.label || a.title || "").toLowerCase();
      const bName = (b.label || b.title || "").toLowerCase();
      const aIndex = order.findIndex((o) => o.toLowerCase() === aName || o.toLowerCase() === a.id);
      const bIndex = order.findIndex((o) => o.toLowerCase() === bName || o.toLowerCase() === b.id);
      const posA = aIndex === -1 ? 999 : aIndex;
      const posB = bIndex === -1 ? 999 : bIndex;
      return posA - posB;
    });
  }, [project?.statuses, customColumns, project?.statusOrder]);

  const handleColumnDragStart = (e, colId) => {
    if (!canManageStatuses) return;
    setDraggedColumnId(colId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("dragType", "column");
    e.dataTransfer.setData("columnId", colId);
  };

  const handleColumnDragEnd = () => {
    setDraggedColumnId(null);
    setDragOverColumnReorder(null);
  };

  const handleReorderColumns = async (sourceId, targetId) => {
    const currentOrder = KANBAN_COLUMNS.map((c) => c.label || c.title);
    const sourceIndex = KANBAN_COLUMNS.findIndex((c) => c.id === sourceId);
    const targetIndex = KANBAN_COLUMNS.findIndex((c) => c.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;

    const newOrder = [...currentOrder];
    const [moved] = newOrder.splice(sourceIndex, 1);
    newOrder.splice(targetIndex, 0, moved);

    let updatedStatuses = [];
    if (Array.isArray(project?.statuses) && project.statuses.length > 0) {
      updatedStatuses = project.statuses.map((s) => {
        const idx = newOrder.findIndex((lbl) => lbl.toLowerCase() === s.label.toLowerCase());
        return {
          ...s,
          order: idx !== -1 ? idx : (s.order ?? 0),
        };
      });
    }

    const updatedCustomStatuses = (project?.customStatuses || []).map((cs) => {
      const idx = newOrder.findIndex((label) => label.toLowerCase() === cs.label.toLowerCase());
      return {
        label: cs.label,
        order: idx !== -1 ? idx : (cs.order ?? 0),
        ...(cs.color ? { color: cs.color } : {}),
      };
    });

    try {
      await dispatch(
        updateProject({
          id: project._id,
          updates: {
            title: project?.title,
            statusOrder: newOrder,
            ...(updatedStatuses.length > 0 ? { statuses: updatedStatuses } : {}),
            customStatuses: updatedCustomStatuses,
          },
        })
      ).unwrap();
      await dispatch(fetchProjectById(id)).unwrap();
      toast.success("Column order updated");
    } catch (err) {
      toast.error(err?.message || "Failed to update column order");
    }
  };

  const allStatuses = useMemo(() => {
    if (Array.isArray(project?.statuses) && project.statuses.length > 0) {
      return project.statuses.map((s) => s.label);
    }
    return [
      "Backlog",
      "Todo",
      "In Progress",
      "In Review",
      "Done",
      ...(project?.customStatuses || []).map((s) => s.label),
    ];
  }, [project?.statuses, project?.customStatuses]);

  const getColumnAccent = (colId) => {
    const col = KANBAN_COLUMNS.find((c) => c.id === colId);
    return col?.accent || COLUMN_ACCENTS[colId] || "bg-purple-500";
  };

  const isTaskAssignee = (task) => {
    return task?.team && task.team.some((member) => {
      const mid = (member?._id || member)?.toString();
      return mid === currentUserId;
    });
  };

  const handleDragStart = (e, task) => {
    if (!canManageTasks && !isTaskAssignee(task)) {
      e.preventDefault();
      toast.info("You can only move tasks assigned to you.");
      return;
    }
    setDraggedTaskId(task._id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("taskId", task._id);
    e.dataTransfer.setData("sourceColumn", toColumnId(task.status, KANBAN_COLUMNS));
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    if (draggedColumnId) {
      e.dataTransfer.dropEffect = "move";
      setDragOverColumnReorder(columnId);
    } else {
      e.dataTransfer.dropEffect = "move";
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = (e, columnId) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      if (dragOverColumn === columnId) setDragOverColumn(null);
      if (dragOverColumnReorder === columnId) setDragOverColumnReorder(null);
    }
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    const dragType = e.dataTransfer.getData("dragType");
    const colId = e.dataTransfer.getData("columnId") || draggedColumnId;

    if (dragType === "column" || colId) {
      if (canManageStatuses && colId && colId !== columnId) {
        handleReorderColumns(colId, columnId);
      }
      setDraggedColumnId(null);
      setDragOverColumnReorder(null);
      return;
    }

    const taskId = e.dataTransfer.getData("taskId") || draggedTaskId;
    const sourceColumn = e.dataTransfer.getData("sourceColumn") ||
      toColumnId(tasks.find((task) => task._id === taskId)?.status, KANBAN_COLUMNS);
    const task = tasks.find((t) => t._id === taskId);
    if (task && !canManageTasks && !isTaskAssignee(task)) {
      toast.error("You can only update status for tasks assigned to you.");
      setDraggedTaskId(null);
      setDragOverColumn(null);
      return;
    }
    if (taskId && sourceColumn !== columnId) {
      const col = KANBAN_COLUMNS.find((c) => c.id === columnId);
      const newStatus = col?.label ?? col?.title ?? null;
      if (newStatus) {
        // Dependency safeguard: check if moving to active/done column while prerequisites are incomplete
        const isDoneOrActive =
          isStatusDone(newStatus) ||
          String(newStatus).toLowerCase().includes("progress") ||
          String(newStatus).toLowerCase().includes("dev") ||
          String(newStatus).toLowerCase().includes("review");
        const unresolvedPrereqs = getUnresolvedPrerequisites(task, tasks);

        if (isDoneOrActive && unresolvedPrereqs.length > 0) {
          const prereqNames = unresolvedPrereqs
            .map((p) => `"${p.title}" (${p.status || "Todo"})`)
            .join(", ");
          confirm({
            title: "Unresolved Dependency Warning",
            message: `This task depends on ${prereqNames}, which ${
              unresolvedPrereqs.length === 1 ? "is" : "are"
            } not completed yet. Are you sure you want to move it to "${newStatus}"?`,
            confirmLabel: "Move Anyway",
            cancelLabel: "Keep In Current Column",
            confirmVariant: "danger",
            onConfirm: () => {
              handleUpdateStatus(taskId, newStatus);
            },
          });
        } else {
          handleUpdateStatus(taskId, newStatus);
        }
      }
    }
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  useEffect(() => {
    if (id) {
      dispatch(fetchProjectById(id));
      dispatch(fetchProjectTasks(id));
      dispatch(fetchProjectActivities(id));
    }
  }, [id, dispatch]);

  const [searchParams] = useSearchParams();
  const urlTaskId = searchParams.get("taskId");

  useEffect(() => {
    if (urlTaskId) {
      if (tasks && tasks.length > 0) {
        const found = tasks.find((t) => t._id === urlTaskId || t.taskID === urlTaskId);
        if (found) {
          setShowTaskDetail(found);
          return;
        }
      }
      taskApi.getTaskById(urlTaskId)
        .then((t) => {
          if (t) setShowTaskDetail(t);
        })
        .catch(() => {});
    }
  }, [urlTaskId, tasks]);

  // Fetch task comments when task detail opens
  useEffect(() => {
    if (showTaskDetail?._id) {
      dispatch(fetchTaskComments(showTaskDetail._id));
    }
  }, [showTaskDetail, dispatch]);

  const handleCreateTask = async (taskData) => {
    if (!canCreateTask) {
      toast.error("You do not have permission to create tasks.");
      return;
    }
    try {
      await dispatch(createTask({ ...taskData, project: id })).unwrap();
      toast.success("Task created successfully");
      setShowAddTask(false);
      // Refetch project tasks to ensure the board is in sync
      dispatch(fetchProjectTasks(id));
    } catch (err) {
      toast.error(err?.message || "Failed to create task");
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await dispatch(updateTaskStatus({ id: taskId, status: newStatus })).unwrap();
      toast.success("Task status updated");
      dispatch(fetchProjectTasks(id));
    } catch (err) {
      toast.error(err?.message || "Failed to update task status");
    }
  };

  const handleAddComment = async (taskId, commentData) => {
    try {
      const payload = typeof commentData === 'string'
        ? { taskId, content: commentData }
        : { taskId, ...commentData };
      await dispatch(addTaskComment(payload)).unwrap();
      toast.success("Comment added");
    } catch (err) {
      toast.error(err?.message || "Failed to add comment");
      throw err;
    }
  };

  const handleDeleteComment = async (taskId, commentId) => {
    try {
      await dispatch(deleteTaskComment({ taskId, commentId })).unwrap();
      toast.success("Comment deleted");
    } catch (err) {
      toast.error(err?.message || "Failed to delete comment");
      throw err;
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const updated = await dispatch(updateTask({ id: taskId, updates })).unwrap();
      toast.success("Task details updated");
      await dispatch(fetchProjectTasks(id)).unwrap();
      setShowTaskDetail((current) => current?._id === taskId ? { ...current, ...updated } : current);
      return updated;
    } catch (err) {
      toast.error(err?.message || "Failed to update task details");
      throw err;
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await dispatch(deleteTask(taskId)).unwrap();
      toast.success("Task deleted successfully");
      setShowTaskDetail(null);
      await dispatch(fetchProjectTasks(id)).unwrap();
    } catch (err) {
      toast.error(err?.message || "Failed to delete task");
      throw err;
    }
  };

  const handleDeleteProject = () => {
    if (!project) return;
    confirm({
      title: "Delete Project",
      message: `Delete "${project.title}"? This cannot be undone.`,
      confirmText: "Delete",
      onConfirmAction: async () => {
        try {
          await dispatch(deleteProject(project._id)).unwrap();
          toast.success("Project deleted");
          navigate("/project/projects");
        } catch (err) {
          toast.error(err?.message || "Failed to delete");
          throw err;
        }
      },
    });
  };

  const handleSaveStatuses = async (saveData) => {
    try {
      const statusesList = Array.isArray(saveData) ? saveData : (saveData?.statuses || []);
      const reassignTasks = Array.isArray(saveData?.reassignTasks) ? saveData.reassignTasks : [];

      const newStatusOrder = statusesList.map((s) => s.label);
      const sanitizedCustomStatuses = statusesList.map((c, i) => ({
        label: c.label,
        order: c.order ?? i,
        ...(c.color ? { color: c.color } : {}),
      }));

      await dispatch(
        updateProject({
          id: project._id,
          updates: {
            title: project?.title,
            statuses: statusesList,
            statusOrder: newStatusOrder,
            customStatuses: sanitizedCustomStatuses,
            reassignTasks,
          },
        })
      ).unwrap();
      await dispatch(fetchProjectById(id)).unwrap();
      await dispatch(fetchProjectTasks(id)).unwrap();
      toast.success("Statuses updated successfully");
    } catch (err) {
      toast.error(err?.message || "Failed to update statuses");
      throw err;
    }
  };

  const handleEditProject = async (updates) => {
    try {
      await dispatch(updateProject({ id: project._id, updates })).unwrap();
      toast.success("Project updated");
      await dispatch(fetchProjectById(id)).unwrap();
      setShowEditProject(false);
    } catch (err) {
      toast.error(err?.message || "Failed to update project");
    }
  };

  const getTasksByStatus = (status) =>
    tasks.filter((t) => toColumnId(t.status, KANBAN_COLUMNS) === status);

  if (!project) {
    return loading ? (
      <div className="flex justify-center items-center py-20"><Loader size="xl" text="Loading project..." /></div>
    ) : (
      <div className="text-center py-12 text-muted">Project not found</div>
    );
  }

  const pct = projectProgress(project, tasks);
  const team = project.team || [];
  const teamNames = team
    .map((m) => (typeof m === "object" ? (personName(m) || m.name || m.email) : null))
    .filter(Boolean)
    .join(", ");

  const taskCounts = {
    total: tasks.length,
    done: tasks.filter((task) => (task.status || "").toLowerCase() === "done").length,
    active: tasks.filter((task) => {
      const s = (task.status || "").toLowerCase();
      return s === "in progress" || s === "in review";
    }).length,
    todo: tasks.filter((task) => (task.status || "").toLowerCase() === "todo").length,
    backlog: tasks.filter((task) => (task.status || "").toLowerCase() === "backlog").length,
    pending: tasks.filter((task) => {
      const s = (task.status || "").toLowerCase();
      return s === "todo" || s === "backlog";
    }).length,
  };

  const overdueTasks = tasks.filter((task) => {
    const s = (task.status || "").toLowerCase();
    return s !== "done" && task.dueDate && new Date(task.dueDate) < new Date();
  });

  // Industry-standard real-time project health computation
  const healthInfo = (() => {
    const serverHealth = project.health;
    const isCompleted = project.status === "Completed";
    const isProjectOverdue = project.dueDate && new Date(project.dueDate) < new Date() && !isCompleted;
    const daysRemaining = project.dueDate
      ? Math.ceil((new Date(project.dueDate) - new Date()) / 86400000)
      : null;

    const reasons = [];
    if (overdueTasks.length > 0) {
      reasons.push(`${overdueTasks.length} overdue task${overdueTasks.length === 1 ? "" : "s"}`);
    }
    if (isProjectOverdue) {
      reasons.push("Project deadline passed");
    }
    if (!reasons.length && daysRemaining !== null && daysRemaining <= 7 && daysRemaining >= 0 && !isCompleted && pct < 75) {
      reasons.push(`Due in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`);
    }

    let status = "On Track";
    if (isCompleted) {
      status = "On Track";
    } else if (overdueTasks.length > 0 || isProjectOverdue) {
      status = "At Risk";
    } else if (daysRemaining !== null && daysRemaining <= 7 && pct < 75) {
      status = "Watch";
    } else if (serverHealth?.status) {
      status = serverHealth.status;
    }

    const cleanServerReasons = (serverHealth?.reasons || []).filter(
      (r) => !r.toLowerCase().includes("blocked")
    );
    const combinedReasons = reasons.length > 0 ? reasons : cleanServerReasons;

    return {
      status,
      reasons: combinedReasons,
    };
  })();

  const currentHealthConfig = {
    "On Track": {
      badge: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      dot: "bg-emerald-500",
      iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25",
      title: "Schedule On Track",
      sub: "All milestones & tasks progressing as planned",
      Icon: CheckCircleIcon,
    },
    Watch: {
      badge: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
      dot: "bg-amber-500",
      iconBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25",
      title: "Needs Monitoring",
      sub: healthInfo.reasons.join(" · ") || "Upcoming deadline approaching",
      Icon: ClockIcon,
    },
    "At Risk": {
      badge: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
      dot: "bg-rose-500",
      iconBg: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25",
      title: "Schedule At Risk",
      sub: healthInfo.reasons.join(" · ") || "Schedule delays detected",
      Icon: ExclamationTriangleIcon,
    },
  }[healthInfo.status] || {
    badge: "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25",
    title: "Schedule On Track",
    sub: "All milestones & tasks progressing as planned",
    Icon: CheckCircleIcon,
  };

  const scrollToTasks = () => {
    const el = document.getElementById("task-workspace");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <PageContainer isCard={false}>
      <div className="flex flex-col gap-5 w-full">
        {/* ===== Project hero ===== */}
        <section className="glass-card bg-surface">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={() => navigate("/project/projects")}
                className="p-1.5 -ml-1.5 rounded-lg text-muted hover:text-heading hover:bg-card-hover transition-colors shrink-0"
                aria-label="Back to projects"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-heading tracking-tight break-words leading-tight flex-1 min-w-0">{project.title}</h1>
              <div
                className="flex items-center gap-1.5 shrink-0"
                title={`Project Status: ${project.status || "Planning"}`}
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted hidden sm:inline">
                  Status
                </span>
                <TableStatus value={project.status || "Planning"} className="shrink-0" />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {canEditProject && (
                <button
                  type="button"
                  onClick={() => setShowEditProject(true)}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-border-accent bg-amber-50 text-brand-text hover:bg-amber-100 transition-colors"
                  aria-label="Edit project"
                  title="Edit project"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
              )}
              {canDeleteProject && (
                <button
                  type="button"
                  onClick={handleDeleteProject}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-border-accent bg-amber-50 text-brand-text hover:bg-danger-bg hover:text-danger transition-colors"
                  aria-label="Delete project"
                  title="Delete project"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          {(project.projectGroup || project.description) && (
            <div className="mt-3">
              {project.projectGroup && (
                <span className="inline-flex items-center gap-1.5 mb-2 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-brand-text border border-border-accent">
                  <FolderIcon className="w-3.5 h-3.5" />
                  {project.projectGroup.name || (typeof project.projectGroup === "string" ? project.projectGroup : "Group")}
                </span>
              )}
              {project.description && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted">Project Description</span>
                  </div>
                  <div className="max-h-52 overflow-y-auto custom-scrollbar-visible pr-2 rounded-xl bg-card/60 border border-border-subtle p-3.5 shadow-inner">
                    <p className="text-sm text-main leading-relaxed whitespace-pre-wrap break-words">
                      {project.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr_auto] gap-5 mt-5 pt-5 border-t border-border-subtle">
            {/* Overall progress */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted">Overall progress</p>
              <div className="flex items-baseline justify-between gap-3 mt-1.5">
                <span className="text-3xl font-black text-heading tabular-nums leading-none">{pct}%</span>
                <span className="text-xs text-muted">{taskCounts.done} of {taskCounts.total} tasks complete</span>
              </div>
              <Progress value={pct} trackClassName="h-2 rounded-full mt-3" />
            </div>

            {/* Project health */}
            <div className="lg:border-l lg:border-border-subtle lg:pl-5 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted">Project Health</p>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${currentHealthConfig.badge}`}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    {healthInfo.status === "On Track" && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    )}
                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${currentHealthConfig.dot}`} />
                  </span>
                  {healthInfo.status}
                </span>
              </div>
              <div className="flex items-center gap-2.5 mt-2 min-w-0">
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-transform duration-200 ${currentHealthConfig.iconBg}`}
                >
                  <currentHealthConfig.Icon className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-heading truncate">
                    {currentHealthConfig.title}
                  </p>
                  <p
                    className="text-[11px] font-medium text-muted truncate mt-0.5"
                    title={currentHealthConfig.sub}
                  >
                    {currentHealthConfig.sub}
                  </p>
                </div>
              </div>
            </div>

            {/* Stat tiles */}
            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
              {/* Active Tasks */}
              <div
                role="button"
                tabIndex={0}
                onClick={scrollToTasks}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    scrollToTasks();
                  }
                }}
                className="group relative rounded-xl border border-sky-500/25 bg-sky-500/[0.04] dark:border-sky-500/20 dark:bg-sky-500/[0.06] p-3 sm:px-3.5 sm:py-3 min-w-[104px] sm:min-w-[120px] flex flex-col justify-between cursor-pointer select-none transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-500/50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                title="Active Tasks: Tasks currently In Progress or In Review (Click to view in task workspace)"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30 transition-transform duration-200 group-hover:scale-110">
                    <BoltIcon className="w-3.5 h-3.5" />
                  </span>
                  <span className="truncate text-[10px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-300">
                    Active Tasks
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-black text-heading tabular-nums leading-none">
                    {taskCounts.active}
                  </p>
                  <p className="mt-1 truncate text-[10px] font-medium text-muted">
                    In progress & review
                  </p>
                </div>
              </div>

              {/* Pending Tasks */}
              <div
                role="button"
                tabIndex={0}
                onClick={scrollToTasks}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    scrollToTasks();
                  }
                }}
                className="group relative rounded-xl border border-amber-500/25 bg-amber-500/[0.04] dark:border-amber-500/20 dark:bg-amber-500/[0.06] p-3 sm:px-3.5 sm:py-3 min-w-[104px] sm:min-w-[120px] flex flex-col justify-between cursor-pointer select-none transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-500/50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                title="Pending Tasks: Tasks waiting in backlog and to do (Click to view in task workspace)"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-transform duration-200 group-hover:scale-110">
                    <ClipboardDocumentListIcon className="w-3.5 h-3.5" />
                  </span>
                  <span className="truncate text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                    Pending Tasks
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-black text-heading tabular-nums leading-none">
                    {taskCounts.pending}
                  </p>
                  <p className="mt-1 truncate text-[10px] font-medium text-muted">
                    {taskCounts.todo} to do · {taskCounts.backlog} backlog
                  </p>
                </div>
              </div>

              {/* Team Members */}
              <div
                className="group relative rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04] dark:border-emerald-500/20 dark:bg-emerald-500/[0.06] p-3 sm:px-3.5 sm:py-3 min-w-[104px] sm:min-w-[120px] flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/50 hover:shadow-md"
                title={
                  teamNames
                    ? `Team Members (${team.length}): ${teamNames}`
                    : "Team Members: No members currently assigned"
                }
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-transform duration-200 group-hover:scale-110">
                    <UsersIcon className="w-3.5 h-3.5" />
                  </span>
                  <span className="truncate text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    Team Members
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-2xl font-black text-heading tabular-nums leading-none">
                    {team.length}
                  </p>
                  <p className="mt-1 truncate text-[10px] font-medium text-muted">
                    {team.length === 1 ? "1 contributor" : `${team.length} contributors`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5 pt-4 border-t border-border-subtle text-[10px] font-black uppercase tracking-widest text-muted">
            <span className="flex items-center gap-1.5"><CalendarDaysIcon className="w-3.5 h-3.5" /> Due {shortDate(project.dueDate)}</span>
            <span className="hidden sm:block w-px h-4 bg-border-subtle" />
            <span className="flex items-center gap-1.5">
              <FlagIcon className="w-3.5 h-3.5" /> Priority:{" "}
              <span className="text-brand-text">{project.priority || "Medium"}</span>
            </span>
            <span className="hidden sm:block w-px h-4 bg-border-subtle" />
            <span className="flex items-center gap-1.5"><ClockIcon className="w-3.5 h-3.5" /> Started {shortDate(project.startDate)}</span>
          </div>
        </section>

        {/* ===== Milestones (conditional) ===== */}
        {project.milestones?.length > 0 && (
          <section className="glass-card bg-surface">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-text">Delivery plan</p>
                <h2 className="text-base font-black text-heading uppercase tracking-tight mt-1">Milestones</h2>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted">
                {project.milestones.filter((milestone) => milestone.status === "Completed").length}/{project.milestones.length} complete
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {project.milestones.map((milestone, index) => (
                <div key={milestone._id || index} className="rounded-xl border border-border-subtle bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-heading">{milestone.title}</p>
                    <TableStatus value={milestone.status} />
                  </div>
                  <p className={`text-[10px] uppercase tracking-widest mt-2 ${isOverdue(milestone.dueDate, milestone.status === "Completed" ? "Done" : milestone.status) ? "text-danger" : "text-muted"}`}>
                    Due {shortDate(milestone.dueDate)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ===== Task workspace ===== */}
        <div id="task-workspace" className="space-y-3.5">
          <PortalTabBar
            tabs={[
              {
                key: "board",
                title: "Board",
                icon: ViewColumnsIcon,
                badge: tasks?.length ?? 0,
                hint: "Kanban board view",
              },
              {
                key: "list",
                title: "List",
                icon: ListBulletIcon,
                badge: tasks?.length ?? 0,
                hint: "Table list view",
              },
            ]}
            activeKey={workspaceView}
            onChange={setWorkspaceView}
            layoutId="workspace-tab-pill"
            ariaLabel="Task workspace views"
            right={
              <div className="flex items-center gap-2.5">
                {canManageStatuses && (
                  <>
                    {KANBAN_COLUMNS?.length > 0 && (
                      <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-purple-500/25 bg-purple-500/10 text-[11px] font-bold text-purple-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                        {KANBAN_COLUMNS.length} {KANBAN_COLUMNS.length === 1 ? "Status" : "Statuses"}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowManageStatuses(true)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border-subtle bg-card hover:bg-card-hover hover:border-border-accent text-xs font-bold text-heading hover:text-brand-text shadow-sm transition-all duration-200 group whitespace-nowrap shrink-0"
                      title="Add, remove or reorder Kanban statuses for this project"
                    >
                      <Cog6ToothIcon className="w-4 h-4 text-muted group-hover:text-brand-text group-hover:rotate-90 transition-all duration-300" />
                      <span>Manage Statuses</span>
                    </button>
                  </>
                )}
              </div>
            }
          />

          {/* Board (Kanban) View */}
          {workspaceView === "board" && (
            <section className="glass-card bg-surface !p-0 overflow-hidden">
              <div className="p-5">
                <div className="overflow-x-auto">
                  <div
                    className="flex gap-4 items-stretch pb-2"
                    style={{ minWidth: `${Math.max(KANBAN_COLUMNS.length * 330, 1200)}px` }}
                  >
                    {KANBAN_COLUMNS.map((col) => {
                      const colTasks = getTasksByStatus(col.id);
                      const isColDragging = draggedColumnId === col.id;
                      const isColDropTarget = dragOverColumnReorder === col.id && !isColDragging;

                      return (
                        <div
                          key={col.id}
                          className={`rounded-2xl border bg-surface p-4 flex flex-col transition-all flex-1 min-w-[310px] max-w-[380px] shadow-sm ${
                            isColDragging ? "opacity-30 border-dashed border-brand" : ""
                          } ${
                            isColDropTarget
                              ? "ring-2 ring-brand border-brand scale-[1.01]"
                              : dragOverColumn === col.id
                              ? "border-border-accent ring-2 ring-border-accent bg-amber-50"
                              : "border-border-subtle"
                          }`}
                          onDragOver={(e) => handleDragOver(e, col.id)}
                          onDragLeave={(e) => handleDragLeave(e, col.id)}
                          onDrop={(e) => handleDrop(e, col.id)}
                        >
                          <div className="flex items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-border-subtle/70">
                            <div className="flex items-center gap-2 min-w-0">
                              {canManageStatuses && (
                                <span
                                  draggable
                                  onDragStart={(e) => {
                                    e.stopPropagation();
                                    handleColumnDragStart(e, col.id);
                                  }}
                                  onDragEnd={handleColumnDragEnd}
                                  className="grid h-6 w-6 place-items-center rounded-lg text-muted hover:text-heading cursor-grab active:cursor-grabbing hover:bg-card-hover transition-colors"
                                  title="Drag to reorder this status column"
                                >
                                  <Bars3Icon className="w-4 h-4" />
                                </span>
                              )}
                              <span
                                className={`w-3 h-3 rounded-full shrink-0 shadow-sm ${
                                  col.accent && col.accent.startsWith("bg-") ? col.accent : ""
                                }`}
                                style={
                                  col.hexColor
                                    ? { backgroundColor: col.hexColor }
                                    : col.accent && !col.accent.startsWith("bg-")
                                    ? { backgroundColor: col.accent }
                                    : undefined
                                }
                              />
                              <h3 className="text-xs font-black uppercase tracking-wider text-heading truncate">{col.title}</h3>
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-card border border-border-subtle text-muted tabular-nums ml-1">
                                {colTasks.length}
                              </span>
                            </div>
                            {canCreateTask && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAddTaskStatus(col.label || col.title);
                                  setShowAddTask(true);
                                }}
                                className="grid h-6 w-6 shrink-0 place-items-center rounded-lg border border-border-subtle bg-card text-muted hover:border-border-accent hover:bg-card-hover hover:text-brand-text transition-colors"
                                aria-label={`Add task to ${col.title}`}
                                title={`Add task to ${col.title}`}
                              >
                                <PlusIcon className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="flex-1 space-y-3.5 max-h-[calc(100vh-320px)] min-h-[360px] overflow-y-auto pr-1 custom-scrollbar-visible">
                            {colTasks.map((task) => (
                              <TaskCard
                                key={task._id}
                                task={task}
                                columnId={col.id}
                                draggable={canManageTasks || isTaskAssignee(task)}
                                onClick={() => setShowTaskDetail(task)}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                onOpenComments={() => setShowComments(task)}
                                isDragging={draggedTaskId === task._id}
                                isHighlighted={highlightedTaskId === task._id}
                                allTasks={tasks}
                                onLocateTask={handleLocateTask}
                              />
                            ))}
                            {colTasks.length === 0 && (
                              <div
                                className={`flex items-center justify-center min-h-[340px] rounded-2xl border border-dashed text-[11px] font-black uppercase tracking-widest transition-colors ${
                                  dragOverColumn === col.id
                                    ? "border-brand text-brand"
                                    : "border-border-subtle text-muted/70"
                                }`}
                              >
                                {dragOverColumn === col.id ? "Drop here" : "No tasks"}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* List View */}
          {workspaceView === "list" && (
            <section className="glass-card bg-surface !p-0 overflow-hidden">
              <div className="p-5">
                <ListView
                  tasks={tasks}
                  onTaskClick={(task) => setShowTaskDetail(task)}
                  projectStatuses={allStatuses}
                />
              </div>
            </section>
          )}
        </div>

        {showComments && (
          <TaskCommentsDrawer
            task={showComments}
            comments={taskComments[showComments?._id] || []}
            onClose={() => setShowComments(null)}
            onAddComment={(commentData) => handleAddComment(showComments._id, commentData)}
            onAddcomment={(commentData) => handleAddComment(showComments._id, commentData)}
            onDeleteComment={(commentId) => handleDeleteComment(showComments._id, commentId)}
            currentUserId={currentUserId}
          />
        )}

        {showTaskDetail && (
          <TaskDetailDrawer
            task={showTaskDetail}
            onClose={() => setShowTaskDetail(null)}
            onStatusChange={(status) => handleUpdateStatus(showTaskDetail._id, status)}
            onAddComment={(commentData) => handleAddComment(showTaskDetail._id, commentData)}
            onAddcomment={(commentData) => handleAddComment(showTaskDetail._id, commentData)}
            onDeleteComment={(commentId) => handleDeleteComment(showTaskDetail._id, commentId)}
            onDeleteTask={(taskId) => handleDeleteTask(taskId)}
            comments={taskComments[showTaskDetail._id] || []}
            currentUserId={currentUserId}
            projectTasks={tasks}
            canManageTasks={canManageTasks}
            onTaskUpdate={(updates) => handleUpdateTask(showTaskDetail._id, updates)}
            projectStatuses={allStatuses}
          />
        )}

        {/* Modals */}
        {canCreateTask && (
          <GlassModal
            isOpen={showAddTask}
            onClose={() => setShowAddTask(false)}
            title="New Task"
            description="Create a task in this project"
            maxWidth="max-w-2xl"
          >
            <AddTaskForm projectId={id} project={project} initialStatus={addTaskStatus} onSubmit={handleCreateTask} onClose={() => setShowAddTask(false)} projectStatuses={allStatuses} />
          </GlassModal>
        )}

        <GlassModal
          isOpen={showEditProject}
          onClose={() => setShowEditProject(false)}
          title="Edit Project"
          description="Update project details"
          maxWidth="max-w-2xl"
        >
          <EditProjectForm project={project} onSubmit={handleEditProject} onClose={() => setShowEditProject(false)} />
        </GlassModal>

        {canManageStatuses && (
          <ManageStatusesModal
            project={project}
            tasks={tasks}
            open={showManageStatuses}
            onClose={() => setShowManageStatuses(false)}
            onSave={handleSaveStatuses}
          />
        )}
      </div>
    </PageContainer>
  );
};

export default ProjectDetail;
