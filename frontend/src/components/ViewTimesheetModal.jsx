import React, { useState } from "react";
import { FaPaperPlane, FaComment } from "react-icons/fa";
import { Paperclip } from "lucide-react";
import { downloadFile } from "../utils/downloadFile";
import { toast } from "react-toastify";
import { format } from "date-fns";
import api from "../axios";
import { validateDescription } from "../utils/validationUtils";
import GlassModal from "./ui/GlassModal";
import GlassButton from "./ui/GlassButton";
import Loader from "./ui/Loader";

const ViewTimesheetModal = ({ timesheet: initialTimesheet, onClose, onCommentAdded }) => {
 const [timesheet, setTimesheet] = useState(initialTimesheet);
 const [commentText, setCommentText] = useState("");
 const [errors, setErrors] = useState({});
 const [sending, setSending] = useState(false);

 if (!timesheet) return null;

 const handleSendComment = async () => {
 const error = validateDescription(commentText, { min: 5, max: 200, required: true });
 if (error) {
 setErrors(prev => ({ ...prev, comment: error }));
 return;
 }
 setErrors(prev => ({ ...prev, comment: null }));

 setSending(true);
 try {
 const { data: updatedTimesheet } = await api.post(`/timesheets/${timesheet._id}/comment`, {
 content: commentText
 });
 
 setTimesheet(updatedTimesheet);
 setCommentText("");
 setErrors({});
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
 case "Approved": return "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-400 dark:bg-green-900/30 dark:text-green-400";
 case "Rejected": return "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-400 dark:bg-red-900/30 dark:text-red-400";
 default: return "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400 dark:bg-amber-900/30 dark:text-amber-400";
 }
 };

 return (
 <GlassModal
 isOpen={!!timesheet}
 onClose={onClose}
 title={
 <div className="flex flex-col items-center">
 <span>TIMESHEET DETAILS</span>
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
 <GlassButton variant="secondary" onClick={onClose} className="w-full">
 CLOSE
 </GlassButton>
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
 APPROVED HOURS
 </label>
 <p className="w-full bg-surface/50 dark:bg-slate-800/50 border border-border-subtle dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-heading dark:text-white font-medium">
 {timesheet.approvedHours || 0}
 </p>
 </div>
 </div>

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
 {timesheet.timeLogs?.filter(Boolean).map((log) => (
 <div key={log._id} className="p-4 bg-surface/50 dark:bg-slate-800/50 rounded-xl border border-border-subtle dark:border-slate-700">
 <div className="flex justify-between items-center mb-2">
 <span className="font-bold text-heading dark:text-white text-sm">{log.job || log.jobTitle || 'Unknown Job'}</span>
 <span className="font-bold text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full text-xs">
 {log.hours} HRS
 </span>
 </div>
 <p className="text-muted dark:text-muted text-sm">{log.description}</p>
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
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {timesheet.attachments.map((attachment, idx) => (
 <button
 key={attachment._id || idx}
 onClick={() => downloadFile(attachment.blobName || attachment.url, attachment.originalname)}
 className="w-full flex items-center justify-between p-3 bg-surface/50 dark:bg-slate-800/50 rounded-xl border border-border-subtle dark:border-slate-700 hover:bg-brand-primary/5 hover:border-brand-primary/30 transition-all group text-left"
 >
 <div className="flex items-center gap-2 overflow-hidden">
 <div className="w-8 h-8 bg-brand-primary/10 rounded-lg flex items-center justify-center text-brand-primary font-bold text-xs shrink-0">
 {(attachment.originalname?.split('.').pop() || "FILE").toUpperCase()}
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
 <div className="border-t border-border-subtle dark:border-slate-700 pt-6">
 <h3 className="text-sm font-black text-heading dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
 <FaComment className="text-muted dark:text-muted" />
 DISCUSSION
 </h3>
 
 {/* Message List */}
 <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto custom-scrollbar-visible pr-2">
 {timesheet.comments?.length > 0 ? (
 timesheet.comments.map((comment, i) => (
 <div key={i} className="bg-surface/50 dark:bg-slate-800/50 rounded-xl p-3 border border-border-subtle dark:border-slate-700">
 <div className="flex items-start gap-3">
 <div className="w-8 h-8 flex items-center justify-center bg-brand-primary/10 text-brand-primary rounded-full text-sm font-bold shrink-0">
 {comment.author.charAt(0)}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex justify-between items-start mb-1">
 <span className="text-sm font-bold text-heading dark:text-white">{comment.author}</span>
 <span className="text-xs text-muted dark:text-muted">
 {format(new Date(comment.time), "MMM dd, HH:mm")}
 </span>
 </div>
 <p className="text-sm text-heading dark:text-slate-300 whitespace-pre-wrap break-words">{comment.content}</p>
 </div>
 </div>
 </div>
 ))
 ) : (
 <div className="text-center py-8">
 <FaComment className="w-12 h-12 text-muted dark:text-muted mx-auto mb-3 opacity-50" />
 <p className="text-sm text-muted dark:text-muted font-medium">No discussion yet</p>
 </div>
 )}
 </div>

 {/* Input Section */}
 <div className="relative">
 <textarea
 value={commentText}
 onChange={(e) => {
 setCommentText(e.target.value);
 if (errors.comment) setErrors(prev => ({ ...prev, comment: null }));
 }}
 placeholder="Type your reply here..."
 className={`glass-input w-full resize-none pr-12 ${errors.comment ? 'border-red-400 ring-1 ring-red-400' : ''}`}
 rows="3"
 />
 <p className="text-[10px] text-muted dark:text-muted text-right mt-1">
 {commentText.length}/200
 </p>
 {errors.comment && (
 <p className="text-xs text-red-500 mt-1">{errors.comment}</p>
 )}
 <button
 onClick={handleSendComment}
 disabled={sending || !commentText.trim()}
 className="btn-ghost absolute right-3 bottom-8 p-2 rounded-lg"
 title="Send response"
 >
 {sending ? (
  <Loader variant="spinner" size="sm" className="text-white" />
 ) : (
 <FaPaperPlane size={16} />
 )}
 </button>
 </div>
 </div>
 </div>
 </GlassModal>
 );
};

export default ViewTimesheetModal;
