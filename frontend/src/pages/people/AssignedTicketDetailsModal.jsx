import { useState } from "react";
import { PaperClipIcon, PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { Paperclip } from "lucide-react";
import { FaSpinner } from "react-icons/fa";
import GlassModal from "../../components/ui/GlassModal";
import Loader from "../../components/ui/Loader";
import { validateDescription } from "../../utils/validationUtils";
import {
  resolvePriorityPill,
  priorityLabel,
  statusBadgeClass,
} from "../../components/StatusBadge";
import { formatDisplayDate } from "../../utils/dateUtils";

const STATUS_OPTIONS = ["Open", "In Progress", "Closed"];

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

export default function AssignedTicketDetailsModal({
  ticket,
  onClose,
  onStatusChange,
  onAddComment,
  onDownload,
  showToast,
}) {
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState(null);
  const [sendingComment, setSendingComment] = useState(false);

  if (!ticket) return null;

  const handleSendComment = async () => {
    const err = validateDescription(commentText, { min: 10, max: 500, required: true });
    if (err) {
      setCommentError(err);
      return;
    }
    setCommentError(null);
    setSendingComment(true);
    try {
      const result = await onAddComment(ticket._id, commentText);
      if (result?.error) {
        setCommentError(result.error);
        showToast?.(result.error, "error");
        return;
      }
      setCommentText("");
    } finally {
      setSendingComment(false);
    }
  };

  return (
    <GlassModal
      isOpen={true}
      onClose={onClose}
      maxWidth="max-w-4xl"
      title={
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-base sm:text-lg font-black text-heading uppercase tracking-widest">
              {ticket.subject}
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide border ${resolvePriorityPill(
                ticket.priority
              )}`}
            >
              {priorityLabel(ticket.priority)}
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide border whitespace-nowrap ${statusBadgeClass(
                ticket.status
              )}`}
            >
              {ticket.status}
            </span>
          </div>
          <p className="text-muted text-xs font-mono mt-1 font-bold">Ticket ID: {ticket.ticketID}</p>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-surface p-5 rounded-[1.25rem] shadow-sm border border-border-subtle">
            <h3 className="text-xs font-black text-muted uppercase tracking-widest mb-3">Description</h3>
            <p className="text-main text-sm leading-relaxed font-medium whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>

          <div className="bg-surface p-5 rounded-[1.25rem] shadow-sm border border-border-subtle">
            <h3 className="text-xs font-black text-muted uppercase tracking-widest mb-3 flex items-center gap-2">
              <PaperClipIcon className="w-4 h-4" /> Attachments
            </h3>
            {ticket.attachments && ticket.attachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ticket.attachments.map((file, idx) => (
                  <button
                    key={idx}
                    onClick={() => onDownload?.(file.blobName, file.name)}
                    className="w-full flex items-center justify-between p-3 bg-surface rounded-xl border border-border-subtle hover:bg-amber-50 dark:bg-amber-900/30 hover:border-amber-200 dark:border-amber-800/50 transition-all group text-left"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-xs shrink-0">
                        {file.name.split(".").pop().toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-main truncate">{file.name}</span>
                    </div>
                    <div className="text-muted group-hover:text-amber-600 dark:text-amber-400">
                      <Paperclip size={16} />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted italic">No files attached.</p>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-muted uppercase tracking-widest pl-2">Discussion</h3>
            {ticket.responses?.map((res, idx) => (
              <div
                key={idx}
                className="bg-surface p-5 rounded-[1.25rem] shadow-sm border border-border-subtle flex gap-4"
              >
                <img
                  src={res.avatar || `https://ui-avatars.com/api/?name=${res.author}`}
                  alt=""
                  className="w-8 h-8 rounded-full border border-border-subtle"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm text-heading">{res.author}</span>
                    <span className="text-[10px] text-muted font-bold">{formatDateTime(res.time)}</span>
                  </div>
                  <p className="text-sm text-muted font-medium">{res.content}</p>
                </div>
              </div>
            ))}
            <div className="bg-surface p-2 rounded-[1.25rem] shadow-sm border border-border-subtle flex items-center gap-2 focus-within:ring-2 focus-within:ring-amber-100 transition-all">
              <textarea
                value={commentText}
                onChange={(e) => {
                  setCommentText(e.target.value);
                  setCommentError(
                    validateDescription(e.target.value, { min: 10, max: 500, required: true })
                  );
                }}
                onBlur={() =>
                  setCommentError(
                    validateDescription(commentText, { min: 10, max: 500, required: true })
                  )
                }
                placeholder="Type your reply (min 10 chars, at least 3 words)..."
                className={`flex-1 bg-transparent border-none focus:ring-0 text-sm p-3 resize-none h-12 font-medium ${
                  commentError ? "placeholder:text-red-300" : ""
                }`}
              ></textarea>
              <button
                onClick={() => {
                  if (!commentError) handleSendComment();
                }}
                disabled={sendingComment || !!commentError}
                className="p-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {sendingComment ? (
                  <Loader variant="spinner" size="sm" className="text-white" />
                ) : (
                  <PaperAirplaneIcon className="w-5 h-5" />
                )}
              </button>
            </div>
            {commentError && <p className="text-xs text-red-500 mt-1 pl-2">{commentError}</p>}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-surface p-5 rounded-[1.25rem] shadow-sm border border-border-subtle">
            <h3 className="text-xs font-black text-muted uppercase tracking-widest mb-3">Update Status</h3>
            <div className="flex flex-col gap-2">
              {STATUS_OPTIONS.map((s) => {
                const active =
                  String(ticket.status || "").toLowerCase() === s.toLowerCase() ||
                  (s === "Open" && String(ticket.status || "").toLowerCase() === "opened");
                return (
                  <button
                    key={s}
                    onClick={() => onStatusChange?.(ticket._id, s)}
                    className={`w-full px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide border transition-all text-left ${
                      active
                        ? "bg-brand/10 border-brand text-brand-text"
                        : "bg-surface border-border-subtle text-muted hover:border-amber-300 hover:text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-surface p-5 rounded-[1.25rem] shadow-sm border border-border-subtle">
            <h3 className="text-xs font-black text-muted uppercase tracking-widest mb-4">Requester</h3>
            <div className="flex items-center gap-3">
              <img
                src={
                  ticket.user?.avatar ||
                  `https://ui-avatars.com/api/?name=${ticket.emailAddress}`
                }
                alt=""
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
              />
              <div className="min-w-0">
                <p className="text-sm font-bold text-main truncate">
                  {ticket.user?.name || "Unknown"}
                </p>
                <p className="text-xs text-muted font-medium truncate">{ticket.emailAddress}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border-subtle space-y-2">
              <div>
                <p className="text-[10px] font-black text-muted uppercase tracking-widest">Raised On</p>
                <p className="text-xs font-bold text-main mt-0.5">
                  {ticket.createdAt ? formatDisplayDate(ticket.createdAt) : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlassModal>
  );
}
