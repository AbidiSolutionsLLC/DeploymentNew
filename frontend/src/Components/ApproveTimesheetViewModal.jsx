import React, { useState } from "react";
import { FaPaperPlane, FaEye, FaDownload } from "react-icons/fa";
import { downloadFile } from "../utils/downloadFile";
import timesheetApi from "../api/timesheetApi";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { Paperclip } from "lucide-react";
import { validateDescription, getApiError } from "../utils/validationUtils";
import GlassModal from "./ui/GlassModal";
import GlassButton from "./ui/GlassButton";
import { STATUS_VARIANTS, resolveStatusVariant } from "./StatusBadge";

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
 toast.error(getApiError(err, "Failed to add comment"));
 } finally {
 setSendingComment(false);
 }
 };

 const getStatusColor = (status) => STATUS_VARIANTS[resolveStatusVariant(status)]?.badge || STATUS_VARIANTS.neutral.badge;

 return (
 <GlassModal
 isOpen={!!timesheet}
 onClose={onClose}
 title={
 <div className="flex flex-col items-center">
 <span>{isApprovedTab ? "APPROVED TIMESHEET DETAILS" : "TIMESHEET APPROVAL"}</span>
 <div className="flex items-center justify-center gap-3 mt-2">
 <p className="text-sm font-medium text-muted dark:text-muted lowercase capitalize">{timesheet.name}</p>
 <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${getStatusColor(timesheet.status)}`}>
 {timesheet.status}
 </span>
 </div>
 </div>
 }
 maxWidth="max-w-2xl"
 footer={
 <>
 {!isApprovedTab && timesheet.status === "Pending" ? (
 <>
 <GlassButton variant="ghost" onClick={onClose} disabled={loading}>
 CANCEL
 </GlassButton>
 <GlassButton 
 variant="danger" 
 onClick={handleReject} 
 isLoading={loading}
 >
 {loading ? "PROCESSING..." : "REJECT"}
 </GlassButton>
 <GlassButton 
 variant="primary" 
 onClick={handleApprove} 
 isLoading={loading}
 disabled={approvedHours <= 0}
 >
 {loading ? "PROCESSING..." : "APPROVE"}
 </GlassButton>
 </>
 ) : (
 <GlassButton variant="secondary" onClick={onClose} className="w-full">
 CLOSE
 </GlassButton>
 )}
 </>
 }
 >
 <div className="space-y-6">
 {/* BASIC INFO */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-[10px] font-black text-muted dark:text-muted mb-2 uppercase tracking-widest">
 EMPLOYEE
 </label>
 <p className="w-full bg-surface/50 dark:bg-slate-800/50 border border-border-subtle dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-heading dark:text-white font-medium">
 {timesheet.employeeName}
 </p>
 </div>
 <div>
 <label className="block text-[10px] font-black text-muted dark:text-muted mb-2 uppercase tracking-widest">
 DATE
 </label>
 <p className="w-full bg-surface/50 dark:bg-slate-800/50 border border-border-subtle dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-heading dark:text-white font-medium">
 {new Date(timesheet.date).toLocaleDateString()}
 </p>
 </div>
 <div>
 <label className="block text-[10px] font-black text-muted dark:text-muted mb-2 uppercase tracking-widest">
 SUBMITTED HOURS
 </label>
 <p className="w-full bg-surface/50 dark:bg-slate-800/50 border border-border-subtle dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-heading dark:text-white font-medium">
 {timesheet.submittedHours}
 </p>
 </div>
 <div>
 <label className="block text-[10px] font-black text-muted dark:text-muted mb-2 uppercase tracking-widest">
 {isApprovedTab ? "APPROVED HOURS" : "CURRENT APPROVED HOURS"}
 </label>
 <p className="w-full bg-surface/50 dark:bg-slate-800/50 border border-border-subtle dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-heading dark:text-white font-medium">
 {timesheet.approvedHours || 0}
 </p>
 </div>
 </div>

 {/* APPROVE HOURS INPUT (Only for pending timesheets in pending tab) */}
 {!isApprovedTab && timesheet.status === "Pending" && (
 <div>
 <label className="block text-[10px] font-black text-muted dark:text-muted mb-2 uppercase tracking-widest">
 APPROVE HOURS*
 </label>
 <input
 type="number"
 step="0.5"
 min="0"
 max={timesheet.submittedHours}
 value={approvedHours}
 onChange={(e) => setApprovedHours(parseFloat(e.target.value))}
 className="glass-input w-full"
 placeholder="Enter approved hours"
 />
 <p className="text-[10px] text-muted dark:text-muted mt-1 uppercase tracking-widest">
 Adjust hours if needed (max: {timesheet.submittedHours}h)
 </p>
 </div>
 )}

 {/* DESCRIPTION */}
 <div>
 <label className="block text-[10px] font-black text-muted dark:text-muted mb-2 uppercase tracking-widest">
 DESCRIPTION
 </label>
 <div className="w-full bg-surface/50 dark:bg-slate-800/50 border border-border-subtle dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-heading dark:text-white font-medium whitespace-pre-line min-h-[100px]">
 {timesheet.description || "No description provided"}
 </div>
 </div>

 {/* TIME LOGS */}
 {timesheet.timeLogs?.length > 0 && (
 <div>
 <label className="block text-[10px] font-black text-muted dark:text-muted mb-2 uppercase tracking-widest">
 TIME LOGS
 </label>
 <div className="space-y-2">
 {timesheet.timeLogs.map((log) => (
 <div key={log._id} className="p-4 bg-surface/50 dark:bg-slate-800/50 rounded-xl border border-border-subtle dark:border-slate-700">
 <div className="flex justify-between items-center mb-2">
 <span className="font-bold text-heading dark:text-white text-sm">{log.job}</span>
 <span className="font-bold text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full text-xs">
 {log.hours} HRS
 </span>
 </div>
 <p className="text-muted dark:text-muted text-sm">{log.description}</p>
 
 {/* Time Log Attachments */}
 {log.attachments?.length > 0 && (
 <div className="mt-3 pt-3 border-t border-border-subtle dark:border-slate-700/50">
 <p className="text-[9px] font-black text-muted dark:text-muted uppercase tracking-widest mb-2">
 LOG ATTACHMENTS
 </p>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 {log.attachments.map((file, fIdx) => (
 <div 
 key={file._id || fIdx}
 className="flex items-center justify-between p-2 bg-surface dark:bg-slate-800 rounded-lg border border-border-subtle dark:border-slate-700 group"
 >
 <div className="flex items-center gap-2 min-w-0">
 <div className="w-6 h-6 bg-surface/50 dark:bg-slate-700 text-muted dark:text-muted rounded flex items-center justify-center text-[8px] font-bold shrink-0">
 {file.originalname?.split('.').pop().toUpperCase() || "FILE"}
 </div>
 <span className="text-[10px] font-bold text-heading dark:text-white truncate">
 {file.originalname || "Attachment"}
 </span>
 </div>
 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
 <button
 onClick={() => window.open(file.url, '_blank')}
 className="p-1.5 text-brand-primary hover:bg-brand-primary/10 rounded"
 title="Preview"
 >
 <FaEye size={12} />
 </button>
 <button
 onClick={() => downloadFile(file.blobName || file.url, file.originalname)}
 className="p-1.5 text-brand-secondary hover:bg-brand-secondary/10 rounded"
 title="Download"
 >
 <FaDownload size={10} />
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 )}

 {/* ATTACHMENTS */}
 {timesheet.attachments?.length > 0 && (
 <div>
 <label className="block text-[10px] font-black text-muted dark:text-muted mb-2 uppercase tracking-widest">
 ATTACHMENTS
 </label>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 {timesheet.attachments.map((attachment, idx) => (
 <button
 key={attachment._id || idx}
 onClick={() => downloadFile(attachment.blobName || attachment.url, attachment.originalname)}
 className="w-full flex items-center justify-between p-3 bg-surface/50 dark:bg-slate-800/50 rounded-xl border border-border-subtle dark:border-slate-700 hover:bg-brand-primary/5 hover:border-brand-primary/30 transition-all group text-left"
 >
 <div className="flex items-center gap-2 overflow-hidden">
 <div className="w-8 h-8 bg-brand-primary/10 text-brand-primary rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
 {attachment.originalname?.split('.').pop().toUpperCase() || "FILE"}
 </div>
 <span className="text-xs font-bold text-heading dark:text-white truncate">
 {attachment.originalname || "Attachment"}
 </span>
 </div>
 <div className="text-muted dark:text-muted group-hover:text-brand-primary">
 <Paperclip size={16} />
 </div>
 </button>
 ))}
 </div>
 </div>
 )}

 {/* DISCUSSION SECTION */}
 <div className="pt-6 border-t border-border-subtle dark:border-slate-700">
 <label className="block text-[10px] font-black text-muted dark:text-muted mb-4 uppercase tracking-widest">
 DISCUSSION
 </label>
 
 {/* Comment Input */}
 <div className={`bg-surface/50 dark:bg-slate-800/50 p-2 rounded-2xl border ${errors.comment ? 'border-red-400 ring-1 ring-red-400' : 'border-border-subtle dark:border-slate-700'} flex items-center gap-2 focus-within:ring-2 focus-within:ring-brand-primary transition-all mb-1`}>
 <textarea 
 value={newComment}
 onChange={(e) => {
 setNewComment(e.target.value);
 if (errors.comment) setErrors(prev => ({ ...prev, comment: null }));
 }}
 placeholder="Type your reply here..."
 className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-3 resize-none h-12 font-medium outline-none text-heading dark:text-white"
 ></textarea>
 <button 
 onClick={handleAddComment}
 disabled={sendingComment || !newComment.trim()}
 className="btn-ghost flex items-center justify-center p-3 rounded-xl"
 >
 {sendingComment ? <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"/> : <FaPaperPlane className="w-4 h-4" />}
 </button>
 </div>
 <div className="flex justify-between items-center mb-6 px-2">
 {errors.comment ? (
 <p className="text-[10px] text-red-500 font-bold">{errors.comment}</p>
 ) : <div />}
 <p className="text-[10px] text-muted dark:text-muted uppercase tracking-widest">{newComment.length}/200</p>
 </div>

 {/* Comments List */}
 <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar-visible">
 {comments.length > 0 ? (
 [...comments].reverse().map((c, idx) => (
 <div key={c._id || idx} className="bg-surface dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-border-subtle dark:border-slate-700 flex gap-4">
 {c.avatar ? (
 <img src={c.avatar} alt="" className="w-8 h-8 rounded-full border border-border-subtle dark:border-slate-700 object-cover" />
 ) : (
 <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xs font-bold shrink-0">
 {c.author?.charAt(0) || "U"}
 </div>
 )}
 <div className="flex-1 min-w-0">
 <div className="flex justify-between items-center mb-1">
 <span className="font-bold text-sm text-heading dark:text-white truncate">{c.author}</span>
 <span className="text-[10px] text-muted dark:text-muted font-bold whitespace-nowrap ml-2">
 {format(new Date(c.time), "MMM dd, hh:mm a")}
 </span>
 </div>
 <p className="text-sm text-muted dark:text-slate-300 font-medium break-words">{c.content}</p>
 </div>
 </div>
 ))
 ) : (
 <p className="text-center text-muted dark:text-muted text-xs italic py-4">No comments yet.</p>
 )}
 </div>
 </div>
 </div>
 </GlassModal>
 );
};

export default ApproveTimesheetViewModal;