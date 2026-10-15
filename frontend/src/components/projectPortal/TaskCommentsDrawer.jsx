import React, { useState } from "react";
import { useSelector } from "react-redux";
import GlassModal from "../ui/GlassModal";
import GlassButton from "../ui/GlassButton";
import PanelHead from "./PanelHead";

export default function TaskCommentsDrawer({
  task,
  comments = [],
  onClose,
  onAddComment,
}) {
  const { userInfo } = useSelector((state) => state.user || {});
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <GlassModal
      isOpen={!!task}
      onClose={onClose}
      title={task?.title}
      description="Task discussion"
      maxWidth="max-w-lg"
      footer={
        <GlassButton variant="secondary" onClick={onClose}>Close</GlassButton>
      }
    >
      <div className="flex flex-col gap-4 h-full">
        <PanelHead title="Comments" subtitle={`${comments.length} comment${comments.length !== 1 ? "s" : ""}`} />

        <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar-visible">
          {comments?.map((c) => (
            <div key={c._id || c.id} className="flex gap-2">
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
          {(!comments || comments.length === 0) && (
            <p className="text-sm text-muted text-center py-8">No comments yet</p>
          )}
        </div>

        <form onSubmit={handleSubmitComment} className="flex gap-2 border-t border-border-subtle pt-4">
          <div className="w-8 h-8 rounded-full bg-amber-50 border border-border-accent flex items-center justify-center flex-shrink-0">
            <span className="text-brand-text font-black text-sm">{userInfo?.name?.[0] || userInfo?.user?.name?.[0] || "U"}</span>
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
    </GlassModal>
  );
}