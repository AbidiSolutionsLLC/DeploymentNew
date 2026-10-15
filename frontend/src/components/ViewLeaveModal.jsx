import React, { useState, useEffect } from "react";
import {
  FaCalendarAlt,
  FaUser,
  FaEnvelope,
  FaClock,
  FaFileAlt,
  FaComment,
  FaTimes
} from "react-icons/fa";
import {
  Send,
  Clock,
  Paperclip,
  Edit2
} from "lucide-react";
import { FiTrash2 } from "react-icons/fi";
import ModernSelect from "./ui/ModernSelect";
import api from "../axios";
import Toast from "../components/Toast";
import { useSelector } from "react-redux";
import { validateDescription, getApiError } from "../utils/validationUtils";
import { parseISOToLocalDate, formatDisplayDate } from "../utils/dateUtils";
import GlassModal from "./ui/GlassModal";
import GlassButton from "./ui/GlassButton";
import { useConfirm } from "../context/ConfirmContext";
import Loader from "./ui/Loader";
import { STATUS_VARIANTS, resolveStatusVariant } from "./StatusBadge";
 
const ViewLeaveModal = ({
 isOpen,
 setIsOpen,
 leaveData,
 onStatusChange,
 fetchLeaveRequests,
 isAdminPortal = false,
}) => {
 const confirm = useConfirm();
 const { user } = useSelector((state) => state.auth);

 const userRole = (user?.user?.role || user?.role || "").replace(/\s+/g, '').toLowerCase();
 const canUpdateStatus = isAdminPortal && ['superadmin', 'admin', 'manager'].includes(userRole);

 const [selectedStatus, setSelectedStatus] = useState(leaveData?.status || "Pending");
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [responses, setResponses] = useState([]);
 const [newResponse, setNewResponse] = useState("");
 const [loadingResponses, setLoadingResponses] = useState(false);
 const [toastMsg, setToastMsg] = useState(null);
 const [editingResponseId, setEditingResponseId] = useState(null);
 const [editContent, setEditContent] = useState("");
 const [attachment, setAttachment] = useState(null);
 const [errors, setErrors] = useState({});

 const showToast = (message, type = "success") => {
 setToastMsg({ message, type });
 setTimeout(() => setToastMsg(null), 3000);
 };
 
  useEffect(() => {
  let intervalId;
  
  const startPolling = () => {
  fetchResponses(false);
  intervalId = setInterval(() => {
  fetchResponses(true);
  }, 5000);
  };
  
  if (isOpen && leaveData?.id) {
  startPolling();
  }
  
  return () => {
  if (intervalId) {
  clearInterval(intervalId);
  }
  };
  }, [isOpen, leaveData?.id]);
  
   const [responsesError, setResponsesError] = useState(false);
 
   const fetchResponses = async (isPolling = false) => {
   try {
   if (!isPolling) setLoadingResponses(true);
   setResponsesError(false);
   const response = await api.get(`/leaves/${leaveData.id}/responses`);
   // Axios interceptor unwraps ApiResponse.success, so response.data is the actual payload
   setResponses(response.data || []);
   } catch (error) {
   console.error("Failed to fetch responses:", error);
   setResponsesError(true);
   } finally {
   if (!isPolling) setLoadingResponses(false);
   }
   };
 
 const resetState = () => {
 setResponses([]);
 setNewResponse("");
 setEditingResponseId(null);
 setEditContent("");
 setAttachment(null);
 setToastMsg(null);
 setErrors({});
 };
 
 const handleStatusChange = async () => {
 if (selectedStatus === leaveData.status || selectedStatus === "Pending") return;
 
 setIsSubmitting(true);
 try {
 await onStatusChange(leaveData.id, selectedStatus);
 if (typeof fetchLeaveRequests === 'function') {
 await fetchLeaveRequests();
 }
 setIsOpen(false);
 resetState();
 } catch (error) {
 console.error("Failed to update status:", error);
 showToast(getApiError(error, "Failed to update status"), "error");
 } finally {
 setIsSubmitting(false);
 }
 };
 
 const handleSubmitResponse = async () => {
 const error = validateDescription(newResponse, { min: 10, max: 500, required: true });
 if (error) {
 setErrors(prev => ({ ...prev, newResponse: error }));
 return;
 }
 setErrors(prev => ({ ...prev, newResponse: null }));
 
 if (!newResponse.trim() && !attachment) return;
 
 try {
 const response = await api.post(`/leaves/${leaveData.id}/responses`, {
 content: newResponse.trim()
 });
 
 setResponses(prev => [...prev, response.data]);
 setNewResponse("");
 setAttachment(null);
 
 showToast("Response submitted successfully");
 } catch (error) {
 console.error("Failed to submit response:", error);
 showToast(getApiError(error, "Failed to submit response"), "error");
 }
 };
 
 const handleUpdateResponse = async (responseId) => {
 const error = validateDescription(editContent, { min: 10, max: 500, required: true });
 if (error) {
 setErrors(prev => ({ ...prev, editContent: error }));
 return;
 }
 setErrors(prev => ({ ...prev, editContent: null }));
 
 if (!editContent.trim()) return;
 
 try {
 const response = await api.patch(`/leaves/${leaveData.id}/responses/${responseId}`, {
 content: editContent.trim()
 });
 
 setResponses(prev =>
 prev.map(res =>
 res._id === responseId
 ? { ...res, ...response.data, isEdited: true, editedAt: new Date() }
 : res
 )
 );
 
 setEditingResponseId(null);
 setEditContent("");
 showToast("Response updated successfully");
 } catch (error) {
 console.error("Failed to update response:", error);
 showToast(getApiError(error, "Failed to update response"), "error");
 }
 };
 
 const handleDeleteResponse = async (responseId) => {
 await confirm({ 
  title: "Delete Response", 
  message: "Are you sure you want to delete this response?",
  onConfirmAction: async () => {
    try {
      await api.delete(`/leaves/${leaveData.id}/responses/${responseId}`);
      setResponses(prev => prev.filter(res => res._id !== responseId));
      showToast("Response deleted successfully");
    } catch (error) {
      console.error("Failed to delete response:", error);
      showToast(getApiError(error, "Failed to delete response"), "error");
      throw error;
    }
  }
 });
 };
 
 const handleAttachmentChange = (e) => {
 const file = e.target.files[0];
 if (file) {
 if (file.size > 25 * 1024 * 1024) { 
 showToast("File size must be less than 25MB", "error");
 return;
 }
 setAttachment(file);
 }
 };
 
 const handleKeyPress = (e) => {
 if (e.key === 'Enter' && !e.shiftKey) {
 e.preventDefault();
 handleSubmitResponse();
 }
 };
 
 const statusBadge = (status) =>
 STATUS_VARIANTS[resolveStatusVariant(status)]?.badge || STATUS_VARIANTS.neutral.badge;
 
 const statusDot = (status) =>
 STATUS_VARIANTS[resolveStatusVariant(status)]?.dot || STATUS_VARIANTS.neutral.dot;
 
 const getAvatarContent = (response) => {
 if (response.author?.avatar) {
 return <img src={response.author.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />;
 }
 return response.author?.name?.charAt(0) || response.role?.charAt(0) || "?";
 };
 
 const formatDate = (dateString) => {
 return new Date(dateString).toLocaleString('en-US', {
 month: 'short',
 day: 'numeric',
 hour: '2-digit',
 minute: '2-digit'
 });
 };
 
 const isUserResponse = (response) => {
 if (response.author?._id === user.user?._id) return true;
 if (response.author === user?.user?._id) return true;
 if (response.author?.email === user?.user?.email) return true;
 return false;
 };
 
 if (!isOpen || !leaveData) return null;
 
 return (
 <>
 {toastMsg && (
 <Toast
 message={toastMsg.message}
 type={toastMsg.type}
 onClose={() => setToastMsg(null)}
 />
 )}

 <GlassModal
 isOpen={isOpen}
 onClose={() => !isSubmitting && (setIsOpen(false), resetState())}
  title={
  <div className="flex flex-col">
  <span>LEAVE REQUEST DETAILS</span>
  <div className="mt-2">
  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border ${statusBadge(leaveData.status)}`}>
  <span className={`w-1.5 h-1.5 rounded-full ${statusDot(leaveData.status)}`} />
  {leaveData.status}
  </span>
  </div>
  </div>
  }
  maxWidth="max-w-6xl"
 >
 <div className="flex flex-col lg:flex-row h-full">
 {/* LEFT COLUMN - LEAVE DETAILS */}
 <div className="lg:w-1/2 border-b lg:border-b-0 lg:border-r border-border-subtle lg:pr-6 pb-6 lg:pb-0 mb-6 lg:mb-0">
 <div className="space-y-6">
 {/* Employee Info */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="bg-app border border-border-subtle p-4 rounded-xl">
 <div className="flex items-center gap-3 mb-2">
 <FaUser className="text-muted dark:text-muted" />
 <span className="text-[10px] font-black text-muted dark:text-muted uppercase tracking-widest">Employee</span>
 </div>
 <p className="text-sm font-bold text-heading dark:text-white">{leaveData.employeeName || leaveData.name}</p>
 <p className="text-xs text-muted dark:text-muted mt-1">
 {leaveData.employee?.department || "Department not specified"}
 </p>
 </div>
 
 <div className="bg-app border border-border-subtle p-4 rounded-xl">
 <div className="flex items-center gap-3 mb-2">
 <FaEnvelope className="text-muted dark:text-muted" />
 <span className="text-[10px] font-black text-muted dark:text-muted uppercase tracking-widest">Email</span>
 </div>
 <p className="text-sm text-heading dark:text-white truncate">{leaveData.email}</p>
 </div>
 </div>

 {/* Dates */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="bg-app border border-border-subtle p-4 rounded-xl">
 <div className="flex items-center gap-3 mb-2">
 <FaCalendarAlt className="text-muted dark:text-muted" />
 <span className="text-[10px] font-black text-muted dark:text-muted uppercase tracking-widest">Start Date</span>
 </div>
 <p className="text-sm font-medium text-heading dark:text-white">
 {formatDisplayDate(leaveData.startDate)}
 </p>
 </div>
 
 <div className="bg-app border border-border-subtle p-4 rounded-xl">
 <div className="flex items-center gap-3 mb-2">
 <FaCalendarAlt className="text-muted dark:text-muted" />
 <span className="text-[10px] font-black text-muted dark:text-muted uppercase tracking-widest">End Date</span>
 </div>
 <p className="text-sm font-medium text-heading dark:text-white">
 {formatDisplayDate(leaveData.endDate)}
 </p>
 </div>
 </div>

 {/* Duration & Type */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="bg-app border border-border-subtle p-4 rounded-xl">
 <div className="flex items-center gap-3 mb-2">
 <FaClock className="text-muted dark:text-muted" />
 <span className="text-[10px] font-black text-muted dark:text-muted uppercase tracking-widest">Duration</span>
 </div>
 <p className="text-sm font-medium text-heading dark:text-white">
 {leaveData.duration ||
 (() => {
 const daysCount = Math.ceil((parseISOToLocalDate(leaveData.endDate) - parseISOToLocalDate(leaveData.startDate)) / (1000 * 60 * 60 * 24)) + 1;
 return `${daysCount} day${daysCount === 1 ? '' : 's'}`;
 })()}
 </p>
 </div>
 
 <div className="bg-app border border-border-subtle p-4 rounded-xl">
 <div className="flex items-center gap-3 mb-2">
 <span className="text-[10px] font-black text-muted dark:text-muted uppercase tracking-widest">Leave Type</span>
 </div>
  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border bg-amber-100 text-brand-text border-amber-200 uppercase tracking-wide">
  {leaveData.leaveType}
  </span>
 </div>
 </div>

 {/* Reason */}
 {leaveData.reason && leaveData.reason !== "-" && (
 <div className="bg-app border border-border-subtle p-4 rounded-xl">
 <div className="flex items-center gap-3 mb-2">
 <FaFileAlt className="text-muted dark:text-muted" />
 <span className="text-[10px] font-black text-muted dark:text-muted uppercase tracking-widest">Reason</span>
 </div>
 <p className="text-sm text-heading dark:text-white whitespace-pre-line">{leaveData.reason}</p>
 </div>
 )}

 {/* Applied At */}
 <div className="bg-app border border-border-subtle p-4 rounded-xl">
 <div className="flex items-center gap-3 mb-2">
 <Clock size={14} className="text-muted dark:text-muted" />
 <span className="text-[10px] font-black text-muted dark:text-muted uppercase tracking-widest">Applied On</span>
 </div>
 <p className="text-sm text-heading dark:text-white">
 {new Date(leaveData.appliedAt || leaveData.createdAt).toLocaleString()}
 </p>
 </div>

 {/* STATUS UPDATE SECTION */}
 {leaveData.status === "Pending" && canUpdateStatus && (
 <div className="border-t border-border-subtle dark:border-slate-700 pt-6 pb-32">
 <h3 className="text-sm font-black text-heading dark:text-white uppercase tracking-widest mb-4">
 Update Status
 </h3>
 
 <div className="space-y-4">
 <ModernSelect
 label="Select New Status"
 name="status"
 value={selectedStatus}
 onChange={(e) => setSelectedStatus(e.target.value)}
 required
 placeholder="SELECT STATUS"
 options={[
 { value: 'Pending', label: 'SELECT STATUS', disabled: true },
 { value: 'Approved', label: 'APPROVE' },
 { value: 'Rejected', label: 'REJECT' }
 ]}
 className="w-full"
 disabled={isSubmitting}
 />

 <div className="flex gap-3">
 <GlassButton
 variant="secondary"
 onClick={() => setIsOpen(false)}
 disabled={isSubmitting}
 className="flex-1"
 >
 Cancel
 </GlassButton>
 <GlassButton
 variant={selectedStatus === "Approved" ? "primary" : selectedStatus === "Rejected" ? "danger" : "secondary"}
 onClick={handleStatusChange}
 disabled={selectedStatus === "Pending" || selectedStatus === leaveData.status || isSubmitting}
 isLoading={isSubmitting}
 className="flex-1"
 >
 {isSubmitting ? "UPDATING..." : `CONFIRM ${selectedStatus.toUpperCase()}`}
 </GlassButton>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>

 {/* RIGHT COLUMN - DISCUSSION SECTION */}
 <div className="lg:w-1/2 lg:pl-6 flex flex-col min-h-[400px]">
 <h3 className="text-sm font-black text-heading dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
 <FaComment className="text-muted dark:text-muted" />
 DISCUSSION
 </h3>

 {/* Responses List */}
  <div className="flex-1 overflow-y-auto custom-scrollbar mb-4 space-y-3 pr-2">
  {loadingResponses && responses.length === 0 ? (
  <div className="py-4">
    <Loader size="md" text="Loading discussion..." />
  </div>
  ) : responsesError ? (
  <div className="text-center py-8">
    <p className="text-sm text-danger font-medium">Failed to load discussion</p>
    <button
      onClick={() => fetchResponses(false)}
      className="mt-2 text-xs font-black uppercase tracking-wider text-brand-text hover:underline underline-offset-4"
    >
      Try Again
    </button>
  </div>
  ) : responses.length > 0 ? (
 responses.map((response) => (
 <div key={response._id} className="bg-app rounded-xl p-3 border border-border-subtle">
 <div className="flex items-start gap-3">
 {/* Avatar */}
  <div className="w-8 h-8 flex items-center justify-center bg-amber-100 text-brand-text border border-amber-200 rounded-full text-sm font-bold shrink-0 uppercase">
 {getAvatarContent(response)}
 </div>
 
 {/* Content */}
 <div className="flex-1 min-w-0">
 <div className="flex justify-between items-start mb-1">
 <div className="flex items-center gap-2">
 <h4 className="text-sm font-bold text-heading dark:text-white">
 {response.author?.name || response.role || "Unknown User"}
 </h4>
 <span className="text-xs text-muted dark:text-muted uppercase">
 {response.author?.role || response.role}
 </span>
 {response.isEdited && (
 <span className="text-xs text-muted dark:text-muted italic">(edited)</span>
 )}
 </div>
 <div className="flex items-center gap-2">
 <span className="text-xs text-muted dark:text-muted">
 {formatDate(response.time || response.createdAt)}
 </span>
 {/* Action buttons */}
 {!response.isSystemNote && isUserResponse(response) && (
 <div className="flex gap-1">
 <button
 onClick={() => {
 setEditingResponseId(response._id);
 setEditContent(response.content);
 }}
 className="p-1 text-muted dark:text-muted hover:text-brand-primary transition"
 title="Edit"
 >
 <Edit2 size={12} />
 </button>
<button
  onClick={() => handleDeleteResponse(response._id)}
  className="p-1 text-muted dark:text-muted hover:text-red-600 dark:text-red-400 transition"
  title="Delete"
  >
  <FiTrash2 size={12} />
  </button>
 </div>
 )}
 </div>
 </div>
 
 {/* Edit Mode */}
 {editingResponseId === response._id ? (
 <div className="space-y-2">
 <textarea
 value={editContent}
 onChange={(e) => setEditContent(e.target.value)}
 className={`glass-input w-full resize-none bg-white dark:bg-slate-800 ${errors.editContent ? 'border-red-400 ring-1 ring-red-400' : ''}`}
 rows="3"
 />
 <p className="text-[10px] text-muted dark:text-muted text-right">
 {editContent.length}/500
 </p>
 {errors.editContent && (
 <p className="text-xs text-red-500">{errors.editContent}</p>
 )}
 <div className="flex gap-2">
 <GlassButton
 variant="primary"
 size="sm"
 onClick={() => handleUpdateResponse(response._id)}
 >
 Save
 </GlassButton>
 <GlassButton
 variant="ghost"
 size="sm"
 onClick={() => {
 setEditingResponseId(null);
 setEditContent("");
 }}
 >
 Cancel
 </GlassButton>
 </div>
 </div>
 ) : (
 /* Display Mode */
 <p className="text-sm text-heading dark:text-white whitespace-pre-wrap break-words">
 {response.content}
 </p>
 )}
 </div>
 </div>
 </div>
 ))
  ) : (
  <div className="text-center py-10">
  <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-app border border-dashed border-border-accent flex items-center justify-center">
  <FaComment size={22} className="text-brand-text opacity-70" />
  </div>
  <p className="text-sm font-bold text-heading tracking-tight">No discussion yet</p>
  <p className="text-xs text-muted mt-1">Start a conversation about this leave request</p>
  </div>
  )}
 </div>

 {/* New Response Input */}
 <div className="border-t border-border-subtle dark:border-slate-700 pt-4 mt-auto">
 <div className="relative">
 <textarea
 value={newResponse}
 onChange={(e) => setNewResponse(e.target.value)}
 onKeyPress={handleKeyPress}
 className={`glass-input w-full resize-none pr-24 bg-white dark:bg-slate-800 ${errors.newResponse ? 'border-red-400 ring-1 ring-red-400' : ''}`}
 placeholder="Type your response here..."
 rows="3"
 />
 <p className="text-[10px] text-muted dark:text-muted text-right mt-1">
 {newResponse.length}/500
 </p>
 {errors.newResponse && (
 <p className="text-xs text-red-500 mt-1">{errors.newResponse}</p>
 )}
 
  {/* Attachment Button / Preview */}
  {!attachment ? (
   <label className="absolute left-3 bottom-8 p-2 bg-surface border border-border-subtle text-muted rounded-lg hover:bg-card-hover hover:text-brand-text transition cursor-pointer">
  <input
  type="file"
  className="hidden"
  onChange={handleAttachmentChange}
  disabled={isSubmitting}
  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,image/png,image/jpeg,image/jpg"
  />
  <Paperclip size={16} />
  </label>
  ) : (
  <div className="absolute left-3 bottom-8 flex items-center gap-2 bg-amber-100 text-brand-text border border-amber-200 px-3 py-1.5 rounded-lg text-xs">
  <Paperclip size={14} />
  <span className="truncate max-w-[150px] font-medium">{attachment.name}</span>
  <button
  onClick={() => {
  setAttachment(null);
  }}
  className="text-brand-text hover:text-red-600 dark:hover:text-red-400"
  >
  <FaTimes size={10} />
  </button>
  </div>
  )}
 
  {/* Send Button */}
  <button
  onClick={handleSubmitResponse}
  disabled={!newResponse.trim() || isSubmitting}
  className={`absolute right-3 bottom-8 p-2 rounded-lg transition-all ${
    !newResponse.trim() || isSubmitting
      ? "text-muted opacity-50 cursor-not-allowed"
      : "bg-brand text-on-brand shadow-sm hover:bg-brand-accent active:scale-95"
  }`}
  title="Send response"
  >
  <Send size={16} />
  </button>
 </div>
 
 <p className="text-xs text-muted dark:text-muted mt-2 px-1">
 Press <kbd className="px-1.5 py-0.5 bg-app border border-border-subtle rounded text-xs">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-app border border-border-subtle rounded text-xs">Shift+Enter</kbd> for new line
 </p>
 </div>
 </div>
 </div>
 </GlassModal>
 </>
 );
};
 
export default ViewLeaveModal;