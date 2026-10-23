import React, { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  FaPaperclip,
  FaTimes,
  FaReply,
  FaDownload,
  FaPaperPlane,
  FaTrashAlt,
  FaFileAlt,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileArchive,
  FaFileImage,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { downloadFile } from "../../utils/downloadFile";
import GlassButton from "../ui/GlassButton";
import {
  addTaskComment,
  fetchTaskComments,
  deleteTaskComment,
} from "../../store/taskSlice";

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

const getFileIcon = (fileName = "") => {
  const ext = fileName.split(".").pop().toLowerCase();
  switch (ext) {
    case "pdf":
      return <FaFilePdf className="text-rose-500 shrink-0" size={14} />;
    case "doc":
    case "docx":
      return <FaFileWord className="text-blue-500 shrink-0" size={14} />;
    case "xls":
    case "xlsx":
    case "csv":
      return <FaFileExcel className="text-emerald-500 shrink-0" size={14} />;
    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
      return <FaFileArchive className="text-amber-500 shrink-0" size={14} />;
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "webp":
      return <FaFileImage className="text-purple-500 shrink-0" size={14} />;
    default:
      return <FaFileAlt className="text-muted shrink-0" size={14} />;
  }
};

const formatFileSize = (bytes) => {
  if (!bytes || isNaN(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

const formatCommentTime = (timeInput) => {
  if (!timeInput) return "";
  const date = new Date(timeInput);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const isToday = now.toDateString() === date.toDateString();
  const timeStr = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  if (isToday) return `Today at ${timeStr}`;

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: now.getFullYear() === date.getFullYear() ? undefined : "numeric",
  }) + ` · ${timeStr}`;
};

export default function TaskComments({
  taskId,
  comments = [],
  onAddComment,
  onAddcomment,
  onDeleteComment,
  onDeletecomment,
  currentUserId: propUserId,
  className = "",
  maxListHeight = "max-h-[380px]",
}) {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.user || {});
  const authUser = useSelector((state) => state.auth?.user);
  const reduxTaskComments = useSelector((state) => state.tasks?.taskComments?.[taskId] || []);

  // Use props comments if non-empty, otherwise fallback to Redux store
  const displayComments = Array.isArray(reduxTaskComments) && reduxTaskComments.length > 0 ? reduxTaskComments : (Array.isArray(comments) ? comments : []);

  const currentUserId =
    propUserId ||
    userInfo?.user?._id ||
    userInfo?._id ||
    userInfo?.id ||
    authUser?.user?._id ||
    authUser?._id ||
    authUser?.id;

  const userRole = (
    userInfo?.role ||
    userInfo?.user?.role ||
    authUser?.role ||
    authUser?.user?.role ||
    ""
  ).toLowerCase().replace(/\s+/g, "");

  const isPrivileged = userRole === "admin" || userRole === "superadmin";

  const [text, setText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState(null);

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const commentsEndRef = useRef(null);
  const commentsListRef = useRef(null);

  // Auto-fetch comments from Redux if taskId is provided and comments aren't loaded yet
  useEffect(() => {
    if (taskId && (!displayComments || displayComments.length === 0)) {
      dispatch(fetchTaskComments(taskId));
    }
  }, [taskId, dispatch]);

  // Auto-focus textarea when replying
  useEffect(() => {
    if (replyTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyTo]);

  // Handle file select
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (selectedFiles.length + files.length > MAX_ATTACHMENTS) {
      toast.warning(`You can attach up to ${MAX_ATTACHMENTS} files per comment.`);
    }

    const availableSlots = MAX_ATTACHMENTS - selectedFiles.length;
    const filesToAdd = files.slice(0, availableSlots);

    const validFiles = [];
    for (const file of filesToAdd) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`"${file.name}" exceeds the 100MB limit.`);
        continue;
      }
      validFiles.push(file);
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Reply selection
  const handleSelectReply = (comment) => {
    const authorName =
      comment.user?.name ||
      comment.author ||
      (comment.user && typeof comment.user === "string" ? "User" : "Unknown");

    setReplyTo({
      commentId: comment._id || comment.id,
      userName: authorName,
      text: comment.text || comment.content || (comment.attachments?.length ? "📎 Attachment" : ""),
    });
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  // Jump to quoted comment and highlight
  const scrollToComment = (targetCommentId) => {
    if (!targetCommentId) return;
    const element = document.getElementById(`comment-${targetCommentId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedCommentId(targetCommentId);
      setTimeout(() => {
        setHighlightedCommentId(null);
      }, 1500);
    } else {
      toast.info("Original comment is no longer visible");
    }
  };

  // Safe resolver for add comment function
  const addFn = typeof onAddComment === "function"
    ? onAddComment
    : typeof onAddcomment === "function"
      ? onAddcomment
      : null;

  // Safe resolver for delete comment function
  const deleteFn = typeof onDeleteComment === "function"
    ? onDeleteComment
    : typeof onDeletecomment === "function"
      ? onDeletecomment
      : null;

  // Submit comment
  const handleSubmit = async (e) => {
    e?.preventDefault();
    const trimmed = text.trim();

    if (!trimmed && selectedFiles.length === 0) {
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        content: trimmed,
        text: trimmed,
        files: selectedFiles,
        replyTo: replyTo ? {
          commentId: replyTo.commentId,
          userName: replyTo.userName,
          text: replyTo.text,
        } : null,
      };

      if (addFn) {
        await addFn(payload);
      } else if (taskId) {
        // Redux direct fallback if prop function is not provided
        await dispatch(addTaskComment({ taskId, ...payload })).unwrap();
        toast.success("Comment added");
      } else {
        throw new Error("Unable to post comment: Task ID is missing");
      }

      setText("");
      setSelectedFiles([]);
      setReplyTo(null);

      // Scroll to bottom of comments
      setTimeout(() => {
        if (commentsEndRef.current) {
          commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 150);
    } catch (err) {
      console.error("Failed to post comment:", err);
      toast.error(err?.message || "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  // Keydown helper in textarea (Ctrl+Enter or Cmd+Enter to send)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape" && replyTo) {
      cancelReply();
    }
  };

  // Delete comment handler
  const handleDelete = async (commentId) => {
    if (deletingId) return;
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    setDeletingId(commentId);
    try {
      if (deleteFn) {
        await deleteFn(commentId);
      } else if (taskId) {
        // Redux direct fallback if prop function is not provided
        await dispatch(deleteTaskComment({ taskId, commentId })).unwrap();
        toast.success("Comment deleted");
      }
    } catch (err) {
      toast.error(err?.message || "Failed to delete comment");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Header with count */}
      <div className="flex items-center justify-between pb-1">
        <h4 className="text-xs font-black uppercase tracking-widest text-muted">
          Comments ({displayComments?.length || 0})
        </h4>
        <span className="text-[11px] text-muted">
          {displayComments?.length === 1 ? "1 discussion message" : `${displayComments?.length || 0} discussion messages`}
        </span>
      </div>

      {/* Comments List */}
      <div
        ref={commentsListRef}
        className={`${maxListHeight} overflow-y-auto space-y-3 pr-1.5 custom-scrollbar-visible rounded-xl border border-border-subtle bg-surface/50 p-3`}
      >
        {(!displayComments || displayComments.length === 0) && (
          <div className="py-10 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-card border border-border-subtle flex items-center justify-center mb-2 text-muted">
              <FaReply className="rotate-180 opacity-60" size={14} />
            </div>
            <p className="text-xs font-semibold text-heading">No comments yet</p>
            <p className="text-[11px] text-muted mt-0.5 max-w-xs">
              Leave a note, attach files, or reply to team members working on this task.
            </p>
          </div>
        )}

        {displayComments?.map((c) => {
          const commentId = c._id || c.id;
          const author = c.user?.name || c.author || "Unknown User";
          const avatar = c.user?.avatar || c.avatar;
          const authorInitial = author.charAt(0).toUpperCase() || "U";
          const isAuthor =
            currentUserId &&
            (c.user?._id === currentUserId ||
              c.user?.id === currentUserId ||
              c.user === currentUserId ||
              c.authorId === currentUserId);
          const canDelete = Boolean(isAuthor || isPrivileged);
          const isHighlighted = highlightedCommentId === commentId;
          const isImage = (att) => {
            const name = (att.originalname || att.name || "").toLowerCase();
            const mime = (att.mimetype || att.format || "").toLowerCase();
            return (
              mime.startsWith("image/") ||
              name.endsWith(".png") ||
              name.endsWith(".jpg") ||
              name.endsWith(".jpeg") ||
              name.endsWith(".webp") ||
              name.endsWith(".gif")
            );
          };

          return (
            <div
              key={commentId}
              id={`comment-${commentId}`}
              className={`group relative flex gap-2.5 rounded-xl p-2.5 transition-all duration-300 border ${
                isHighlighted
                  ? "bg-amber-500/10 border-brand ring-2 ring-brand/40 shadow-md"
                  : "bg-card border-border-subtle hover:border-border-accent/60"
              }`}
            >
              {/* Avatar */}
              <div className="flex-shrink-0 pt-0.5">
                <div className="w-7 h-7 rounded-full bg-amber-50 border border-border-accent flex items-center justify-center text-brand-text font-black text-xs overflow-hidden">
                  {avatar && !avatar.includes("Unknown") && avatar !== "👤" ? (
                    <img src={avatar} alt={author} className="w-full h-full object-cover" />
                  ) : (
                    authorInitial
                  )}
                </div>
              </div>

              {/* Main content body */}
              <div className="flex-1 min-w-0">
                {/* Header: Author + Timestamp + Actions */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-baseline gap-2 truncate">
                    <span className="text-xs font-bold text-heading truncate">{author}</span>
                    <span className="text-[10px] text-muted shrink-0">
                      {formatCommentTime(c.createdAt || c.timestamp || c.time)}
                    </span>
                  </div>

                  {/* Actions (Reply, Delete) */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSelectReply(c)}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-muted hover:text-brand-text hover:bg-brand/10 rounded transition-colors"
                      title="Reply to this comment"
                    >
                      <FaReply size={9} />
                      <span className="hidden sm:inline">Reply</span>
                    </button>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(commentId)}
                        disabled={deletingId === commentId}
                        className="inline-flex items-center p-1 text-muted hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors disabled:opacity-40"
                        title="Delete comment"
                      >
                        <FaTrashAlt size={9} />
                      </button>
                    )}
                  </div>
                </div>

                {/* WhatsApp-style Quoted Reply Preview */}
                {c.replyTo && (
                  <div
                    onClick={() => scrollToComment(c.replyTo.commentId)}
                    className="mb-2 flex items-start gap-2 rounded-lg border-l-4 border-brand bg-brand/5 dark:bg-brand/10 px-2.5 py-1.5 cursor-pointer hover:bg-brand/15 transition-colors group/quote"
                    title="Click to view quoted comment"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-text">
                        <FaReply size={8} className="rotate-180 opacity-70" />
                        <span>{c.replyTo.userName || "Quoted message"}</span>
                      </div>
                      <p className="text-[11px] text-main/80 truncate mt-0.5 italic">
                        {c.replyTo.text || "Original comment"}
                      </p>
                    </div>
                  </div>
                )}

                {/* Comment Text */}
                {(c.text || c.content) && (
                  <p className="text-xs text-main whitespace-pre-wrap break-words leading-relaxed">
                    {c.text || c.content}
                  </p>
                )}

                {/* Attachments Section */}
                {c.attachments && c.attachments.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {c.attachments.map((att, attIdx) => {
                      const fileName = att.originalname || att.name || `Attachment ${attIdx + 1}`;
                      const isImg = isImage(att);
                      const fileSource = att.blobName || att.url;

                      return (
                        <div
                          key={att.public_id || att.blobName || attIdx}
                          className="inline-flex items-center gap-2 max-w-[280px] rounded-lg border border-border-subtle bg-app/80 px-2.5 py-1.5 text-xs transition-colors hover:border-brand/40 group/att"
                        >
                          {getFileIcon(fileName)}
                          <div className="flex-1 min-w-0 flex flex-col">
                            <span className="text-[11px] font-semibold text-heading truncate" title={fileName}>
                              {fileName}
                            </span>
                            {att.size && (
                              <span className="text-[9px] text-muted">
                                {formatFileSize(att.size)}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => downloadFile(fileSource, fileName)}
                            className="shrink-0 p-1 rounded text-muted hover:text-brand-text hover:bg-brand/10 transition-colors"
                            title={`Download ${fileName}`}
                          >
                            <FaDownload size={11} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={commentsEndRef} />
      </div>

      {/* Reply Banner (WhatsApp style, shown above input) */}
      {replyTo && (
        <div className="flex items-center justify-between gap-2 rounded-lg border-l-4 border-brand bg-brand/10 p-2.5 animate-fadeIn">
          <div className="flex items-center gap-2 min-w-0">
            <FaReply size={12} className="text-brand shrink-0 rotate-180" />
            <div className="min-w-0">
              <span className="text-xs font-bold text-heading">
                Replying to <span className="text-brand-text">{replyTo.userName}</span>
              </span>
              <p className="text-[11px] text-muted truncate max-w-sm sm:max-w-md">
                "{replyTo.text || "Original comment"}"
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={cancelReply}
            className="p-1 rounded text-muted hover:text-heading hover:bg-card transition-colors shrink-0"
            title="Cancel reply (Esc)"
          >
            <FaTimes size={12} />
          </button>
        </div>
      )}

      {/* Selected Attachments Chips */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-border-subtle bg-surface p-2">
          {selectedFiles.map((file, idx) => (
            <span
              key={`${file.name}-${idx}`}
              className="inline-flex max-w-[220px] items-center gap-1.5 rounded-md border border-border-subtle bg-card px-2 py-1 text-[11px] font-medium text-main"
            >
              {getFileIcon(file.name)}
              <span className="truncate">{file.name}</span>
              <span className="text-[9px] text-muted">({formatFileSize(file.size)})</span>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="shrink-0 text-muted transition-colors hover:text-rose-500"
                title={`Remove ${file.name}`}
              >
                <FaTimes size={9} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Comment Input Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="relative rounded-xl border border-border-subtle bg-card focus-within:border-brand/40 focus-within:ring-2 focus-within:ring-brand/10 transition-all">
          <textarea
            ref={textareaRef}
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              replyTo
                ? `Reply to ${replyTo.userName}... (Ctrl+Enter to post)`
                : "Add a comment... (Ctrl+Enter to post)"
            }
            className="w-full resize-none border-0 bg-transparent p-3 text-xs leading-relaxed text-heading placeholder:text-muted outline-none"
            disabled={submitting}
          />

          {/* Controls Bar */}
          <div className="flex items-center justify-between border-t border-border-subtle/60 px-3 py-2 bg-surface/30 rounded-b-xl">
            {/* Attachment Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting || selectedFiles.length >= MAX_ATTACHMENTS}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted hover:text-heading hover:bg-card transition-colors disabled:opacity-40"
                title={`Attach files (up to ${MAX_ATTACHMENTS})`}
              >
                <FaPaperclip size={12} />
                <span className="text-[11px] font-semibold">
                  {selectedFiles.length > 0 ? `${selectedFiles.length}/${MAX_ATTACHMENTS}` : "Attach"}
                </span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                hidden
                onChange={handleFileChange}
              />
            </div>

            {/* Post button */}
            <div className="flex items-center gap-2">
              <GlassButton
                variant="primary"
                size="sm"
                type="submit"
                disabled={(!text.trim() && selectedFiles.length === 0) || submitting}
                isLoading={submitting}
                icon={FaPaperPlane}
              >
                {replyTo ? "Reply" : "Post"}
              </GlassButton>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
