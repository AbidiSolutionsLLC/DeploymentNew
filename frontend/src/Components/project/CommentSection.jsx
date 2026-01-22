import React, { useState } from "react";
import { FaUser, FaPaperPlane, FaSpinner } from "react-icons/fa";
import { useTheme } from "../../context/ThemeContext"; // Keep this import
import { useComments } from "../../Hooks/project/useComments";
import { toast } from "react-toastify";

const CommentSection = ({ projectId }) => { // Changed component name
  const { selectedTheme } = useTheme(); // Keep this import, though colors are now via CSS vars
  const { comments, loading, addComment } = useComments(projectId);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      try {
        setSubmitting(true);
        await addComment(newComment);
        setNewComment("");
        toast.success('Comment added successfully');
      } catch (err) {
        toast.error('Failed to add comment');
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (loading) {
    return (
      <div 
        className="rounded-lg p-4 sm:p-6 bg-secondary"
      >
        <div className="animate-pulse space-y-4">
          <div 
            className="h-6 rounded w-1/4 bg-background"
          ></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3">
              <div 
                className="w-8 h-8 rounded-full bg-background"
              ></div>
              <div className="flex-1 space-y-2">
                <div 
                  className="h-4 rounded w-1/3 bg-background"
                ></div>
                <div 
                  className="h-16 rounded bg-background"
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="rounded-lg p-4 sm:p-6 bg-secondary"
    >
      <div className="mb-6">
        <h3 
          className="text-lg font-semibold mb-4 text-heading"
        >
          Project Discussion
        </h3>
        
        {/* Comment Form */}
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center bg-primary"
              >
                <FaUser className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full p-3 border border-primary/40 rounded-lg resize-none focus:ring-2 focus:ring-primary/50 focus:border-transparent text-sm transition-all bg-background text-text"
                rows={3}
                disabled={submitting}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="flex items-center gap-2 text-white px-4 py-2 rounded-md text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-primary"
                >
                  {submitting ? (
                    <FaSpinner className="w-3 h-3 animate-spin" />
                  ) : (
                    <FaPaperPlane className="w-3 h-3" />
                  )}
                  {submitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <div className="flex-shrink-0">
                <img
                  src={comment.user.avatar || "/placeholder.svg"}
                  alt={comment.user.name}
                  className="w-8 h-8 rounded-full"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div 
                  className="rounded-lg p-3 bg-background"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span 
                      className="font-medium text-sm text-text"
                    >
                      {comment.user.name}
                    </span>
                    <span 
                      className="text-xs text-description"
                    >
                      {comment.timestamp.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p 
                    className="text-sm leading-relaxed text-text"
                  >
                    {comment.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {comments.length === 0 && (
          <div className="text-center py-8">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-background"
            >
              <FaUser 
                className="w-8 h-8 text-description"
              />
            </div>
            <h3 
              className="text-lg font-medium mb-2 text-heading"
            >
              No comments yet
            </h3>
            <p 
              className="text-sm text-description"
            >
              You don't have any comments in this project yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection; // Changed export name
