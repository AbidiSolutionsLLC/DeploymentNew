import React, { useState, useEffect } from "react";
import usePermission from "../../hooks/usePermission";
import { useSelector } from "react-redux";
import { FaDownload } from "react-icons/fa";
import GlassModal from "../ui/GlassModal";
import GlassButton from "../ui/GlassButton";
import ModernSelect from "../ui/ModernSelect";
import ModernDatePicker from "../ui/ModernDatePicker";
import { TablePriority, TableStatus } from "../ui/TableCells";
import Progress from "./Progress";
import { formatDate, isOverdue, taskProgress, getAssigneeName } from "./helpers";
import TaskComments from "./TaskComments";
import { downloadFile } from "../../utils/downloadFile";
import taskApi from "../../api/taskApi";

const STATUS_OPTIONS = ["Backlog", "Todo", "In Progress", "In Review", "Done"];
const PRIORITY_OPTIONS = ["Low", "Medium", "High"];
const STATUS_DISPLAY = {
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

export default function TaskDetailDrawer({
  task,
  onClose,
  onStatusChange,
  onAddComment,
  onAddcomment,
  onDeleteComment,
  onDeletecomment,
  comments = [],
  projectTasks = [],
  onTaskUpdate,
  currentUserId,
  canManageTasks = true,
}) {
  const { userInfo } = useSelector((state) => state.user || {});
  const authStateUser = useSelector((state) => state.auth.user);
  const authUser = authStateUser?.data?.user || authStateUser?.user || authStateUser || null;
  const { isProjectAdmin, isProjectManager, isProjectEmployee, projectRole } = usePermission();
  const isSuperAdmin = projectRole === 'superadmin';
  const isAdmin = isProjectAdmin;
  const hasFullTaskControl = isProjectAdmin || isProjectManager || canManageTasks;

  const effectiveUserId = (currentUserId || authUser?._id || authUser?.id)?.toString();
  const isAssignee = task?.team && task.team.some(m => (m?._id || m)?.toString() === effectiveUserId);
  const canChangeStatus = hasFullTaskControl || isAssignee;
  const [status, setStatus] = useState(task?.status || "Backlog");
  const [priority, setPriority] = useState(task?.priority || "Medium");
  const [completionPercent, setCompletionPercent] = useState(task?.completionPercent || 0);
  const [duration, setDuration] = useState(task?.duration ?? "");
  const [workedHours, setWorkedHours] = useState(task?.workedHours ?? "");
  const [dependencies, setDependencies] = useState(
    (task?.dependencies || []).map((dependency) => dependency._id || dependency)
  );
  const [savingDetails, setSavingDetails] = useState(false);

  // Project-filtered dependencies state
  const currentProjectId = (task?.project?._id || task?.project)?.toString();
  const [loadedProjectTasks, setLoadedProjectTasks] = useState([]);
  const [loadingProjectTasks, setLoadingProjectTasks] = useState(false);
  const [depSearch, setDepSearch] = useState("");

  useEffect(() => {
    setStatus(task?.status || "Backlog");
    setPriority(task?.priority || "Medium");
    setCompletionPercent(task?.completionPercent || 0);
    setDuration(task?.duration ?? "");
    setWorkedHours(task?.workedHours ?? "");
    setDependencies(
      (task?.dependencies || []).map((dependency) => dependency._id || dependency)
    );
    setDepSearch("");
  }, [task]);

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
      if (hasFullTaskControl) {
        payload.priority = priority;
        payload.duration = duration === "" ? null : Number(duration);
        payload.dependencies = dependencies.map((d) => (d?._id || d)?.toString());
      }
      await onTaskUpdate(payload);
    } finally {
      setSavingDetails(false);
    }
  };

  const overdue = isOverdue(task?.dueDate, task?.status);
  const pct = taskProgress(task);

  // Strictly filter candidates to only tasks in the same project, excluding the current task
  const currentTaskId = (task?._id || task?.id)?.toString();
  const sourceList = loadedProjectTasks.length > 0 ? loadedProjectTasks : (projectTasks || []);
  const allCandidates = sourceList.filter((candidate) => {
    const candId = (candidate?._id || candidate?.id)?.toString();
    if (!candId || candId === currentTaskId) return false;

    if (currentProjectId) {
      const candProjectId = (candidate?.project?._id || candidate?.project)?.toString();
      if (candProjectId && candProjectId !== currentProjectId) {
        return false;
      }
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

  return (
    <GlassModal
      isOpen={!!task}
      onClose={onClose}
      title={task?.title}
      description={`Task · ${STATUS_DISPLAY[task?.status] || task?.status}`}
      maxWidth="max-w-2xl"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <GlassButton variant="secondary" onClick={onClose} disabled={savingDetails}>
            Close
          </GlassButton>
          <GlassButton
            variant="primary"
            onClick={saveDetails}
            isLoading={savingDetails}
            disabled={savingDetails}
          >
            Save details
          </GlassButton>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Task header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black text-heading">{task?.title}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-2">
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
                  options={STATUS_OPTIONS.map((s) => ({ value: s, label: STATUS_DISPLAY[s] }))}
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

          <div className="flex flex-wrap gap-4 text-xs text-muted">
            {task?.dueDate && (
              <span className={`flex items-center gap-1 ${overdue ? "text-danger" : ""}`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Due {formatDate(task.dueDate)}
                {overdue && <span className="text-danger">(Overdue)</span>}
              </span>
            )}
            {(() => {
              const assigneeName = getAssigneeName(task);
              if (assigneeName === "—") return null;
              return (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {assigneeName}
                </span>
              );
            })()}
            <span className="flex items-center gap-1">
              <Progress value={pct} style={{ width: "60px" }} />
              <span className="font-bold tabular-nums">{pct}%</span>
            </span>
          </div>
        </div>

        {/* Description */}
        {task?.description && (
          <div className="border-t border-border-subtle pt-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-muted mb-2">Description</h4>
            <p className="text-sm text-main whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

        {/* Delivery details (Editable) */}
        <div className="border-t border-border-subtle pt-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-muted mb-3">Delivery details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="text-xs text-muted">
              Completion %
              <input
                type="number"
                min="0"
                max="100"
                value={completionPercent}
                onChange={(e) => setCompletionPercent(e.target.value)}
                className="glass-input mt-1"
              />
            </label>
            <label className="text-xs text-muted">
              Estimated hours {!hasFullTaskControl && <span className="text-[10px] text-muted">(Manager only)</span>}
              <input
                type="number"
                min="0"
                step="0.25"
                value={duration}
                disabled={!hasFullTaskControl}
                onChange={(e) => setDuration(e.target.value)}
                className="glass-input mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </label>
            <label className="text-xs text-muted">
              Worked hours
              <input
                type="number"
                min="0"
                step="0.25"
                value={workedHours}
                onChange={(e) => setWorkedHours(e.target.value)}
                className="glass-input mt-1"
              />
            </label>
          </div>

          {/* Dependencies Section with custom scroll and same-project filter */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-muted flex items-center gap-1.5 font-medium">
                <span>Dependencies</span>
                {selectedDepIds.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand/10 text-brand-text border border-brand/20">
                    {selectedDepIds.length} selected
                  </span>
                )}
                {!hasFullTaskControl && (
                  <span className="text-[10px] text-muted">(Manager only)</span>
                )}
              </label>
            </div>

            <div className="rounded-xl border border-border-subtle bg-surface/50 p-2.5">
              {allCandidates.length > 4 && (
                <input
                  type="text"
                  placeholder="Filter tasks in this project..."
                  value={depSearch}
                  disabled={!hasFullTaskControl}
                  onChange={(e) => setDepSearch(e.target.value)}
                  className="glass-input text-xs py-1.5 px-2.5 mb-2 w-full"
                />
              )}

              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar-visible">
                {loadingProjectTasks ? (
                  <p className="text-xs text-muted text-center py-4">Loading project tasks...</p>
                ) : filteredCandidates.length === 0 ? (
                  <p className="text-xs text-muted text-center py-4">
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
                        className={`flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg border text-xs transition-all select-none ${
                          hasFullTaskControl ? "cursor-pointer" : "cursor-not-allowed opacity-60"
                        } ${
                          isSelected
                            ? "bg-brand/10 border-brand/40 text-heading shadow-sm"
                            : "bg-card border-border-subtle hover:border-border-accent/60 text-main"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={!hasFullTaskControl}
                            onChange={() => toggleDependency(candidateId)}
                            className="rounded text-brand focus:ring-brand h-3.5 w-3.5 shrink-0"
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
        </div>

        {/* Task Attachments (Downloadable) */}
        {task?.attachments?.length > 0 && (
          <div className="border-t border-border-subtle pt-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-muted mb-3">
              Task Attachments ({task.attachments.length})
            </h4>
            <div className="flex flex-col gap-2">
              {task.attachments.map((attachment, index) => {
                const fileName = attachment.originalname || attachment.name || `Attachment ${index + 1}`;
                const fileSource = attachment.blobName || attachment.url;

                return (
                  <div
                    key={attachment.public_id || attachment.blobName || index}
                    className="flex items-center justify-between gap-3 rounded-lg bg-card border border-border-subtle px-3 py-2 hover:border-border-accent"
                  >
                    <span className="text-sm text-heading truncate">{fileName}</span>
                    <button
                      type="button"
                      onClick={() => downloadFile(fileSource, fileName)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-text hover:text-brand transition-colors shrink-0"
                      title={`Download ${fileName}`}
                    >
                      <FaDownload size={11} />
                      <span>Download</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Enhanced Task Comments Section */}
        <div className="border-t border-border-subtle pt-4">
          <TaskComments
            taskId={task?._id || task?.id}
            comments={comments}
            onAddComment={onAddComment || onAddcomment}
            onDeleteComment={onDeleteComment || onDeletecomment}
            currentUserId={currentUserId}
          />
        </div>
      </div>
    </GlassModal>
  );
}
