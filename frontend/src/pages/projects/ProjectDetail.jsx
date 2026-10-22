import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  FolderIcon,
  ChatBubbleLeftRightIcon,
  BoltIcon,
  NoSymbolIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { fetchProjectById, updateProject, deleteProject } from "../../store/projectSlice";
import { fetchProjectTasks, createTask, updateTaskStatus, updateTask, addTaskComment, fetchTaskComments, fetchProjectActivities } from "../../store/taskSlice";
import { useConfirm } from "../../context/ConfirmContext";
import Loader from "../../components/ui/Loader";
import PageContainer from "../../components/ui/PageContainer";
import GlassModal from "../../components/ui/GlassModal";
import Progress from "../../components/projectPortal/Progress";
import PanelHead from "../../components/projectPortal/PanelHead";
import EmptyState from "../../components/projectPortal/EmptyState";
import { formatDate, shortDate, isOverdue, projectProgress, taskProgress, getAssigneeName } from "../../components/projectPortal/helpers";
import AddTaskForm from "../../components/projectPortal/AddTaskForm";
import EditProjectForm from "../../components/projectPortal/EditProjectForm";
import TaskDetailDrawer from "../../components/projectPortal/TaskDetailDrawer";
import TaskCommentsDrawer from "../../components/projectPortal/TaskCommentsDrawer";
import TaskCard from "../../components/projectPortal/TaskCard";
import PortalTable from "../../components/projectPortal/PortalTable";
import {
  TableDate,
  TablePriority,
  TableProgress,
  TableStatus,
  TableText,
  TableTitle,
} from "../../components/ui/TableCells";

const KANBAN_COLUMNS = [
  { id: "backlog", title: "Backlog" },
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "in-review", title: "In Review" },
  { id: "done", title: "Done" },
];
const COLUMN_ACCENTS = {
  backlog: "bg-neutral",
  todo: "bg-amber-500",
  "in-progress": "bg-info",
  "in-review": "bg-warning",
  done: "bg-success",
};
const STATUS_DISPLAY = {
  backlog: "Backlog",
  todo: "To Do",
  "in-progress": "In Progress",
  "in-review": "In Review",
  done: "Done",
};

/** Map backend status to Kanban column ID */
function toColumnId(status) {
  if (!status) return "backlog";
  const s = String(status).toLowerCase();
  if (s === "todo") return "todo";
  if (s === "in progress") return "in-progress";
  if (s === "in review") return "in-review";
  if (s === "done") return "done";
  if (s === "blocked") return "in-review"; // blocked goes to In Review column
  return "backlog";
}

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const confirm = useConfirm();
  const { projects, currentProject } = useSelector((state) => state.projects);
  const { projectTasks, projectTasksLoading, taskComments, projectActivities, projectActivitiesLoading } = useSelector((state) => state.tasks);
  const { userInfo } = useSelector((state) => state.user || {});
  const currentUserId = userInfo?.user?._id || userInfo?._id || userInfo?.id;

  const project = currentProject?._id === id ? currentProject : projects?.find((p) => p._id === id);
  const tasks = projectTasks || [];
  const loading = projectTasksLoading;

  const [activeTab, setActiveTab] = useState("board");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(null);
  const [showComments, setShowComments] = useState(null);
  const [showEditProject, setShowEditProject] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const handleDragStart = (e, task) => {
    setDraggedTaskId(task._id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("taskId", task._id);
    e.dataTransfer.setData("sourceColumn", toColumnId(task.status));
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  };

  const handleDragLeave = (e, columnId) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      if (dragOverColumn === columnId) setDragOverColumn(null);
    }
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId") || draggedTaskId;
    const sourceColumn = e.dataTransfer.getData("sourceColumn") ||
      toColumnId(tasks.find((task) => task._id === taskId)?.status);
    if (taskId && sourceColumn !== columnId) {
      const newStatus = columnId === "backlog" ? "Todo"
        : columnId === "todo" ? "Todo"
        : columnId === "in-progress" ? "In Progress"
        : columnId === "in-review" ? "In Review"
        : columnId === "done" ? "Done"
        : null;
      if (newStatus) handleUpdateStatus(taskId, newStatus);
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

  useEffect(() => {
    if (id && activeTab === "activity") dispatch(fetchProjectActivities(id));
  }, [id, activeTab, dispatch]);

  // Fetch task comments when task detail opens
  useEffect(() => {
    if (showTaskDetail?._id) {
      dispatch(fetchTaskComments(showTaskDetail._id));
    }
  }, [showTaskDetail, dispatch]);

  const filteredTasks = tasks?.filter((task) =>
    task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleCreateTask = async (taskData) => {
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
    } catch (err) {
      toast.error(err?.message || "Failed to update task status");
    }
  };

  const handleAddComment = async (taskId, content) => {
    try {
      await dispatch(addTaskComment({ taskId, content })).unwrap();
      toast.success("Comment added");
    } catch (err) {
      toast.error(err?.message || "Failed to add comment");
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      await dispatch(updateTask({ id: taskId, updates })).unwrap();
      toast.success("Task details updated");
      await dispatch(fetchProjectTasks(id)).unwrap();
      setShowTaskDetail((current) => current?._id === taskId ? { ...current, ...updates } : current);
    } catch (err) {
      toast.error(err?.message || "Failed to update task details");
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
    filteredTasks.filter((t) => toColumnId(t.status) === status);

  if (!project) {
    return loading ? (
      <div className="flex justify-center items-center py-20"><Loader size="xl" text="Loading project..." /></div>
    ) : (
      <div className="text-center py-12 text-muted">Project not found</div>
    );
  }

  const pct = projectProgress(project);
  const team = project.team || [];
  const taskCounts = {
    total: tasks.length,
    done: tasks.filter((task) => task.status === "Done").length,
    active: tasks.filter((task) => ["In Progress", "In Review"].includes(task.status)).length,
    blocked: tasks.filter((task) => task.status === "Blocked").length,
  };

  const listColumns = [
    {
      key: "title",
      label: "Task",
      render: (v, row) => <TableTitle title={v} subtitle={row.description || undefined} maxWidth="max-w-[240px]" />,
    },
    {
      key: "status",
      label: "Status",
      hideBelow: "md",
      render: (v) => <TableStatus value={v} label={STATUS_DISPLAY[v] || v} />,
    },
    {
      key: "assignee",
      label: "Assignee",
      hideBelow: "lg",
      render: (_v, row) => <TableText value={getAssigneeName(row)} />,
    },
    {
      key: "dueDate",
      label: "Due",
      hideBelow: "md",
      render: (v, row) => {
        const overdue = isOverdue(v, row.status);
        return <TableDate value={v} tone={overdue ? "danger" : "muted"} subtitle={overdue ? "Overdue" : undefined} />;
      },
    },
    {
      key: "priority",
      label: "Priority",
      hideBelow: "lg",
      render: (v) => <TablePriority value={v || "Medium"} />,
    },
    {
      key: "progress",
      label: "Progress",
      hideBelow: "xl",
      render: (_v, row) => <TableProgress value={taskProgress(row)} />,
    },
  ];

  const listActions = [
    {
      title: "Comments",
      icon: ChatBubbleLeftRightIcon,
      onClick: (task) => setShowComments(task),
    },
  ];

  const tabs = ["board", "list", "comments", "activity"];

  return (
    <PageContainer isCard={false}>
      <div className="flex flex-col gap-5 w-full">
        {/* ===== Project hero ===== */}
        <section className="glass-card bg-surface">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => navigate("/project/projects")}
                  className="p-1.5 -ml-1.5 rounded-lg text-muted hover:text-heading hover:bg-card-hover transition-colors"
                  aria-label="Back to projects"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-text">Project overview</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border-accent bg-amber-50 text-brand-text">
                  <FolderIcon className="w-5 h-5" />
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-heading tracking-tight break-words">{project.title}</h1>
                <TableStatus value={project.status || "Planning"} />
              </div>
              {project.projectGroup && (
                <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-brand-text border border-border-accent">
                  <FolderIcon className="w-3.5 h-3.5" />
                  {project.projectGroup.name || (typeof project.projectGroup === "string" ? project.projectGroup : "Group")}
                </span>
              )}
            </div>
            <div className="flex flex-row gap-2 shrink-0">
              <button
                onClick={() => setShowEditProject(true)}
                className="btn btn-secondary py-2.5 px-4 whitespace-nowrap"
              >
                <PencilIcon className="w-4 h-4 mr-2" /> Edit project
              </button>
              <button
                onClick={handleDeleteProject}
                className="btn btn-secondary py-2.5 px-4 whitespace-nowrap text-danger hover:bg-danger-bg"
              >
                <TrashIcon className="w-4 h-4 mr-2" /> Delete
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr_auto] gap-5 mt-5 pt-5 border-t border-border-subtle">
            {/* Overall progress */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted">Overall progress</p>
              <div className="flex items-baseline justify-between gap-3 mt-1.5">
                <span className="text-3xl font-black text-heading tabular-nums leading-none">{pct}%</span>
                <span className="text-xs text-muted">{taskCounts.done} of {taskCounts.total} tasks complete</span>
              </div>
              <Progress value={pct} trackClassName="h-2 rounded-full mt-2.5" />
            </div>

            {/* Project health */}
            <div className="lg:border-l lg:border-border-subtle lg:pl-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted">Project health</p>
                <TableStatus value={project.health?.status || "On Track"} />
              </div>
              {project.health?.reasons?.length > 0 ? (
                <p className="flex items-start gap-1.5 text-xs font-medium text-danger mt-3">
                  <ExclamationCircleIcon className="w-4 h-4 shrink-0 mt-px" />
                  <span>{project.health.reasons.join(" · ")}</span>
                </p>
              ) : (
                <p className="text-xs text-muted mt-3">All tasks are on schedule.</p>
              )}
            </div>

            {/* Stat tiles */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-border-subtle bg-card px-3 py-2.5 min-w-[92px]">
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted">
                  <BoltIcon className="w-3.5 h-3.5" /> Active
                </div>
                <p className="text-xl font-black text-heading tabular-nums mt-1">{taskCounts.active}</p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-card px-3 py-2.5 min-w-[92px]">
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted">
                  <NoSymbolIcon className="w-3.5 h-3.5" /> Blocked
                </div>
                <p className={`text-xl font-black tabular-nums mt-1 ${taskCounts.blocked ? "text-danger" : "text-heading"}`}>{taskCounts.blocked}</p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-card px-3 py-2.5 min-w-[92px]">
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted">
                  <UsersIcon className="w-3.5 h-3.5" /> Team
                </div>
                <p className="text-xl font-black text-heading tabular-nums mt-1">{team.length}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-5 pt-4 border-t border-border-subtle text-[10px] font-black uppercase tracking-widest text-muted">
            <span className="flex items-center gap-1.5"><CalendarDaysIcon className="w-3.5 h-3.5" /> Due {shortDate(project.dueDate)}</span>
            <span className="flex items-center gap-1.5"><FlagIcon className="w-3.5 h-3.5" /> Priority: {project.priority || "Medium"}</span>
            <span className="flex items-center gap-1.5"><UsersIcon className="w-3.5 h-3.5" /> {team.length} member{team.length !== 1 ? "s" : ""}</span>
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
        <section className="glass-card bg-surface !p-0 overflow-hidden">
          <div className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-text">Task workspace</p>
                <h2 className="text-lg font-black text-heading uppercase tracking-tight mt-1">
                  {taskCounts.total} task{taskCounts.total !== 1 ? "s" : ""} in this project
                </h2>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks..."
                    className="glass-input !pl-9 w-full"
                  />
                </div>
                <button
                  onClick={() => setShowAddTask(true)}
                  className="btn btn-primary py-2.5 px-4 whitespace-nowrap"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  New Task
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${
                    activeTab === tab
                      ? "bg-brand text-on-brand shadow-[0_4px_15px_rgba(212,175,55,0.25)]"
                      : "text-muted hover:text-brand-text hover:bg-card-hover"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 pb-5">
            {activeTab === "board" && (
              <div className="overflow-x-auto">
                <div className="grid grid-cols-5 gap-4 min-w-[1100px] items-stretch">
                  {KANBAN_COLUMNS.map((col) => {
                    const colTasks = getTasksByStatus(col.id);
                    return (
                      <div
                        key={col.id}
                        className={`rounded-xl border bg-surface p-3.5 flex flex-col transition-colors ${
                          dragOverColumn === col.id
                            ? "border-border-accent ring-2 ring-border-accent bg-amber-50"
                            : "border-border-subtle"
                        }`}
                        onDragOver={(e) => handleDragOver(e, col.id)}
                        onDragLeave={(e) => handleDragLeave(e, col.id)}
                        onDrop={(e) => handleDrop(e, col.id)}
                      >
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${COLUMN_ACCENTS[col.id] || "bg-amber-500"}`} />
                            <h3 className="text-xs font-black uppercase tracking-widest text-heading truncate">{col.title}</h3>
                          </div>
                          <span className="grid h-6 min-w-6 place-items-center rounded-full border border-border-subtle bg-card px-1.5 text-[11px] font-bold text-muted tabular-nums">
                            {colTasks.length}
                          </span>
                        </div>
                        <div className="flex-1 space-y-3">
                          {colTasks.map((task) => (
                            <TaskCard
                              key={task._id}
                              task={task}
                              columnId={col.id}
                              onClick={() => setShowTaskDetail(task)}
                              onDragStart={handleDragStart}
                              onDragEnd={handleDragEnd}
                              onOpenComments={() => setShowComments(task)}
                              isDragging={draggedTaskId === task._id}
                            />
                          ))}
                          {colTasks.length === 0 && (
                            <div
                              className={`flex items-center justify-center min-h-[320px] rounded-xl border border-dashed text-[11px] font-black uppercase tracking-widest transition-colors ${
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
            )}

            {activeTab === "list" && (
              <PortalTable
                columns={listColumns}
                data={filteredTasks}
                loading={loading}
                onRowClick={(task) => setShowTaskDetail(task)}
                actions={listActions}
                rowsPerPage={10}
                emptyTitle={tasks.length === 0 ? "No tasks in this project" : "No matching tasks"}
                emptyHint="Try a different search."
              />
            )}

            {activeTab === "comments" && (
              <div className="rounded-xl border border-border-subtle bg-surface p-4">
                <PanelHead title="Project Comments" subtitle="All discussions across tasks" />
                {filteredTasks.length === 0 ? (
                  <EmptyState title="No tasks yet" hint="Create a task to start a discussion." />
                ) : (
                  <div className="space-y-4">
                    {filteredTasks.map((task) => {
                      const comments = taskComments[task._id] || [];
                      return comments.length > 0 ? (
                        <div key={task._id} className="border-t border-border-subtle pt-4">
                          <p className="text-sm font-semibold text-heading mb-2">{task.title}</p>
                          <div className="space-y-3">
                            {comments.map((c) => (
                              <div key={c._id || c.id} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-amber-50 border border-border-accent flex items-center justify-center flex-shrink-0">
                                  <span className="text-brand-text font-black text-sm">{c.user?.name?.[0] || "U"}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-semibold text-heading">{c.user?.name || "Unknown"}</span>
                                    <span className="text-[10px] text-muted">{new Date(c.createdAt || c.timestamp).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-sm text-main">{c.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })}
                    {filteredTasks.every((t) => !(taskComments[t._id]?.length)) && (
                      <EmptyState title="No comments yet" hint="Open a task to add comments." />
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "activity" && (
              <div className="rounded-xl border border-border-subtle bg-surface p-4">
                <PanelHead title="Project Activity" subtitle="Changes and discussions across this project" />
                {projectActivitiesLoading ? (
                  <div className="py-10"><Loader text="Loading activity..." size="md" /></div>
                ) : projectActivities?.length ? (
                  <div className="divide-y divide-border-subtle">
                    {projectActivities.map((activity) => (
                      <div key={activity._id} className="flex items-start gap-3 py-3">
                        <div className="w-8 h-8 rounded-full bg-amber-50 border border-border-accent flex items-center justify-center shrink-0">
                          <span className="text-xs font-black text-brand-text">{activity.user?.name?.[0] || "U"}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-main">{activity.action}</p>
                          <p className="text-[10px] uppercase tracking-widest text-muted mt-1">
                            {activity.user?.name || "User"} · {formatDate(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No project activity yet" hint="Updates, comments, and task changes will appear here." />
                )}
              </div>
            )}
          </div>
        </section>

        {showComments && (
          <TaskCommentsDrawer
            task={showComments}
            comments={taskComments[showComments?._id] || []}
            onClose={() => setShowComments(null)}
            onAddComment={(content) => handleAddComment(showComments._id, content)}
            currentUserId={currentUserId}
          />
        )}

        {showTaskDetail && (
          <TaskDetailDrawer
            task={showTaskDetail}
            onClose={() => setShowTaskDetail(null)}
            onStatusChange={(status) => handleUpdateStatus(showTaskDetail._id, status)}
            onAddComment={(content) => handleAddComment(showTaskDetail._id, content)}
            comments={taskComments[showTaskDetail._id] || []}
            currentUserId={currentUserId}
            projectTasks={tasks}
            onTaskUpdate={(updates) => handleUpdateTask(showTaskDetail._id, updates)}
          />
        )}

        {/* Modals */}
        <GlassModal
          isOpen={showAddTask}
          onClose={() => setShowAddTask(false)}
          title="New Task"
          description="Create a task in this project"
          maxWidth="max-w-2xl"
        >
          <AddTaskForm projectId={id} project={project} onSubmit={handleCreateTask} onClose={() => setShowAddTask(false)} />
        </GlassModal>

        <GlassModal
          isOpen={showEditProject}
          onClose={() => setShowEditProject(false)}
          title="Edit Project"
          description="Update project details"
          maxWidth="max-w-2xl"
        >
          <EditProjectForm project={project} onSubmit={handleEditProject} onClose={() => setShowEditProject(false)} />
        </GlassModal>
      </div>
    </PageContainer>
  );
};

export default ProjectDetail;
