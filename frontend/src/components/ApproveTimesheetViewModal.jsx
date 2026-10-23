import React, { useState } from "react";
import {
  FaCommentDots,
  FaDownload,
  FaEye,
  FaFileAlt,
  FaPaperclip,
  FaPaperPlane,
  FaRegClock,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { downloadFile } from "../utils/downloadFile";
import timesheetApi from "../api/timesheetApi";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { validateDescription, getApiError } from "../utils/validationUtils";
import GlassButton from "./ui/GlassButton";
import DetailModal, {
  DetailBadge,
  DetailField,
  DetailFooterButton,
  DetailSectionHeading,
} from "./ui/DetailModal";

const statusTone = (status) => {
  const value = String(status || "").toLowerCase();
  if (value === "approved") return "border-success-border bg-success-bg text-success";
  if (value === "rejected") return "border-danger-border bg-danger-bg text-danger";
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

const ApproveTimesheetViewModal = ({
  timesheet,
  onClose,
  onApprove,
  onReject,
  loading,
  isApprovedTab = false,
  onCommentAdded = () => {},
}) => {
  const [approvedHours, setApprovedHours] = useState(timesheet?.submittedHours || 0);
  const [newComment, setNewComment] = useState("");
  const [errors, setErrors] = useState({});
  const [sendingComment, setSendingComment] = useState(false);
  const [comments, setComments] = useState(timesheet?.comments || []);

  if (!timesheet) return null;

  const handleApprove = () => {
    if (approvedHours <= 0) {
      toast.error("Approved hours must be greater than 0");
      return;
    }
    if (approvedHours > timesheet.submittedHours) {
      toast.error(`Approved hours cannot exceed submitted hours (${timesheet.submittedHours}h)`);
      return;
    }
    if (onApprove) {
      onApprove(timesheet._id, approvedHours, "");
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject(timesheet._id, "");
    }
  };

  const handleAddComment = async () => {
    const error = validateDescription(newComment, { min: 5, max: 200, required: true });
    if (error) {
      setErrors((prev) => ({ ...prev, comment: error }));
      return;
    }
    setErrors((prev) => ({ ...prev, comment: null }));

    try {
      setSendingComment(true);
      const updatedTimesheet = await timesheetApi.addTimesheetComment(timesheet._id, newComment);
      setComments(updatedTimesheet.comments || []);
      setNewComment("");
      onCommentAdded();
      toast.success("Comment added");
    } catch (err) {
      toast.error(getApiError(err, "Failed to add comment"));
    } finally {
      setSendingComment(false);
    }
  };

  const timeLogs = (timesheet.timeLogs || []).filter(Boolean);
  const attachments = timesheet.attachments || [];
  const canApprove = !isApprovedTab && timesheet.status === "Pending" && !!onApprove;

  const footer =
    !isApprovedTab && timesheet.status === "Pending" ? (
      <>
        <DetailFooterButton onClick={onClose} disabled={loading}>
          Close
        </DetailFooterButton>
        {onReject && (
          <GlassButton variant="danger" onClick={handleReject} isLoading={loading}>
            Reject
          </GlassButton>
        )}
        {onApprove && (
          <GlassButton
            variant="primary"
            onClick={handleApprove}
            isLoading={loading}
            disabled={approvedHours <= 0}
          >
            Approve
          </GlassButton>
        )}
      </>
    ) : (
      <DetailFooterButton onClick={onClose} className="w-full sm:w-auto">
        Close
      </DetailFooterButton>
    );

  return (
    <DetailModal
      isOpen={!!timesheet}
      onClose={onClose}
      ariaLabel="Timesheet approval details"
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
      footer={footer}
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

                        {/* LINKED TASK CARD WITH REDIRECT */}
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

                        {log.attachments?.filter(Boolean).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {log.attachments.filter(Boolean).map((file, index) => (
                              <span
                                key={file._id || index}
                                className="inline-flex max-w-[220px] items-center gap-1.5 rounded-md border border-border-subtle bg-app px-2 py-1 text-[11px] font-medium text-main"
                              >
                                <FaPaperclip size={10} className="shrink-0 text-muted" />
                                <span className="truncate">
                                  {file.originalname || file.name || "Attachment"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => file.url && window.open(file.url, "_blank")}
                                  className="shrink-0 text-muted transition-colors hover:text-brand-text"
                                  title="Preview"
                                >
                                  <FaEye size={10} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    downloadFile(
                                      file.blobName || file.url,
                                      file.originalname || file.name
                                    )
                                  }
                                  className="shrink-0 text-muted transition-colors hover:text-main"
                                  title="Download"
                                >
                                  <FaDownload size={10} />
                                </button>
                              </span>
                            ))}
                          </div>
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
                      onClick={() => downloadFile(file.blobName || file.url, file.originalname)}
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
              <div className="max-h-[420px] divide-y divide-border-subtle overflow-y-auto custom-scrollbar">
                {comments.length > 0 ? (
                  [...comments].reverse().map((comment, index) => (
                    <div key={comment._id || index} className="flex gap-3 px-4 py-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-app text-[11px] font-semibold text-main ring-1 ring-border-subtle">
                        {comment.avatar ? (
                          <img
                            src={comment.avatar}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          comment.author?.charAt(0) || "U"
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-[13px] font-semibold text-heading">
                            {comment.author || "Unknown"}
                          </span>
                          <span className="text-[11px] text-muted">
                            {comment.time
                              ? format(new Date(comment.time), "MMM dd, hh:mm a")
                              : "-"}
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
                    value={newComment}
                    onChange={(event) => {
                      setNewComment(event.target.value);
                      if (errors.comment) setErrors((prev) => ({ ...prev, comment: null }));
                    }}
                    placeholder="Write a reply..."
                    className="block min-h-[64px] w-full resize-none rounded-t-lg border-0 bg-transparent px-3 pt-3 text-[13px] leading-relaxed text-main outline-none placeholder:text-muted/70"
                  />

                  <div className="flex items-center justify-between gap-2 border-t border-border-subtle bg-app/40 px-2 py-1.5">
                    <span className="text-[11px] text-muted">{newComment.length}/200</span>
                    <GlassButton
                      type="button"
                      variant="primary"
                      size="sm"
                      icon={FaPaperPlane}
                      onClick={handleAddComment}
                      disabled={sendingComment || !newComment.trim()}
                      isLoading={sendingComment}
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

            <DetailField
              label={isApprovedTab ? "Approved hours" : "Current approved hours"}
              className="border-b-0"
            >
              <p className="text-[13px] font-medium text-main">
                {timesheet.approvedHours || 0}
              </p>
            </DetailField>
          </div>

          {canApprove && (
            <div className="mt-4">
              <h3 className="mb-2.5 text-sm font-semibold text-heading">Approval</h3>
              <div className="rounded-xl border border-border-subtle bg-surface p-4">
                <label className="mb-1.5 block text-[11px] font-medium text-muted">
                  Approve hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max={timesheet.submittedHours}
                  value={approvedHours}
                  onChange={(event) => setApprovedHours(parseFloat(event.target.value))}
                  className="block w-full rounded-lg border border-border-subtle bg-app px-3 py-2 text-[13px] text-main outline-none transition-colors placeholder:text-muted/70 focus:border-brand/40 focus:ring-2 focus:ring-brand/10"
                  placeholder="Enter approved hours"
                />
                <p className="mt-1.5 text-[11px] text-muted">
                  Adjust hours if needed (max: {timesheet.submittedHours}h)
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </DetailModal>
  );
};

export default ApproveTimesheetViewModal;
