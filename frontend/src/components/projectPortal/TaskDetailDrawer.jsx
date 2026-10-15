import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import GlassModal from "../ui/GlassModal";
import GlassButton from "../ui/GlassButton";
import ModernSelect from "../ui/ModernSelect";
import ModernDatePicker from "../ui/ModernDatePicker";
import Pill, { TASK_STATUS_TONE, PRIORITY_TONE } from "./Pill";
import Progress from "./Progress";
import { formatDate, isOverdue, taskProgress, getAssigneeName } from "./helpers";

const STATUS_OPTIONS = ["Todo", "In Progress", "In Review", "Done", "Blocked"];
const STATUS_DISPLAY = {
  Todo: "To Do",
  "In Progress": "In Progress",
  "In Review": "In Review",
  Done: "Done",
  Blocked: "Blocked",
  // Legacy lowercase support
  backlog: "Backlog",
  todo: "To Do",
  "in-progress": "In Progress",
  "in-review": "In Review",
  done: "Done",
};

export default function TaskDetailDrawer({
  task,
  onClose,
  onStatusChange,
  onAddComment,
  comments = [],
  projectTasks = [],
  onTaskUpdate,
}) {
  const { userInfo } = useSelector((state) => state.user || {});
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(task?.status || "Todo");
  const [completionPercent, setCompletionPercent] = useState(task?.completionPercent || 0);
  const [duration, setDuration] = useState(task?.duration ?? "");
  const [workedHours, setWorkedHours] = useState(task?.workedHours ?? "");
  const [dependencies, setDependencies] = useState((task?.dependencies || []).map((dependency) => dependency._id || dependency));
  const [savingDetails, setSavingDetails] = useState(false);

  useEffect(() => {
    setStatus(task?.status || "Todo");
    setCompletionPercent(task?.completionPercent || 0);
    setDuration(task?.duration ?? "");
    setWorkedHours(task?.workedHours ?? "");
    setDependencies((task?.dependencies || []).map((dependency) => dependency._id || dependency));
  }, [task]);

  const saveDetails = async () => {
    if (!onTaskUpdate || savingDetails) return;
    setSavingDetails(true);
    try {
      await onTaskUpdate({
        completionPercent: Number(completionPercent),
        duration: duration === "" ? null : Number(duration),
        workedHours: workedHours === "" ? 0 : Number(workedHours),
        dependencies,
      });
    } finally {
      setSavingDetails(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment("");
    } finally {
      setSubmitting(false);
    }
  };

  const overdue = isOverdue(task?.dueDate, task?.status);
  const pct = taskProgress(task);

  return (
    <GlassModal
      isOpen={!!task}
      onClose={onClose}
      title={task?.title}
      description={`Task · ${STATUS_DISPLAY[task?.status] || task?.status}`}
      maxWidth="max-w-2xl"
      footer={
        <div className="flex justify-end gap-2 w-full">
          <GlassButton variant="secondary" onClick={onClose}>Close</GlassButton>
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
                <Pill tone={TASK_STATUS_TONE[status] || "neutral"}>{STATUS_DISPLAY[status] || status}</Pill>
                <Pill tone={PRIORITY_TONE[task?.priority] || "neutral"}>{task?.priority || "Medium"}</Pill>
              </div>
            </div>
            <ModernSelect
              value={status}
              onChange={(e) => {
                const newStatus = e.target.value;
                setStatus(newStatus);
                onStatusChange?.(newStatus);
              }}
              options={STATUS_OPTIONS.map((s) => ({ value: s, label: STATUS_DISPLAY[s] }))}
              className="w-40 shrink-0"
            />
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-muted">
            {task?.dueDate && (
              <span className={`flex items-center gap-1 ${overdue ? "text-danger" : ""}`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Due {formatDate(task.dueDate)}
                {overdue && <span className="text-danger">(Overdue)</span>}
              </span>
            )}
            {(() => {
              const assigneeName = getAssigneeName(task);
              if (assigneeName === "—") return null;
              return (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
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

        <div className="border-t border-border-subtle pt-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-muted mb-3">Delivery details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="text-xs text-muted">
              Completion %
              <input type="number" min="0" max="100" value={completionPercent} onChange={(e) => setCompletionPercent(e.target.value)} className="glass-input mt-1" />
            </label>
            <label className="text-xs text-muted">
              Estimated hours
              <input type="number" min="0" step="0.25" value={duration} onChange={(e) => setDuration(e.target.value)} className="glass-input mt-1" />
            </label>
            <label className="text-xs text-muted">
              Worked hours
              <input type="number" min="0" step="0.25" value={workedHours} onChange={(e) => setWorkedHours(e.target.value)} className="glass-input mt-1" />
            </label>
          </div>
          <label className="block text-xs text-muted mt-3">
            Dependencies
            <select multiple value={dependencies} onChange={(e) => setDependencies(Array.from(e.target.selectedOptions, (option) => option.value))} className="glass-input mt-1 min-h-20">
              {projectTasks.filter((candidate) => candidate._id !== task?._id).map((candidate) => (
                <option key={candidate._id} value={candidate._id}>{candidate.title} · {candidate.status}</option>
              ))}
            </select>
          </label>
          <div className="flex justify-end mt-3">
            <GlassButton variant="primary" onClick={saveDetails} isLoading={savingDetails}>Save details</GlassButton>
          </div>
        </div>

        {task?.attachments?.length > 0 && (
          <div className="border-t border-border-subtle pt-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-muted mb-3">Attachments ({task.attachments.length})</h4>
            <div className="flex flex-col gap-2">
              {task.attachments.map((attachment, index) => (
                <a key={attachment.public_id || index} href={attachment.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-lg bg-card border border-border-subtle px-3 py-2 hover:border-border-accent">
                  <span className="text-sm text-heading truncate">{attachment.originalname || `Attachment ${index + 1}`}</span>
                  <span className="text-[10px] uppercase tracking-widest text-brand-text shrink-0">Open</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="border-t border-border-subtle pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-black uppercase tracking-widest text-muted">Comments ({comments?.length || 0})</h4>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar-visible mb-4">
            {comments?.map((c) => (
              <div key={c._id || c.id} className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-amber-50 border border-border-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-text font-black text-xs">{c.user?.name?.[0] || "U"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-heading">{c.user?.name || "Unknown"}</span>
                    <span className="text-[10px] text-muted">{new Date(c.createdAt || c.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-main">{c.content || c.text}</p>
                </div>
              </div>
            ))}
            {(!comments || comments.length === 0) && (
              <p className="text-xs text-muted text-center py-4">No comments yet</p>
            )}
          </div>

          <form onSubmit={handleSubmitComment} className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-amber-50 border border-border-accent flex items-center justify-center flex-shrink-0">
              <span className="text-brand-text font-black text-xs">{userInfo?.name?.[0] || userInfo?.user?.name?.[0] || "U"}</span>
            </div>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="glass-input flex-1"
                disabled={submitting}
              />
              <GlassButton variant="primary" type="submit" disabled={!newComment.trim() || submitting} isLoading={submitting}>
                Post
              </GlassButton>
            </div>
          </form>
        </div>
      </div>
    </GlassModal>
  );
}