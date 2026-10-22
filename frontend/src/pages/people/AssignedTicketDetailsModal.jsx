import { useRef, useState } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import {
  Paperclip,
  X,
  CalendarDays,
  Download,
  FileText,
  MessageSquare,
} from "lucide-react";
import GlassModal from "../../components/ui/GlassModal";
import GlassButton from "../../components/ui/GlassButton";
import { validateDescription } from "../../utils/validationUtils";
import { formatDisplayDate } from "../../utils/dateUtils";

const STATUS_OPTIONS = ["Open", "In Progress", "Closed"];

const PRIORITY_OPTIONS = [
  { value: "Low Priority", label: "Low" },
  { value: "Medium Priority", label: "Medium" },
  { value: "High Priority", label: "High" },
];

const MAX_COMMENT_FILES = 5;

const normalizePriorityValue = (priority) => {
  const value = String(priority || "").toLowerCase();
  if (value.startsWith("high")) return "High Priority";
  if (value.startsWith("low")) return "Low Priority";
  return "Medium Priority";
};

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

const isImageAvatar = (avatar) =>
  typeof avatar === "string" &&
  (avatar.startsWith("http") ||
    avatar.startsWith("/") ||
    avatar.startsWith("data:") ||
    avatar.startsWith("blob:"));

const Badge = ({ tone, children }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${tone}`}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {children}
  </span>
);

const SectionHeading = ({ icon, title, count }) => (
  <div className="mb-2.5 flex items-center justify-between gap-3">
    <h3 className="flex items-center gap-2 text-sm font-semibold text-heading">
      {icon}
      {title}
    </h3>
    {count !== undefined && (
      <span className="text-[11px] font-medium text-muted">{count}</span>
    )}
  </div>
);

const FieldLabel = ({ children }) => (
  <p className="mb-1.5 text-[11px] font-medium text-muted">{children}</p>
);

const optionButtonClass = (active) =>
  `rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
    active
      ? "bg-surface text-heading shadow-sm ring-1 ring-border-subtle"
      : "text-muted hover:text-main"
  }`;

export default function AssignedTicketDetailsModal({
  ticket,
  onClose,
  onStatusChange,
  onPriorityChange,
  onAddComment,
  onDownload,
  showToast,
}) {
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState(null);
  const [sendingComment, setSendingComment] = useState(false);
  const [commentFiles, setCommentFiles] = useState([]);
  const fileInputRef = useRef(null);

  if (!ticket) return null;

  const handleFileSelect = (event) => {
    const selected = Array.from(event.target.files || []);
    if (!selected.length) return;
    const next = [...commentFiles, ...selected].slice(0, MAX_COMMENT_FILES);
    setCommentFiles(next);
    setCommentError(
      validateDescription(commentText, { min: 10, max: 500, required: next.length === 0 })
    );
    event.target.value = "";
  };

  const removeFile = (index) => {
    const next = commentFiles.filter((_, i) => i !== index);
    setCommentFiles(next);
    setCommentError(
      validateDescription(commentText, { min: 10, max: 500, required: next.length === 0 })
    );
  };

  const activePriority = normalizePriorityValue(ticket.priority);

  const handleSendComment = async () => {
    const hasFiles = commentFiles.length > 0;
    const err = validateDescription(commentText, {
      min: 10,
      max: 500,
      required: !hasFiles,
    });
    if (err) {
      setCommentError(err);
      return;
    }
    setCommentError(null);
    setSendingComment(true);
    try {
      const result = await onAddComment(ticket._id, commentText, commentFiles);
      if (result?.error) {
        setCommentError(result.error);
        showToast?.(result.error, "error");
        return;
      }
      setCommentText("");
      setCommentFiles([]);
    } finally {
      setSendingComment(false);
    }
  };

  const requesterName = (() => {
    const rawName = ticket.user?.name || ticket.closedBy?.name;
    return rawName && !/unknown/i.test(rawName)
      ? rawName
      : ticket.emailAddress
      ? ticket.emailAddress
          .split("@")[0]
          .replace(/[._]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())
      : "—";
  })();

  return (
    <GlassModal
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-5xl"
      footer={
        <GlassButton variant="secondary" onClick={onClose}>
          Close
        </GlassButton>
      }
      title={
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-muted">
            <span className="font-mono font-semibold">#{ticket.ticketID}</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>Raised {formatDisplayDate(ticket.createdAt)}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
            <h2 className="min-w-0 text-lg font-semibold leading-snug tracking-tight text-heading">
              {ticket.subject}
            </h2>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Badge tone={statusTone(ticket.status)}>{ticket.status}</Badge>
              <Badge tone={priorityTone(ticket.priority)}>
                {cleanPriority(ticket.priority)}
              </Badge>
            </div>
          </div>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Main column */}
        <div className="min-w-0 space-y-6">
          {/* Description */}
          <section>
            <SectionHeading
              icon={<FileText size={15} className="text-muted" />}
              title="Description"
            />
            <div className="rounded-xl border border-border-subtle bg-surface p-4">
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-main">
                {ticket.description}
              </p>
            </div>
          </section>

          {/* Attachments */}
          <section>
            <SectionHeading
              icon={<Paperclip size={15} className="text-muted" />}
              title="Attachments"
              count={`${ticket.attachments?.length || 0} file${
                (ticket.attachments?.length || 0) === 1 ? "" : "s"
              }`}
            />
            {ticket.attachments && ticket.attachments.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
                <div className="divide-y divide-border-subtle">
                  {ticket.attachments.map((file, idx) => (
                    <button
                      key={idx}
                      onClick={() => onDownload?.(file.blobName, file.name)}
                      className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-card-hover"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-app text-[10px] font-semibold uppercase text-muted">
                        {file.name.split(".").pop()}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-main">
                        {file.name}
                      </span>
                      <Download
                        size={14}
                        className="shrink-0 text-muted transition-colors group-hover:text-main"
                      />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border-subtle bg-surface px-4 py-5 text-center text-xs text-muted">
                No attachments.
              </div>
            )}
          </section>

          {/* Activity */}
          <section>
            <SectionHeading
              icon={<MessageSquare size={15} className="text-muted" />}
              title="Activity"
              count={`${ticket.responses?.length || 0} message${
                (ticket.responses?.length || 0) === 1 ? "" : "s"
              }`}
            />
            <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
              <div className="divide-y divide-border-subtle">
                {ticket.responses?.length > 0 ? (
                  ticket.responses.map((res, idx) => (
                    <div key={idx} className="flex gap-3 p-4">
                      {isImageAvatar(res.avatar) ? (
                        <img
                          src={res.avatar}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded-full border border-border-subtle object-cover"
                        />
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-app text-[11px] font-semibold uppercase text-muted">
                          {res.author?.charAt(0) || "?"}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="truncate text-[13px] font-semibold text-heading">
                            {res.author}
                          </span>
                          <span className="shrink-0 text-[11px] text-muted">
                            {formatDateTime(res.time)}
                          </span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-main">
                          {res.content}
                        </p>
                        {res.attachments?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {res.attachments.map((file, fileIdx) => (
                              <button
                                key={fileIdx}
                                type="button"
                                onClick={() => onDownload?.(file.blobName, file.name)}
                                className="inline-flex max-w-[220px] items-center gap-1.5 rounded-md border border-border-subtle bg-app px-2 py-1 text-[11px] font-medium text-main transition-colors hover:border-brand/40 hover:bg-card-hover"
                                title={`Download ${file.name}`}
                              >
                                <Paperclip size={11} className="shrink-0 text-muted" />
                                <span className="truncate">{file.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-xs text-muted">
                    No messages yet.
                  </div>
                )}
              </div>

              {/* Composer */}
              <div className="border-t border-border-subtle p-3">
                <div
                  className={`rounded-lg border bg-surface transition-shadow focus-within:ring-2 focus-within:ring-brand/10 ${
                    commentError
                      ? "border-danger-border"
                      : "border-border-subtle focus-within:border-brand/40"
                  }`}
                >
                  <textarea
                    value={commentText}
                    onChange={(e) => {
                      setCommentText(e.target.value);
                      setCommentError(
                        validateDescription(e.target.value, {
                          min: 10,
                          max: 500,
                          required: commentFiles.length === 0,
                        })
                      );
                    }}
                    onBlur={() =>
                      setCommentError(
                        validateDescription(commentText, {
                          min: 10,
                          max: 500,
                          required: commentFiles.length === 0,
                        })
                      )
                    }
                    placeholder="Write a reply..."
                    className="block min-h-[64px] w-full resize-none rounded-t-lg border-0 bg-transparent px-3 pt-3 text-[13px] leading-relaxed text-main outline-none placeholder:text-muted/70"
                  />

                  {commentFiles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                      {commentFiles.map((file, idx) => (
                        <span
                          key={`${file.name}-${idx}`}
                          className="inline-flex max-w-[220px] items-center gap-1.5 rounded-md border border-border-subtle bg-app px-2 py-1 text-[11px] font-medium text-main"
                        >
                          <Paperclip size={11} className="shrink-0 text-muted" />
                          <span className="truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="shrink-0 text-muted transition-colors hover:text-danger"
                            aria-label={`Remove ${file.name}`}
                          >
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 border-t border-border-subtle bg-app/40 px-2 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={commentFiles.length >= MAX_COMMENT_FILES}
                        className="rounded-md p-1.5 text-muted transition-colors hover:bg-card-hover hover:text-main disabled:cursor-not-allowed disabled:opacity-40"
                        title="Attach files"
                        aria-label="Attach files"
                      >
                        <Paperclip size={15} />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        hidden
                        onChange={handleFileSelect}
                      />
                      <span className="text-[11px] text-muted">
                        {commentFiles.length}/{MAX_COMMENT_FILES} attachments
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-muted">{commentText.length}/500</span>
                      <GlassButton
                        variant="primary"
                        size="sm"
                        icon={PaperAirplaneIcon}
                        onClick={() => {
                          if (!commentError) handleSendComment();
                        }}
                        disabled={
                          sendingComment ||
                          !!commentError ||
                          (!commentText.trim() && commentFiles.length === 0)
                        }
                        isLoading={sendingComment}
                        aria-label="Send reply"
                      >
                        Send
                      </GlassButton>
                    </div>
                  </div>
                </div>
                {commentError && (
                  <p className="mt-1.5 text-[11px] font-medium text-danger">{commentError}</p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside>
          <h3 className="mb-2.5 text-sm font-semibold text-heading">Details</h3>
          <div className="overflow-hidden rounded-xl border border-border-subtle bg-surface">
            <div className="border-b border-border-subtle px-4 py-3.5">
              <FieldLabel>Requester</FieldLabel>
              <div className="flex items-center gap-2.5">
                <img
                  src={
                    ticket.user?.avatar ||
                    ticket.closedBy?.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      ticket.user?.name || ticket.closedBy?.name || ticket.emailAddress || "User"
                    )}`
                  }
                  alt=""
                  className="h-8 w-8 rounded-full border border-border-subtle object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-main">{requesterName}</p>
                  <p className="truncate text-[11px] text-muted">{ticket.emailAddress}</p>
                </div>
              </div>
            </div>

            <div className="border-b border-border-subtle px-4 py-3.5">
              <FieldLabel>Status</FieldLabel>
              <div className="grid grid-cols-3 gap-1 rounded-lg border border-border-subtle bg-app p-1">
                {STATUS_OPTIONS.map((s) => {
                  const active =
                    String(ticket.status || "").toLowerCase() === s.toLowerCase() ||
                    (s === "Open" && String(ticket.status || "").toLowerCase() === "opened");
                  return (
                    <button
                      key={s}
                      onClick={() => onStatusChange?.(ticket._id, s)}
                      className={optionButtonClass(active)}
                      aria-pressed={active}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-b border-border-subtle px-4 py-3.5">
              <FieldLabel>Priority</FieldLabel>
              <div className="grid grid-cols-3 gap-1 rounded-lg border border-border-subtle bg-app p-1">
                {PRIORITY_OPTIONS.map((option) => {
                  const active = activePriority === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => onPriorityChange?.(ticket._id, option.value)}
                      className={optionButtonClass(active)}
                      aria-pressed={active}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-4 py-3.5">
              <FieldLabel>Raised on</FieldLabel>
              <p className="flex items-center gap-2 text-[13px] font-medium text-main">
                <CalendarDays size={14} className="text-muted" />
                {formatDisplayDate(ticket.createdAt)}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </GlassModal>
  );
}
