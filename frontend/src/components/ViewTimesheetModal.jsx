import React, { useState } from "react";
import { FaCommentDots, FaDownload, FaFileAlt, FaPaperclip, FaPaperPlane, FaRegClock, FaExternalLinkAlt } from "react-icons/fa";
import { downloadFile } from "../utils/downloadFile";
import { toast } from "react-toastify";
import { format } from "date-fns";
import api from "../axios";
import { validateDescription } from "../utils/validationUtils";
import GlassButton from "./ui/GlassButton";
import Loader from "./ui/Loader";
import DetailModal, {
  DetailBadge,
  DetailField,
  DetailSectionHeading,
} from "./ui/DetailModal";

const statusTone = (status) => {
  const value = String(status || "").toLowerCase();
  if (value === "approved") return "border-success-border bg-success-bg text-success";
  if (value === "rejected" || value === "declined")
    return "border-danger-border bg-danger-bg text-danger";
  if (value === "pending") return "border-warning-border bg-warning-bg text-warning";
  return "border-border-subtle bg-app text-muted";
};

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const ViewTimesheetModal = ({ timesheet: initialTimesheet, onClose, onCommentAdded }) => {
  const [timesheet, setTimesheet] = useState(initialTimesheet);
  const [commentText, setCommentText] = useState("");
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);

  if (!timesheet) return null;

  const handleSendComment = async () => {
    const error = validateDescription(commentText, { min: 5, max: 200, required: true });
    if (error) {
      setErrors((prev) => ({ ...prev, comment: error }));
      return;
    }
    setErrors((prev) => ({ ...prev, comment: null }));

    setSending(true);
    try {
      const { data: updatedTimesheet } = await api.post(`/timesheets/${timesheet._id}/comment`, {
        content: commentText,
      });

      setTimesheet(updatedTimesheet);
      setCommentText("");
      setErrors({});
      toast.success("Comment sent!");
      if (onCommentAdded) onCommentAdded(updatedTimesheet);
    } catch (error) {
      console.error("Failed to send comment:", error);
      toast.error("Failed to send comment");
    } finally {
      setSending(false);
    }
  };

  const timeLogs = (timesheet.timeLogs || []).filter(Boolean);
  const attachments = timesheet.attachments || [];
  const comments = timesheet.comments || [];

  return (
    <DetailModal
      isOpen={!!timesheet}
      onClose={onClose}
      ariaLabel="Timesheet details"
      maxWidth="max-w-5xl"
      meta={
        <>
          <span className="font-mono font-semibold text-main">
            #{String(timesheet._id || "timesheet").slice(-8).toUpperCase()}
          </span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span>{formatDateTime(timesheet.date)}</span>
        </>
      }
      title={`${timesheet.employeeName || timesheet.name || "Employee"} · Timesheet`}
      badges={
        <>
          <DetailBadge tone={statusTone(timesheet.status)}>
            {timesheet.status || "Pending"}
          </DetailBadge>
          <DetailBadge>{timesheet.submittedHours || 0} hrs submitted</DetailBadge>
        </>
      }
    >
      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          <section>
            <DetailSectionHeading
              icon={<FaFileAlt size={13} className="text-muted" />}
              title="Description"
            />
            <div className="rounded-xl border border-border-subtle bg-surface p-4">
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-main">
                {timesheet.description || "No description provided."}
              </p>
            </div>
          </section>

          <section>
            <DetailSectionHeading
              icon={<FaRegClock size={13} className="text-muted" />}
              title="Time logs"
              count={
                timeLogs.length
                  ? `${timeLogs.length} ${timeLogs.length === 1 ? "entry" : "entries"}`
                  : undefined
              }
            />
            <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
              {timeLogs.length > 0 ? (
                <div className="divide-y divide-border-subtle">
                  {timeLogs.map((log) => {
                    const task = log.task && typeof log.task === 'object' ? log.task : null;
                    const project = task?.project && typeof task.project === 'object'
                      ? task.project
                      : (log.project && typeof log.project === 'object' ? log.project : null);
                    const projectId = project?._id || task?.project;
                    const taskId = task?._id;

                    return (
                      <div key={log._id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <span className="min-w-0 truncate text-[13px] font-semibold text-heading">
                            {log.job || log.jobTitle || "Unknown job"}
                          </span>
                          <span className="shrink-0 rounded-full border border-border-subtle bg-app px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted">
                            {log.hours || 0} hrs
                          </span>
                        </div>

                        {/* LINKED TASK CARD / BADGE */}
                        {task && (
                          <div className="mt-2 p-2.5 rounded-lg border border-border-subtle bg-app flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {task.taskID && (
                                <span className="font-mono text-[11px] font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded shrink-0">
                                  {task.taskID}
                                </span>
                              )}
                              <span className="text-xs font-semibold text-heading truncate">
                                {task.title}
                              </span>
                              {project?.title && (
                                <span className="text-[11px] text-muted truncate">
                                  • {project.title}
                                </span>
                              )}
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                                task.status === "Done"
                                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                              }`}>
                                {task.status || "Todo"}
                              </span>
                            </div>

                            {projectId && taskId && (
                              <button
                                type="button"
                                onClick={() => window.open(`/project/projects/${projectId}?taskId=${taskId}`, "_blank", "noopener,noreferrer")}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold text-brand-primary hover:bg-brand-primary/10 border border-brand-primary/30 transition-all cursor-pointer shrink-0"
                                title="Open and view task in project portal (opens in new tab)"
                              >
                                <FaExternalLinkAlt size={9} />
                                View Task
                              </button>
                            )}
                          </div>
                        )}

                        {log.description && (
                          <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-main">
                            {log.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="px-4 py-6 text-center text-xs text-muted">No time logs</p>
              )}
            </div>
          </section>

          <section>
            <DetailSectionHeading
              icon={<FaPaperclip size={13} className="text-muted" />}
              title="Attachments"
              count={
                attachments.length
                  ? `${attachments.length} file${attachments.length === 1 ? "" : "s"}`
                  : undefined
              }
            />
            <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
              {attachments.length > 0 ? (
                <div className="divide-y divide-border-subtle">
                  {attachments.map((file, index) => (
                    <button
                      key={file._id || index}
                      type="button"
                      onClick={() =>
                        downloadFile(
                          file.blobName || file.url,
                          file.originalname || file.name
                        )
                      }
                      className="group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-card-hover"
                      title={`Download ${file.originalname || file.name || "attachment"}`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-app text-[10px] font-semibold text-muted">
                        {String(file.originalname || file.name || "FILE")
                          .split(".")
                          .pop()
                          .toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-main">
                        {file.originalname || file.name || "Attachment"}
                      </span>
                      <FaDownload
                        size={14}
                        className="shrink-0 text-muted transition-colors group-hover:text-main"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="px-4 py-6 text-center text-xs text-muted">No attachments</p>
              )}
            </div>
          </section>

          <section>
            <DetailSectionHeading
              icon={<FaCommentDots size={13} className="text-muted" />}
              title="Discussion"
              count={
                comments.length
                  ? `${comments.length} ${comments.length === 1 ? "reply" : "replies"}`
                  : undefined
              }
            />
            <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
              <div className="max-h-[360px] divide-y divide-border-subtle overflow-y-auto custom-scrollbar">
                {comments.length > 0 ? (
                  comments.map((comment, index) => (
                    <div key={comment._id || index} className="flex gap-3 px-4 py-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-app text-[11px] font-semibold uppercase text-main ring-1 ring-border-subtle">
                        {comment.author?.charAt(0) || "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-[13px] font-semibold text-heading">
                            {comment.author || "Unknown"}
                          </span>
                          <span className="text-[11px] text-muted">
                            {comment.time ? format(new Date(comment.time), "MMM dd, HH:mm") : "-"}
                          </span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-main">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="px-4 py-8 text-center text-xs text-muted">
                    No discussion yet
                  </p>
                )}
              </div>

              <div className="border-t border-border-subtle p-3">
                <div
                  className={`rounded-lg border bg-surface transition-colors ${
                    errors.comment
                      ? "border-danger-border"
                      : "border-border-subtle focus-within:border-brand/40 focus-within:ring-2 focus-within:ring-brand/10"
                  }`}
                >
                  <textarea
                    value={commentText}
                    onChange={(event) => {
                      setCommentText(event.target.value);
                      if (errors.comment) setErrors((prev) => ({ ...prev, comment: null }));
                    }}
                    placeholder="Write a reply..."
                    className="block min-h-[64px] w-full resize-none rounded-t-lg border-0 bg-transparent px-3 pt-3 text-[13px] leading-relaxed text-main outline-none placeholder:text-muted/70"
                  />

                  <div className="flex items-center justify-between gap-2 border-t border-border-subtle bg-app/40 px-2 py-1.5">
                    <span className="text-[11px] text-muted">
                      {commentText.length}/200
                    </span>
                    <GlassButton
                      type="button"
                      variant="primary"
                      size="sm"
                      icon={FaPaperPlane}
                      onClick={handleSendComment}
                      disabled={sending || !commentText.trim()}
                      isLoading={sending}
                    >
                      Send
                    </GlassButton>
                  </div>
                </div>
                {errors.comment && (
                  <p className="mt-1.5 text-[11px] font-medium text-danger">
                    {errors.comment}
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>

        <aside className="min-w-0">
          <h3 className="mb-2.5 text-sm font-semibold text-heading">Details</h3>
          <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
            <DetailField label="Employee">
              <p className="truncate text-[13px] font-medium text-main">
                {timesheet.employeeName || timesheet.name || "-"}
              </p>
            </DetailField>

            <DetailField label="Date">
              <p className="text-[13px] font-medium text-main">
                {timesheet.date
                  ? new Date(timesheet.date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "-"}
              </p>
            </DetailField>

            <DetailField label="Status">
              <DetailBadge tone={statusTone(timesheet.status)}>
                {timesheet.status || "Pending"}
              </DetailBadge>
            </DetailField>

            <DetailField label="Submitted hours">
              <p className="text-[13px] font-medium text-main">
                {timesheet.submittedHours || 0}
              </p>
            </DetailField>

            <DetailField label="Approved hours" className="border-b-0">
              <p className="text-[13px] font-medium text-main">
                {timesheet.approvedHours || 0}
              </p>
            </DetailField>
          </div>
        </aside>
      </div>
    </DetailModal>
  );
};

export default ViewTimesheetModal;
