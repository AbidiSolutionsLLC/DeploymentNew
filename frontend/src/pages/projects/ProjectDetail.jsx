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
} from "@heroicons/react/24/outline";
import { fetchProjectById } from "../../store/projectSlice";
import { fetchProjectTasks, createTask, updateTaskStatus, addTaskComment } from "../../store/taskSlice";
import projectApi from "../../api/projectApi";
import Loader from "../../components/ui/Loader";
import GlassModal from "../../components/ui/GlassModal";
import GlassButton from "../../components/ui/GlassButton";
import ModernSelect from "../../components/ui/ModernSelect";
import ModernDatePicker from "../../components/ui/ModernDatePicker";
import Pill, { PROJECT_STATUS_TONE, TASK_STATUS_TONE, PRIORITY_TONE } from "../../components/projectPortal/Pill";
import Progress from "../../components/projectPortal/Progress";
import PanelHead from "../../components/projectPortal/PanelHead";
import EmptyState from "../../components/projectPortal/EmptyState";
import { formatDate, shortDate, isOverdue, projectProgress, taskProgress, personName } from "../../components/projectPortal/helpers";
import AddTaskForm from "../../components/projectPortal/AddTaskForm";
import EditProjectForm from "../../components/projectPortal/EditProjectForm";
import TaskDetailDrawer from "../../components/projectPortal/TaskDetailDrawer";
import TaskCommentsDrawer from "../../components/projectPortal/TaskCommentsDrawer";
import TaskCard from "../../components/projectPortal/TaskCard";

const KANBAN_COLUMNS = [
  { id: "backlog", title: "Backlog" },
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "in-review", title: "In Review" },
  { id: "done", title: "Done" },
];
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
  const { projects, currentProject } = useSelector((state) => state.projects);
  const { projectTasks, projectTasksLoading, taskComments } = useSelector((state) => state.tasks);
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

  useEffect(() => {
    if (id) {
      dispatch(fetchProjectById(id));
      dispatch(fetchProjectTasks(id));
    }
  }, [id, dispatch]);

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

  const handleDeleteProject = () => {
    if (!project) return;
    if (window.confirm(`Delete "${project.title}"? This cannot be undone.`)) {
      dispatch(projectApi.deleteProject(project._id))
        .unwrap()
        .then(() => {
          toast.success("Project deleted");
          navigate("/project/projects");
        })
        .catch((err) => toast.error(err?.message || "Failed to delete"));
    }
  };

  const handleEditProject = async (updates) => {
    try {
      await dispatch(projectApi.updateProject(project._id, updates)).unwrap();
      toast.success("Project updated");
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

  return (
    <div className="flex flex-col gap-4">
      {/* Header card */}
      <div className="glass-card flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap mb-3">
            <button
              onClick={() => navigate("/project/projects")}
              className="p-2 rounded-lg text-muted hover:text-heading hover:bg-card-hover transition-colors"
              aria-label="Back to projects"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <h1 className="text-lg sm:text-xl font-black text-heading uppercase tracking-tight truncate">{project.title}</h1>
            <Pill tone={PROJECT_STATUS_TONE[project.status] || "neutral"}>{project.status || "Planning"}</Pill>
          </div>
          <p className="text-sm text-main mb-4 line-clamp-2">{project.description || "No description provided."}</p>
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-medium uppercase tracking-widest text-muted">
            <span className="flex items-center gap-1.5"><CalendarDaysIcon className="w-3.5 h-3.5" /> Due {shortDate(project.dueDate)}</span>
            <span className="flex items-center gap-1.5"><FlagIcon className="w-3.5 h-3.5" /> Priority: {project.priority || "Medium"}</span>
            <span className="flex items-center gap-1.5"><UsersIcon className="w-3.5 h-3.5" /> {team.length} member{team.length !== 1 ? "s" : ""}</span>
            <span className="flex items-center gap-1.5"><ClockIcon className="w-3.5 h-3.5" /> {pct}% complete</span>
          </div>
          <Progress value={pct} className="mt-2 max-w-xs" />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            onClick={() => setShowEditProject(true)}
            className="btn btn-secondary py-2 px-4 whitespace-nowrap"
          >
            <PencilIcon className="w-4 h-4 mr-2" /> Edit
          </button>
          <button
            onClick={handleDeleteProject}
            className="btn btn-secondary py-2 px-4 whitespace-nowrap text-danger hover:bg-danger-bg"
          >
            <TrashIcon className="w-4 h-4 mr-2" /> Delete
          </button>
        </div>
      </div>

      {/* Tabs toolbar */}
      <div className="glass-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex space-x-1 rounded-lg p-1 bg-card w-full lg:w-auto overflow-x-auto">
            {["board", "list", "comments"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 rounded-md text-[10px] font-black uppercase tracking-widest whitespace-nowrap flex-shrink-0 transition-colors ${
                  activeTab === tab
                    ? "bg-brand text-on-brand shadow-[0_4px_15px_rgba(212,175,55,0.3)]"
                    : "text-muted hover:text-brand-text hover:bg-card-hover"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64">
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
      </div>

      {/* Tab content */}
      <div className="flex flex-col gap-4">
        {activeTab === "board" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
            {KANBAN_COLUMNS.map((col) => (
              <div key={col.id} className="glass-card rounded-xl p-3 sm:p-4 border border-border-subtle shadow-sm flex flex-col min-h-[400px]">
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <h3 className="font-semibold text-sm sm:text-base truncate text-heading">{col.title}</h3>
                  <span className="text-xs px-2 py-1 rounded-full flex-shrink-0 ml-2 bg-card text-muted tabular-nums">
                    {getTasksByStatus(col.id).length}
                  </span>
                </div>
                <div className="min-h-[300px] flex-1 space-y-2 overflow-y-auto custom-scrollbar-visible">
                  {getTasksByStatus(col.id).map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onClick={() => setShowTaskDetail(task)}
                      onStatusChange={(newStatus) => handleUpdateStatus(task._id, newStatus)}
                      onOpenComments={() => setShowComments(task)}
                    />
                  ))}
                  {getTasksByStatus(col.id).length === 0 && (
                    <div className="flex items-center justify-center h-32 text-sm rounded-lg border-2 border-dashed border-border-subtle text-muted">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "list" && (
          <div className="glass-card !p-0 overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center py-16"><Loader text="Loading tasks..." size="md" /></div>
            ) : filteredTasks.length === 0 ? (
              <EmptyState title={tasks.length === 0 ? "No tasks in this project" : "No matching tasks"} hint="Try a different search." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left align-middle">
                  <thead>
                    <tr className="bg-card text-[10px] font-black uppercase tracking-widest text-muted">
                      <th className="px-4 py-3">Task</th>
                      <th className="px-4 py-3 hidden md:table-cell">Status</th>
                      <th className="px-4 py-3 hidden lg:table-cell">Assignee</th>
                      <th className="px-4 py-3 hidden md:table-cell">Due</th>
                      <th className="px-4 py-3 hidden lg:table-cell">Priority</th>
                      <th className="px-4 py-3 hidden xl:table-cell">Progress</th>
                      <th className="px-4 py-3 w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task) => (
                      <tr key={task._id} onClick={() => setShowTaskDetail(task)} className="border-t border-border-subtle hover:bg-amber-50 transition-colors cursor-pointer">
                        <td className="px-4 py-3 max-w-[240px]">
                          <p className="text-sm font-semibold text-heading truncate">{task.title}</p>
                          <p className="text-[11px] text-muted truncate">{task.description || "—"}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <Pill tone={TASK_STATUS_TONE[task.status] || "neutral"}>{STATUS_DISPLAY[task.status] || task.status}</Pill>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-sm text-main whitespace-nowrap">{personName(task.assignee)}</td>
                        <td className="px-4 py-3 hidden md:table-cell text-xs text-muted whitespace-nowrap">
                          {formatDate(task.dueDate)}
                          {isOverdue(task.dueDate, task.status) && <span className="block text-[9px] uppercase tracking-widest text-danger">Overdue</span>}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <Pill tone={PRIORITY_TONE[task.priority] || "neutral"}>{task.priority || "Medium"}</Pill>
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell min-w-[110px]">
                          <div className="flex items-center gap-2">
                            <Progress value={taskProgress(task)} />
                            <span className="text-[10px] font-bold text-muted tabular-nums shrink-0">{taskProgress(task)}%</span>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowComments(task); }}
                            className="p-2 rounded-lg text-muted hover:bg-card-hover hover:text-heading transition-colors"
                            aria-label="Comments"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "comments" && (
          <div className="glass-card">
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

        {activeTab === "comments" && filteredTasks.length > 0 && (
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
          />
        )}
      </div>

      {/* Modals */}
      <GlassModal
        isOpen={showAddTask}
        onClose={() => setShowAddTask(false)}
        title="New Task"
        description="Create a task in this project"
        maxWidth="max-w-2xl"
      >
        <AddTaskForm projectId={id} onSubmit={handleCreateTask} onClose={() => setShowAddTask(false)} />
      </GlassModal>

      <GlassModal
        isOpen={showEditProject}
        onClose={() => setShowEditProject(false)}
        title="Edit Project"
        description="Update project details"
        maxWidth="max-w-2xl"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <GlassButton variant="secondary" onClick={() => setShowEditProject(false)}>Cancel</GlassButton>
            <GlassButton variant="primary" onClick={() => {}}>Save Changes</GlassButton>
          </div>
        }
      >
        <EditProjectForm project={project} onSubmit={handleEditProject} onClose={() => setShowEditProject(false)} />
      </GlassModal>
    </div>
  );
};

export default ProjectDetail;