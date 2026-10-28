import React, { useState, useEffect, useMemo } from "react";
import usePermission from "../../hooks/usePermission";
import { useSelector } from "react-redux";
import { FaDownload } from "react-icons/fa";
import { Link2, ArrowRight, ShieldAlert, Trash2, UserPlus, Users, ChevronDown, ChevronUp, X } from "lucide-react";
import GlassModal from "../ui/GlassModal";
import GlassButton from "../ui/GlassButton";
import ModernSelect from "../ui/ModernSelect";
import ModernDatePicker from "../ui/ModernDatePicker";
import { TablePriority, TableStatus, TableAvatar } from "../ui/TableCells";
import Progress from "./Progress";
import { isOverdue, taskProgress, getTaskAssignee, getAssigneeName, getTaskAssignees, personName } from "./helpers";
import TaskComments from "./TaskComments";
import { downloadFile } from "../../utils/downloadFile";
import taskApi from "../../api/taskApi";
import projectApi from "../../api/projectApi";
import api from "../../axios";

const DEFAULT_STATUS_OPTIONS = ["Backlog", "Todo", "In Progress", "In Review", "Done"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High"];
const toDateInput = (v) => (v ? String(v).slice(0, 10) : "");
const DEFAULT_STATUS_DISPLAY = {
  Backlog: "Backlog",
  Todo: "To Do",
  "In Progress": "In Progress",
  "In Review": "In Review",
  Done: "Done",
  // Legacy support
  Blocked: "Backlog",
  backlog: "Backlog",
  todo: "To Do",
  "in-progress": "In Progress",
  "in-review": "In Review",
  done: "Done",
  blocked: "Backlog",
};

const getStatusColor = (status) => {
  const statusLower = (status || "").toLowerCase();
  switch (statusLower) {
    case "backlog": return "bg-neutral";
    case "todo": return "bg-amber-500";
    case "in progress": return "bg-info";
    case "in review": return "bg-warning";
    case "done": return "bg-success";
    default: return "bg-neutral";
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case "High": return "bg-danger";
    case "Medium": return "bg-amber-500";
    case "Low": return "bg-success";
    default: return "bg-amber-500";
  }
};

export default function TaskDetailDrawer({
  task,
  onClose,
  onStatusChange,
  onAddComment,
  onAddcomment,
  onDeleteComment,
  onDeletecomment,
  onDeleteTask,
  comments = [],
  projectTasks = [],
  onTaskUpdate,
  currentUserId,
  canManageTasks = true,
  projectStatuses = null,
}) {
  const { userInfo } = useSelector((state) => state.user || {});
  const authStateUser = useSelector((state) => state.auth.user);
  const authUser = authStateUser?.data?.user || authStateUser?.user || authStateUser || null;
  const { isProjectAdmin, isProjectManager, isProjectEmployee, projectRole } = usePermission();
  const isSuperAdmin = projectRole === 'superadmin';
  const isAdmin = isProjectAdmin;
  const hasFullTaskControl = isProjectAdmin || isProjectManager || canManageTasks;
  const STATUS_OPTIONS = projectStatuses && projectStatuses.length > 0 ? projectStatuses : DEFAULT_STATUS_OPTIONS;
  const STATUS_DISPLAY = {
    ...DEFAULT_STATUS_DISPLAY,
    ...(projectStatuses || []).reduce((acc, st) => { acc[st] = st; return acc; }, {}),
  };

  const effectiveUserId = (currentUserId || authUser?._id || authUser?.id)?.toString();
  const isAssignee = task?.team && task.team.some(m => (m?._id || m)?.toString() === effectiveUserId);
  const canChangeStatus = hasFullTaskControl || isAssignee;
  const canEditDescription = hasFullTaskControl || isAssignee;
  const canReassign = hasFullTaskControl;
  const canDeleteTask = hasFullTaskControl;

  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [status, setStatus] = useState(task?.status || "Backlog");
  const [priority, setPriority] = useState(task?.priority || "Medium");
  const [dueDate, setDueDate] = useState(toDateInput(task?.dueDate));
  const [completionPercent, setCompletionPercent] = useState(task?.completionPercent || 0);
  const [duration, setDuration] = useState(task?.duration ?? "");
  const [workedHours, setWorkedHours] = useState(task?.workedHours ?? "");
  const [dependencies, setDependencies] = useState(
    (task?.dependencies || []).map((dependency) => dependency._id || dependency)
  );
  const [selectedTeam, setSelectedTeam] = useState(
    (task?.team || []).map((m) => (m?._id || m)?.toString())
  );
  const [savingDetails, setSavingDetails] = useState(false);
  const [deletingTask, setDeletingTask] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  // Team members list for reassignment
  const [projectMembers, setProjectMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Project-filtered dependencies state
  const currentProjectId = (task?.project?._id || task?.project)?.toString();
  const [loadedProjectTasks, setLoadedProjectTasks] = useState([]);
  const [loadingProjectTasks, setLoadingProjectTasks] = useState(false);
  const [depSearch, setDepSearch] = useState("");

  useEffect(() => {
    setTitle(task?.title || "");
    setDescription(task?.description || "");
    setStatus(task?.status || "Backlog");
    setPriority(task?.priority || "Medium");
    setDueDate(toDateInput(task?.dueDate));
    setCompletionPercent(task?.completionPercent || 0);
    setDuration(task?.duration ?? "");
    setWorkedHours(task?.workedHours ?? "");
    setDependencies(
      (task?.dependencies || []).map((dependency) => dependency._id || dependency)
    );
    setSelectedTeam(
      (task?.team || []).map((m) => (m?._id || m)?.toString())
    );
    setDepSearch("");
    setShowDeleteConfirm(false);
  }, [task]);

  // Load project members for task reassignment
  useEffect(() => {
    if (!currentProjectId) {
      setProjectMembers([]);
      return;
    }

    let isMounted = true;
    setLoadingMembers(true);
    (async () => {
      try {
        const [projRes, usersRes] = await Promise.all([
          projectApi.getProjectById(currentProjectId).catch(() => null),
          api.get("/users").catch(() => null),
        ]);

        if (!isMounted) return;

        const allUsers = usersRes?.data?.data || usersRes?.data || [];
        const projectDoc = projRes;

        const members = [];
        const seen = new Set();
        const addMember = (m) => {
          if (!m) return;
          const id = (m._id || m.id || m).toString();
          if (seen.has(id)) return;
          seen.add(id);

          if (typeof m === "object" && m.name) {
            members.push(m);
          } else {
            const found = allUsers.find((u) => (u._id || u.id)?.toString() === id);
            if (found) {
              members.push(found);
            } else {
              members.push({ _id: id, name: "Team Member" });
            }
          }
        };

        if (projectDoc) {
          if (projectDoc.owner) addMember(projectDoc.owner);
          if (Array.isArray(projectDoc.team)) {
            projectDoc.team.forEach(addMember);
          }
        }

        // If no members in project, fallback to company users
        setProjectMembers(members.length > 0 ? members : allUsers);
      } catch (err) {
        console.warn("Could not load project members for task reassignment:", err);
      } finally {
        if (isMounted) setLoadingMembers(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [currentProjectId]);

  // Load tasks belonging ONLY to this specific project
  useEffect(() => {
    if (!currentProjectId) {
      setLoadedProjectTasks([]);
      return;
    }

    let isMounted = true;
    setLoadingProjectTasks(true);
    taskApi.getProjectTasks(currentProjectId)
      .then((res) => {
        if (isMounted) {
          const list = Array.isArray(res) ? res : res?.data || [];
          setLoadedProjectTasks(list);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch project tasks for dependencies:", err);
        if (isMounted) {
          const fallback = (projectTasks || []).filter(
            (c) => (c?.project?._id || c?.project)?.toString() === currentProjectId
          );
          setLoadedProjectTasks(fallback);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingProjectTasks(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentProjectId]);

  const saveDetails = async () => {
    if (!onTaskUpdate || savingDetails) return;
    setSavingDetails(true);
    try {
      const payload = {
        status,
        completionPercent: Number(completionPercent),
        workedHours: workedHours === "" ? 0 : Number(workedHours),
      };

      if (canEditDescription) {
        payload.description = description;
      }

      if (hasFullTaskControl) {
        payload.title = title.trim();
        payload.dueDate = dueDate || null;
        payload.priority = priority;
        payload.duration = duration === "" ? null : Number(duration);
        payload.dependencies = dependencies.map((d) => (d?._id || d)?.toString());
        payload.team = [...new Set((selectedTeam || []).filter(Boolean).map(String))];
      }

      await onTaskUpdate(payload);
    } finally {
      setSavingDetails(false);
    }
  };

  const handleDelete = async () => {
    if (!onDeleteTask || deletingTask) return;
    setDeletingTask(true);
    try {
      await onDeleteTask(task?._id || task?.id);
      onClose();
    } finally {
      setDeletingTask(false);
      setShowDeleteConfirm(false);
    }
  };

  const overdue = isOverdue(dueDate || task?.dueDate, status || task?.status);
  const pct = taskProgress(task);

  // Strictly filter candidates to only tasks in the same project, excluding the current task
  const currentTaskId = (task?._id || task?.id)?.toString();
  const sourceList = loadedProjectTasks.length > 0 ? loadedProjectTasks : (projectTasks || []);

  // Tasks that depend on currentTask (tasks which have currentTask in their dependencies list)
  const dependentOnMeTasks = sourceList.filter((otherTask) => {
    const otherId = (otherTask?._id || otherTask?.id)?.toString();
    if (!otherId || otherId === currentTaskId) return false;
    const otherDeps = (otherTask?.dependencies || []).map((d) => (d?._id || d)?.toString());
    return otherDeps.includes(currentTaskId);
  });

  // Cycle prevention: build map of dependency relations to avoid indirect or direct loops
  const causesLoop = (candidateIdStr) => {
    if (!candidateIdStr || !currentTaskId) return false;
    if (candidateIdStr === currentTaskId) return true;

    // BFS search to see if candidateIdStr leads to currentTaskId through its dependencies
    const visited = new Set();
    const queue = [candidateIdStr];

    while (queue.length > 0) {
      const checkId = queue.shift();
      if (checkId === currentTaskId) return true;
      if (visited.has(checkId)) continue;
      visited.add(checkId);

      const foundNode = sourceList.find((t) => (t?._id || t?.id)?.toString() === checkId);
      if (foundNode && Array.isArray(foundNode.dependencies)) {
        for (const parentDep of foundNode.dependencies) {
          const pId = (parentDep?._id || parentDep)?.toString();
          if (pId && !visited.has(pId)) {
            queue.push(pId);
          }
        }
      }
    }
    return false;
  };

  const allCandidates = sourceList.filter((candidate) => {
    const candId = (candidate?._id || candidate?.id)?.toString();
    if (!candId || candId === currentTaskId) return false;

    if (currentProjectId) {
      const candProjectId = (candidate?.project?._id || candidate?.project)?.toString();
      if (candProjectId && candProjectId !== currentProjectId) {
        return false;
      }
    }

    // Exclude tasks that would create a circular dependency loop!
    if (causesLoop(candId)) {
      return false;
    }

    return true;
  });

  const filteredCandidates = allCandidates.filter((candidate) => {
    if (!depSearch.trim()) return true;
    return (candidate.title || "").toLowerCase().includes(depSearch.trim().toLowerCase());
  });

  const selectedDepIds = (dependencies || []).map((dep) => (dep?._id || dep)?.toString());

  const toggleDependency = (depId) => {
    if (!hasFullTaskControl) return;
    const idStr = (depId?._id || depId)?.toString();
    setDependencies((prev) => {
      const prevIds = (prev || []).map((d) => (d?._id || d)?.toString());
      if (prevIds.includes(idStr)) {
        return prev.filter((d) => (d?._id || d)?.toString() !== idStr);
      }
      return [...prev, depId];
    });
  };

  const statusColor = getStatusColor(status);
  const priorityColor = getPriorityColor(priority);

  const tabs = [
    { id: "details", label: "Details", icon: null },
    { id: "schedule", label: "Schedule", icon: null },
    { id: "dependencies", label: "Dependencies", icon: null },
    { id: "attachments", label: "Attachments", icon: task?.attachments?.length ? task.attachments.length : null },
    { id: "comments", label: "Comments", icon: comments.length > 0 ? comments.length : null },
  ];

  return (
    <GlassModal
      isOpen={!!task}
      onClose={onClose}
      title={task?.title}
      description={`Task · ${STATUS_DISPLAY[task?.status] || task?.status}`}
      maxWidth="max-w-4xl"
      footer={
        <div className="flex items-center justify-between gap-2.5 w-full">
          <div>
            {canDeleteTask && (
              <GlassButton
                variant="danger"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={savingDetails || deletingTask}
                className="!text-xs gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Task</span>
              </GlassButton>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <GlassButton variant="secondary" onClick={onClose} disabled={savingDetails || deletingTask}>
              Close
            </GlassButton>
            <GlassButton
              variant="primary"
              onClick={saveDetails}
              isLoading={savingDetails}
              disabled={savingDetails || deletingTask}
            >
              Save details
            </GlassButton>
          </div>
        </div>
      }
    >
      <div className="flex flex-col h-full">
        {/* Delete Confirmation Warning */}
        {showDeleteConfirm && (
          <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-danger space-y-2 mb-4">
            <div className="flex items-center gap-2 font-bold text-sm">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
              <span>Are you sure you want to delete this task?</span>
            </div>
            <p className="text-xs text-muted">
              This will permanently delete the task and its logged comments/attachments. This action cannot be undone.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <GlassButton
                variant="danger"
                size="sm"
                isLoading={deletingTask}
                onClick={handleDelete}
              >
                Yes, Delete
              </GlassButton>
              <GlassButton
                variant="secondary"
                size="sm"
                disabled={deletingTask}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </GlassButton>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-border-subtle mb-4 px-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-surface border-border-accent text-heading shadow-sm"
                  : "text-muted hover:text-heading hover:bg-card-hover"
              }`}
            >
              {tab.label}
              {tab.icon !== null && tab.icon !== undefined && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-brand/10 text-brand-text border border-brand/20">
                  {tab.icon}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar-visible pr-1">
          {/* Details Tab */}
          {activeTab === "details" && (
            <div className="space-y-6">
              {/* Task Header & Title */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    {hasFullTaskControl ? (
                      <div>
                        <label className="block text-[10px] font-black text-muted mb-1.5 uppercase tracking-widest">
                          Task Title
                        </label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Task Title"
                          className="glass-input w-full text-base font-bold text-heading px-4 py-2.5 rounded-xl"
                        />
                      </div>
                    ) : (
                      <h3 className="text-xl font-bold text-heading">{task?.title}</h3>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <TableStatus value={STATUS_DISPLAY[status] || status} />
                    <TablePriority value={priority} />
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                  <div className="w-36">
                    <ModernSelect
                      value={status}
                      disabled={!canChangeStatus}
                      onChange={(e) => setStatus(e.target.value)}
                      options={STATUS_OPTIONS.map((s) => ({ value: s, label: STATUS_DISPLAY[s] || s }))}
                      placeholder="Select Status"
                    />
                  </div>
                  <div className="w-32">
                    <ModernSelect
                      value={priority}
                      disabled={!hasFullTaskControl}
                      onChange={(e) => setPriority(e.target.value)}
                      options={PRIORITY_OPTIONS.map((p) => ({ value: p, label: p }))}
                      placeholder="Select Priority"
                    />
                  </div>
                </div>
              </div>

              {/* Assignee / Multiple Assignees Section */}
              <div className="p-4 rounded-xl bg-card border border-border-subtle">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-black uppercase tracking-widest text-muted flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-brand" />
                    <span>Assigned Team Members ({selectedTeam.length})</span>
                  </label>
                  <span className="text-[10px] text-muted">
                    {hasFullTaskControl ? "Assign 1, 2, or multiple project contributors" : "(Read only)"}
                  </span>
                </div>

                {/* Current Assignees Pill Display */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {selectedTeam.length > 0 ? (
                    selectedTeam.map((memberId) => {
                      const member =
                        projectMembers.find((m) => (m._id || m.id)?.toString() === memberId?.toString()) ||
                        (task?.team || []).find((m) => (m?._id || m)?.toString() === memberId?.toString()) ||
                        { _id: memberId, name: "Team Member" };
                      const name = personName(member);

                      return (
                        <div
                          key={memberId}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-border-accent text-heading text-xs font-semibold shadow-sm"
                        >
                          <TableAvatar name={name} src={member?.avatar} size="xs" />
                          <span>{name}</span>
                          {hasFullTaskControl && (
                            <button
                              type="button"
                              onClick={() => setSelectedTeam((prev) => prev.filter((id) => id !== memberId))}
                              className="ml-1 p-0.5 rounded-full hover:bg-danger-bg text-muted hover:text-danger transition-colors"
                              title={`Remove ${name}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <span className="text-xs text-muted italic">No team members assigned</span>
                  )}
                </div>

                {/* Add / Reassign Control (only for managers/admins) */}
                {hasFullTaskControl && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2 border-t border-border-subtle">
                    <div className="w-full sm:w-80">
                      <ModernSelect
                        value=""
                        disabled={loadingMembers}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val && !selectedTeam.includes(val)) {
                            setSelectedTeam((prev) => [...prev, val]);
                          }
                        }}
                        options={[
                          {
                            value: "",
                            label: loadingMembers
                              ? "Loading members..."
                              : selectedTeam.length === 0
                              ? "Select Assignee..."
                              : selectedTeam.length === 1
                              ? "Add 2nd Assignee..."
                              : "Add Another Assignee...",
                          },
                          ...projectMembers
                            .filter((m) => !selectedTeam.includes((m._id || m.id)?.toString()))
                            .map((m) => ({
                              value: (m._id || m.id).toString(),
                              label: m.name ? `${m.name}${m.email ? ` (${m.email})` : ""}` : m.email || "Member",
                            })),
                        ]}
                        placeholder={
                          selectedTeam.length === 0
                            ? "Assign member..."
                            : selectedTeam.length === 1
                            ? "Add 2nd assignee..."
                            : "Add another assignee..."
                        }
                      />
                    </div>
                    {selectedTeam.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedTeam([])}
                        className="text-xs text-muted hover:text-danger px-2.5 py-1.5 rounded-lg hover:bg-card transition-colors self-start sm:self-center"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Description Section */}
              <div className="p-4 rounded-xl bg-card border border-border-subtle">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-muted">Description</h4>
                  {!canEditDescription && (
                    <span className="text-[10px] text-muted">(Read only)</span>
                  )}
                </div>
                {canEditDescription ? (
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add or update task description, notes, or requirements..."
                    className="glass-input w-full p-4 rounded-xl text-sm leading-relaxed text-main focus:ring-1 focus:ring-brand resize-y min-h-[100px]"
                  />
                ) : (
                  <p className="text-sm text-main whitespace-pre-wrap">{task?.description || "No description provided."}</p>
                )}
              </div>

              {/* Attachments Preview in Details Tab */}
              {task?.attachments?.length > 0 && (
                <div className="p-4 rounded-xl bg-card border border-border-subtle">
                  <h4 className="text-xs font-black uppercase tracking-widest text-muted mb-3 flex items-center gap-2">
                    <FaDownload className="w-4 h-4" />
                    Task Attachments ({task.attachments.length})
                  </h4>
                  <div className="flex flex-col gap-2">
                    {task.attachments.map((attachment, index) => {
                      const fileName = attachment.originalname || attachment.name || `Attachment ${index + 1}`;
                      const fileSource = attachment.blobName || attachment.url;

                      return (
                        <div
                          key={attachment.public_id || attachment.blobName || index}
                          className="flex items-center justify-between gap-3 rounded-lg bg-surface border border-border-subtle px-3 py-2.5 hover:border-border-accent transition-colors"
                        >
                          <span className="text-sm text-heading truncate flex-1">{fileName}</span>
                          <button
                            type="button"
                            onClick={() => downloadFile(fileSource, fileName)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-text hover:text-brand transition-colors shrink-0 px-3 py-1.5 rounded-lg bg-brand/5 hover:bg-brand/10"
                            title={`Download ${fileName}`}
                          >
                            <FaDownload size={12} />
                            <span>Download</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === "schedule" && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-card border border-border-subtle">
                <h4 className="text-xs font-black uppercase tracking-widest text-muted mb-4">Delivery Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <ModernDatePicker
                      label="Due Date"
                      name="dueDate"
                      value={dueDate}
                      disabled={!hasFullTaskControl}
                      onChange={(e) => setDueDate(e.target.value)}
                      placeholder="Select Due Date"
                      inputClassName="h-11"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-muted mb-2 uppercase tracking-widest truncate">
                      Completion %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={completionPercent}
                      onChange={(e) => setCompletionPercent(e.target.value)}
                      className="glass-input h-11 !py-0 px-4 rounded-xl text-sm font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-muted mb-2 uppercase tracking-widest truncate" title={hasFullTaskControl ? "Estimated hours" : "Estimated hours (Manager only)"}>
                      Est. Hours {!hasFullTaskControl && <span className="text-[9px] font-normal lowercase text-muted">(mgr)</span>}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      value={duration}
                      disabled={!hasFullTaskControl}
                      onChange={(e) => setDuration(e.target.value)}
                      className="glass-input h-11 !py-0 px-4 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-muted mb-2 uppercase tracking-widest truncate">
                      Worked Hours
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      value={workedHours}
                      onChange={(e) => setWorkedHours(e.target.value)}
                      className="glass-input h-11 !py-0 px-4 rounded-xl text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Tasks Depending On This Task */}
              {dependentOnMeTasks.length > 0 && (
                <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                  <div className="flex items-center gap-2 mb-3 text-amber-500">
                    <ShieldAlert className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-bold">
                      {dependentOnMeTasks.length} {dependentOnMeTasks.length === 1 ? "task depends" : "tasks depend"} on this task:
                    </span>
                  </div>
                  <div className="space-y-2">
                    {dependentOnMeTasks.map((depTask) => {
                      const depTaskId = depTask._id || depTask.id;
                      return (
                        <div
                          key={depTaskId}
                          className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-surface/60 border border-amber-500/15 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <ArrowRight className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            <span className="font-semibold text-heading truncate">{depTask.title}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <TableStatus value={depTask.status || "Backlog"} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-muted mt-3">
                    Note: These tasks cannot be selected as dependencies to prevent circular dependency loops.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Dependencies Tab */}
          {activeTab === "dependencies" && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-card border border-border-subtle">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-xs text-muted flex items-center gap-1.5 font-medium">
                    <Link2 className="h-4 w-4 text-brand" />
                    <span>Prerequisite Dependencies (Must be completed first)</span>
                    {selectedDepIds.length > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand/10 text-brand-text border border-brand/20">
                        {selectedDepIds.length} selected
                      </span>
                    )}
                    {!hasFullTaskControl && (
                      <span className="text-[10px] text-muted">(Manager only)</span>
                    )}
                  </label>
                </div>

                <div className="rounded-xl border border-border-subtle bg-surface/50 p-3">
                  {allCandidates.length > 4 && (
                    <input
                      type="text"
                      placeholder="Filter tasks in this project..."
                      value={depSearch}
                      disabled={!hasFullTaskControl}
                      onChange={(e) => setDepSearch(e.target.value)}
                      className="glass-input text-xs py-2 px-3 mb-3 w-full"
                    />
                  )}

                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar-visible">
                    {loadingProjectTasks ? (
                      <p className="text-xs text-muted text-center py-6">Loading project tasks...</p>
                    ) : filteredCandidates.length === 0 ? (
                      <p className="text-xs text-muted text-center py-6">
                        {allCandidates.length === 0
                          ? "No other tasks in this project"
                          : `No tasks matching "${depSearch}"`}
                      </p>
                    ) : (
                      filteredCandidates.map((candidate) => {
                        const candidateId = candidate._id || candidate.id;
                        const isSelected = selectedDepIds.includes(candidateId.toString());

                        return (
                          <div
                            key={candidateId}
                            onClick={() => hasFullTaskControl && toggleDependency(candidateId)}
                            className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border text-xs transition-all select-none ${
                              hasFullTaskControl ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                            } ${
                              isSelected
                                ? "bg-brand/10 border-brand/40 text-heading shadow-sm"
                                : "bg-card border-border-subtle hover:border-border-accent/60 text-main"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={!hasFullTaskControl}
                                onChange={() => toggleDependency(candidateId)}
                                className="rounded text-brand focus:ring-brand h-4 w-4 shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="font-medium truncate text-xs text-heading" title={candidate.title}>
                                {candidate.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <TablePriority value={candidate.priority || "Medium"} />
                              <TableStatus value={candidate.status || "Backlog"} />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Selected Dependencies Summary */}
              {selectedDepIds.length > 0 && (
                <div className="p-4 rounded-xl bg-brand/5 border border-brand/20">
                  <h5 className="text-xs font-bold text-brand-text mb-3 flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5" />
                    Selected Dependencies ({selectedDepIds.length})
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {sourceList
                      .filter((c) => selectedDepIds.includes((c._id || c.id).toString()))
                      .map((dep) => (
                        <span
                          key={dep._id || dep.id}
                          className="px-2.5 py-1 text-xs rounded-lg bg-brand/10 border border-brand/20 text-brand-text font-medium flex items-center gap-1.5"
                        >
                          {dep.title}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDependency(dep._id || dep.id);
                            }}
                            className="hover:text-danger transition-colors"
                            aria-label="Remove dependency"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Attachments Tab */}
          {activeTab === "attachments" && (
            <div className="space-y-6">
              {task?.attachments?.length > 0 ? (
                <div className="p-4 rounded-xl bg-card border border-border-subtle">
                  <h4 className="text-xs font-black uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
                    <FaDownload className="w-4 h-4" />
                    Task Attachments ({task.attachments.length})
                  </h4>
                  <div className="flex flex-col gap-3">
                    {task.attachments.map((attachment, index) => {
                      const fileName = attachment.originalname || attachment.name || `Attachment ${index + 1}`;
                      const fileSource = attachment.blobName || attachment.url;

                      return (
                        <div
                          key={attachment.public_id || attachment.blobName || index}
                          className="flex items-center justify-between gap-4 rounded-lg bg-surface border border-border-subtle p-3 hover:border-border-accent transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="p-2 rounded-lg bg-brand/10 text-brand">
                              <FaDownload className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-heading truncate">{fileName}</p>
                              <p className="text-xs text-muted">Attachment</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => downloadFile(fileSource, fileName)}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-brand-text hover:text-brand transition-colors shrink-0 px-4 py-2 rounded-lg bg-brand/5 hover:bg-brand/10"
                            title={`Download ${fileName}`}
                          >
                            <FaDownload size={13} />
                            <span>Download</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-xl bg-card border border-border-subtle text-center">
                  <FaDownload className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
                  <h4 className="text-sm font-medium text-heading mb-1">No Attachments</h4>
                  <p className="text-xs text-muted">Upload files to this task to see them here.</p>
                </div>
              )}
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === "comments" && (
            <TaskComments
              taskId={task?._id || task?.id}
              comments={comments}
              onAddComment={onAddComment || onAddcomment}
              onDeleteComment={onDeleteComment || onDeletecomment}
              currentUserId={currentUserId}
              maxListHeight="max-h-[640px]"
            />
          )}
        </div>
      </div>
    </GlassModal>
  );
}