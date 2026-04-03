import React, { useState } from "react";
import { FaTimes, FaPaperPlane } from "react-icons/fa";
import { downloadFile } from "../utils/downloadFile";
import timesheetApi from "../api/timesheetApi";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { Paperclip } from "lucide-react";
import { validateDescription } from "../utils/validationUtils";

const ApproveTimesheetViewModal = ({ 
  timesheet, 
  onClose, 
  onApprove, 
  onReject,
  loading,
  isApprovedTab = false,
  onCommentAdded = () => {} 
}) => {
  const [approvedHours, setApprovedHours] = useState(timesheet?.submittedHours || 0);
  const [newComment, setNewComment] = useState("");
  const [errors, setErrors] = useState({});
  const [sendingComment, setSendingComment] = useState(false);
  const [comments, setComments] = useState(timesheet?.comments || []);
  
  if (!timesheet) return null;

  const handleApprove = () => {
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
      setErrors(prev => ({ ...prev, comment: error }));
      return;
    }
    setErrors(prev => ({ ...prev, comment: null }));

    try {
      setSendingComment(true);
      const updatedTimesheet = await timesheetApi.addTimesheetComment(timesheet._id, newComment);
      setComments(updatedTimesheet.comments || []);
      setNewComment("");
      onCommentAdded(); // Refresh parent if needed
      toast.success("Comment added");
    } catch (err) {
      toast.error("Failed to add comment");
    } finally {
      setSendingComment(false);
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
            {isApprovedTab ? "APPROVED TIMESHEET DETAILS" : "TIMESHEET APPROVAL"}
          </h2>
          <div className="flex items-center justify-center gap-3 mt-2">
            <p className="text-sm text-slate-500">{timesheet.name}</p>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(timesheet.status)}`}>
              {timesheet.status}
            </span>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6 sm:p-10 space-y-6 overflow-y-auto custom-scrollbar">
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
                {isApprovedTab ? "APPROVED HOURS" : "CURRENT APPROVED HOURS"}
              </label>
              <p className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium">
                {timesheet.approvedHours || 0}
              </p>
            </div>
          </div>

          {/* APPROVE HOURS INPUT (Only for pending timesheets in pending tab) */}
          {!isApprovedTab && timesheet.status === "Pending" && (
            <>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                  APPROVE HOURS*
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max={timesheet.submittedHours}
                  value={approvedHours}
                  onChange={(e) => setApprovedHours(parseFloat(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 font-medium"
                  placeholder="Enter approved hours"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Adjust hours if needed (max: {timesheet.submittedHours}h)
                </p>
              </div>


            </>
          )}

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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {timesheet.attachments.map((attachment, idx) => (
                  <button
                    key={attachment._id || idx}
                    onClick={() => downloadFile(attachment.blobName || attachment.url, attachment.originalname)}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-blue-200 transition-all group text-left"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
                        {attachment.originalname?.split('.').pop().toUpperCase() || "FILE"}
                      </div>
                      <span className="text-xs font-bold text-slate-700 truncate">
                        {attachment.originalname || "Attachment"}
                      </span>
                    </div>
                    <div className="text-slate-400 group-hover:text-blue-600">
                      <Paperclip size={16} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* DISCUSSION SECTION */}
          <div className="pt-6 border-t border-slate-100">
            <label className="block text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest">
              DISCUSSION
            </label>
            
            {/* Comment Input */}
            <div className={`bg-slate-50 p-2 rounded-2xl border ${errors.comment ? 'border-red-400' : 'border-slate-200'} flex items-center gap-2 focus-within:ring-2 focus-within:ring-blue-100 transition-all mb-1`}>
              <textarea 
                value={newComment}
                onChange={(e) => {
                  setNewComment(e.target.value);
                  if (errors.comment) setErrors(prev => ({ ...prev, comment: null }));
                }}
                placeholder="Type your reply here..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-3 resize-none h-12 font-medium"
              ></textarea>
              <button 
                onClick={handleAddComment}
                disabled={sendingComment || !newComment.trim()}
                className="p-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {sendingComment ? <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent"/> : <FaPaperPlane className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex justify-between items-center mb-6 px-2">
              {errors.comment ? (
                <p className="text-[10px] text-red-500 font-bold">{errors.comment}</p>
              ) : <div />}
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">{newComment.length}/200</p>
            </div>

            {/* Comments List */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {comments.length > 0 ? (
                [...comments].reverse().map((c, idx) => (
                  <div key={c._id || idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
                    {c.avatar ? (
                      <img src={c.avatar} alt="" className="w-8 h-8 rounded-full border border-slate-100 object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {c.author?.charAt(0) || "U"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-sm text-slate-800 truncate">{c.author}</span>
                        <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap ml-2">
                          {format(new Date(c.time), "MMM dd, hh:mm a")}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 font-medium break-words">{c.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-400 text-xs italic py-4">No comments yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-6 sm:px-10 sm:py-8 border-t border-slate-100 flex gap-3 sm:gap-4 bg-white flex-shrink-0">
          {!isApprovedTab && timesheet.status === "Pending" ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 sm:py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={handleReject}
                disabled={loading}
                className="flex-1 py-3 sm:py-4 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-100 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? "PROCESSING..." : "REJECT"}
              </button>
              <button
                onClick={handleApprove}
                disabled={loading || approvedHours <= 0}
                className="flex-1 py-3 sm:py-4 bg-[#64748b] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-100 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? "PROCESSING..." : "APPROVE"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="w-full py-3 sm:py-4 bg-[#64748b] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-100 hover:brightness-110 active:scale-95 transition-all"
              >
                CLOSE
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApproveTimesheetViewModal;