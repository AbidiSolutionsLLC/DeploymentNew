import React, { useState } from "react";
import { FaPaperPlane } from "react-icons/fa";
import { toast } from "react-toastify";
import { format } from "date-fns";
import api from "../axios";

const ViewTimesheetModal = ({ timesheet: initialTimesheet, onClose, onCommentAdded }) => {
  const [timesheet, setTimesheet] = useState(initialTimesheet);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);

  if (!timesheet) return null;

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    setSending(true);
    try {
      const { data: updatedTimesheet } = await api.post(`/timesheets/${timesheet._id}/comment`, {
        content: commentText
      });
      
      setTimesheet(updatedTimesheet);
      setCommentText("");
      toast.success("Comment sent!");
      if (onCommentAdded) onCommentAdded(updatedTimesheet);
    } catch (error) {
      console.error("Failed to send comment:", error);
      toast.error("Failed to send comment");
    } finally {
      setSending(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved": return "bg-green-100 text-green-800";
      case "Rejected": return "bg-red-100 text-red-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative flex flex-col max-h-[90vh] animate-fadeIn overflow-hidden">
        {/* CLOSE BUTTON */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-red-500 transition-all text-2xl font-light z-10"
        >
          &times;
        </button>

        {/* HEADER */}
        <div className="px-6 py-6 sm:px-10 sm:py-8 border-b border-slate-50 text-center flex-shrink-0">
          <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-widest uppercase">
            TIMESHEET DETAILS
          </h2>
          <div className="flex items-center justify-center gap-3 mt-2">
            <p className="text-sm text-slate-500">{timesheet.name}</p>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(timesheet.status)}`}>
              {timesheet.status}
            </span>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6 sm:p-10 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* BASIC INFO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                EMPLOYEE
              </label>
              <p className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium">
                {timesheet.employeeName}
              </p>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                DATE
              </label>
              <p className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium">
                {new Date(timesheet.date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                SUBMITTED HOURS
              </label>
              <p className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium">
                {timesheet.submittedHours}
              </p>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                APPROVED HOURS
              </label>
              <p className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium">
                {timesheet.approvedHours || 0}
              </p>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              DESCRIPTION
            </label>
            <div className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium whitespace-pre-line min-h-[100px]">
              {timesheet.description || "No description provided"}
            </div>
          </div>

          {/* TIME LOGS */}
          {timesheet.timeLogs?.length > 0 && (
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                TIME LOGS
              </label>
              <div className="space-y-2">
                {timesheet.timeLogs.map((log) => (
                  <div key={log._id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-700 text-sm">{log.job}</span>
                      <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-xs">
                        {log.hours} HRS
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm">{log.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ATTACHMENTS */}
          {timesheet.attachments?.length > 0 && (
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                ATTACHMENTS
              </label>
              <div className="flex flex-wrap gap-2">
                {timesheet.attachments.map((attachment, idx) => (
                  <a
                    key={attachment._id || idx}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <span className="truncate max-w-[150px]">
                      {attachment.originalname}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* DISCUSSION SECTION */}
          <div className="border-t border-slate-200 pt-6">
            <label className="block text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest">
              DISCUSSION
            </label>
            
            {/* Message List */}
            <div className="space-y-4 mb-4">
              {timesheet.comments?.length > 0 ? (
                timesheet.comments.map((comment, i) => (
                  <div key={i} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                          {comment.author.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-slate-800">{comment.author}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {format(new Date(comment.time), "MMM dd, HH:mm")}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 pl-8">{comment.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-slate-400 italic py-4">No comments yet.</p>
              )}
            </div>

            {/* Input Section */}
            <div className="relative">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Type your reply..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none h-14"
              />
              <button
                onClick={handleSendComment}
                disabled={sending || !commentText.trim()}
                className="absolute right-2 top-2 p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-all"
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <FaPaperPlane />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-6 sm:px-10 sm:py-8 border-t border-slate-100 flex gap-3 sm:gap-4 bg-white flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 sm:py-4 bg-[#64748b] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-100 hover:brightness-110 active:scale-95 transition-all"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewTimesheetModal;
