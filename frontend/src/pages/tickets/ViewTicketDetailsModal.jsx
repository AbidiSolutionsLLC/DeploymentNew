import { useRef, useState } from "react";
import api from "../../axios";
import { downloadFile } from "../../utils/downloadFile";
import {
  FaCalendarDay,
  FaCommentDots,
  FaDownload,
  FaFileAlt,
  FaPaperPlane,
  FaPaperclip,
} from "react-icons/fa";
import { X } from "lucide-react";
import { validateDescription, getApiError } from "../../utils/validationUtils";
import GlassButton from "../../components/ui/GlassButton";
import DetailModal, {
  DetailBadge,
  DetailField,
  DetailSectionHeading,
} from "../../components/ui/DetailModal";

const cleanPriority = (priority) =>
  String(priority || "Normal").replace(/\s*Priority$/i, "");

const statusTone = (status) => {
  const value = String(status || "").toLowerCase();
  if (value === "closed") return "border-success-border bg-success-bg text-success";
  if (value === "in progress") return "border-info-border bg-info-bg text-info";
  return "border-warning-border bg-warning-bg text-warning";
};

const priorityTone = (priority) => {
  const value = String(priority || "").toLowerCase();
  if (value.includes("high") || value.includes("critical"))
    return "border-danger-border bg-danger-bg text-danger";
  if (value.includes("medium")) return "border-warning-border bg-warning-bg text-warning";
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

const ViewTicketDetailsModal = ({ ticket: initialTicket, onClose, showToast }) => {
  const [ticket, setTicket] = useState(initialTicket);
  const [commentText, setCommentText] = useState("");
  const [commentFiles, setCommentFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);

  if (!ticket) return null;

  const handleFileSelect = (event) => {
    const selected = Array.from(event.target.files || []);
    if (!selected.length) return;
    const next = [...commentFiles, ...selected].slice(0, 5);
    setCommentFiles(next);
    setErrors((prev) => ({ ...prev, response: null }));
    event.target.value = "";
  };

  const removeFile = (index) => {
    setCommentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const notify = (message, type = "success") => {
    if (typeof showToast === "function") showToast(message, type);
  };

  const handleSendResponse = async () => {
    const hasFiles = commentFiles.length > 0;
    const error = validateDescription(commentText, { min: 5, max: 500, required: !hasFiles });
    if (error) {
      setErrors((prev) => ({ ...prev, response: error }));
      return;
    }
    setErrors((prev) => ({ ...prev, response: null }));

    setSending(true);
    try {
      let payload;
      if (hasFiles) {
        payload = new FormData();
        payload.append("content", commentText);
        commentFiles.forEach((file) => payload.append("attachments", file));
      } else {
        payload = { content: commentText };
      }
      const { data: updatedTicket } = await api.post(`/tickets/${ticket._id}/response`, payload);

      setTicket(updatedTicket);
      setCommentText("");
      setCommentFiles([]);
      notify("Reply sent!");
    } catch (error) {
      notify(getApiError(error, "Failed to send reply"), "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <DetailModal
      isOpen={true}
      onClose={onClose}
      ariaLabel="Ticket details"
      meta={
        <>
          <span className="font-mono font-semibold text-main">
            #{ticket.ticketID || String(ticket._id || "").slice(-8).toUpperCase()}
          </span>
          <span className="h-1 w-1 rounded-full bg-border" />
          <span>Created {formatDateTime(ticket.createdAt)}</span>
        </>
      }
      title={ticket.subject || "Ticket"}
      badges={
        <>
          <DetailBadge tone={statusTone(ticket.status)}>{ticket.status || "Open"}</DetailBadge>
          <DetailBadge tone={priorityTone(ticket.priority)}>
            {cleanPriority(ticket.priority)}
          </DetailBadge>
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
                {ticket.description || "No description provided."}
              </p>
            </div>
          </section>

          <section>
            <DetailSectionHeading
              icon={<FaPaperclip size={13} className="text-muted" />}
              title="Attachments"
              count={
                ticket.attachments?.length
                  ? `${ticket.attachments.length} file${
                      ticket.attachments.length === 1 ? "" : "s"
                    }`
                  : undefined
              }
            />
            <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
              {ticket.attachments?.length > 0 ? (
                <div className="divide-y divide-border-subtle">
                  {ticket.attachments.map((file, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => downloadFile(file.blobName || file.url, file.name)}
                      className="group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-card-hover"
                      title={`Download ${file.name}`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-app text-[10px] font-semibold text-muted">
                        {String(file.name || "FILE").split(".").pop().toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-main">
                        {file.name}
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
              title="Activity"
              count={
                ticket.responses?.length
                  ? `${ticket.responses.length} ${
                      ticket.responses.length === 1 ? "reply" : "replies"
                    }`
                  : undefined
              }
            />
            <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
              <div className="max-h-[420px] divide-y divide-border-subtle overflow-y-auto custom-scrollbar">
                {ticket.responses?.length > 0 ? (
                  ticket.responses.map((res, index) => (
                    <div key={index} className="flex gap-3 px-4 py-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-app text-[11px] font-semibold uppercase text-main ring-1 ring-border-subtle">
                        {res.author?.charAt(0) || "?"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-[13px] font-semibold text-heading">
                            {res.author || "Unknown"}
                          </span>
                          <span className="text-[11px] text-muted">
                            {formatDateTime(res.time)}
                          </span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-main">
                          {res.content}
                        </p>
                        {res.attachments?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {res.attachments.map((file, fileIndex) => (
                              <button
                                key={fileIndex}
                                type="button"
                                onClick={() => downloadFile(file.blobName || file.url, file.name)}
                                className="inline-flex max-w-[220px] items-center gap-1.5 rounded-md border border-border-subtle bg-app px-2 py-1 text-[11px] font-medium text-main transition-colors hover:bg-card-hover"
                                title={`Download ${file.name}`}
                              >
                                <FaPaperclip size={10} className="shrink-0 text-muted" />
                                <span className="truncate">{file.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="px-4 py-8 text-center text-xs text-muted">No replies yet</p>
                )}
              </div>

              <div className="border-t border-border-subtle p-3">
                <div
                  className={`rounded-lg border bg-surface transition-colors ${
                    errors.response
                      ? "border-danger-border"
                      : "border-border-subtle focus-within:border-brand/40 focus-within:ring-2 focus-within:ring-brand/10"
                  }`}
                >
                  <textarea
                    value={commentText}
                    onChange={(event) => {
                      setCommentText(event.target.value);
                      if (errors.response) setErrors((prev) => ({ ...prev, response: null }));
                    }}
                    placeholder="Write a reply..."
                    className="block min-h-[64px] w-full resize-none rounded-t-lg border-0 bg-transparent px-3 pt-3 text-[13px] leading-relaxed text-main outline-none placeholder:text-muted/70"
                  />

                  {commentFiles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 border-t border-border-subtle px-3 py-2">
                      {commentFiles.map((file, index) => (
                        <span
                          key={`${file.name}-${index}`}
                          className="inline-flex max-w-[220px] items-center gap-1.5 rounded-md border border-border-subtle bg-app px-2 py-1 text-[11px] font-medium text-main"
                        >
                          <FaPaperclip size={10} className="shrink-0 text-muted" />
                          <span className="truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="shrink-0 text-muted transition-colors hover:text-danger"
                            aria-label={`Remove ${file.name}`}
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle bg-app/40 px-2 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={commentFiles.length >= 5}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-main disabled:cursor-not-allowed disabled:opacity-40"
                        title="Attach files"
                        aria-label="Attach files"
                      >
                        <FaPaperclip size={13} />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        hidden
                        onChange={handleFileSelect}
                      />
                      <span className="text-[11px] text-muted">
                        {commentFiles.length}/5 attachments
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-muted">{commentText.length}/500</span>
                      <GlassButton
                        type="button"
                        variant="primary"
                        size="sm"
                        icon={FaPaperPlane}
                        onClick={handleSendResponse}
                        disabled={sending || (!commentText.trim() && commentFiles.length === 0)}
                        isLoading={sending}
                      >
                        Send
                      </GlassButton>
                    </div>
                  </div>
                </div>
                {errors.response && (
                  <p className="mt-1.5 text-[11px] font-medium text-danger">
                    {errors.response}
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>

        <aside className="min-w-0">
          <h3 className="mb-2.5 text-sm font-semibold text-heading">Details</h3>
          <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
            <DetailField label="Requester">
              <p className="truncate text-[13px] font-medium text-main">
                {ticket.emailAddress || "-"}
              </p>
            </DetailField>

            <DetailField label="Status">
              <DetailBadge tone={statusTone(ticket.status)}>
                {ticket.status || "Open"}
              </DetailBadge>
            </DetailField>

            <DetailField label="Priority">
              <DetailBadge tone={priorityTone(ticket.priority)}>
                {cleanPriority(ticket.priority)}
              </DetailBadge>
            </DetailField>

            <DetailField label="Created on" className="border-b-0">
              <p className="flex items-center gap-2 text-[13px] font-medium text-main">
                <FaCalendarDay size={12} className="text-muted" />
                {formatDateTime(ticket.createdAt)}
              </p>
            </DetailField>
          </div>
        </aside>
      </div>
    </DetailModal>
  );
};

export default ViewTicketDetailsModal;
