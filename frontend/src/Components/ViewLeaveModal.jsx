import React, { useState, useEffect } from "react";
import { 
  FaCalendarAlt, 
  FaUser, 
  FaEnvelope, 
  FaClock, 
  FaFileAlt,
  FaPaperclip,
  FaTrash,
  FaEdit,
  FaCheck,
  FaTimes,
  FaComment
} from "react-icons/fa";
import { 
  Send, 
  ChevronDown, 
  User,
  Clock,
  Paperclip,
  Trash2,
  Edit2
} from "lucide-react";
import ModernSelect from "./ui/ModernSelect";
import api from "../axios";
import Toast from "../Components/Toast";
import { toast } from "react-toastify"; // Import toast
import { useSelector } from "react-redux";

const ViewLeaveModal = ({ 
  isOpen, 
  setIsOpen, 
  leaveData, 
  onStatusChange, 
  fetchLeaveRequests,
}) => {
    const { user } = useSelector((state) => state.auth);
  
  const [selectedStatus, setSelectedStatus] = useState(leaveData?.status || "Pending");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responses, setResponses] = useState([]);
  const [newResponse, setNewResponse] = useState("");
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [toast, setToast] = useState(null);
  const [editingResponseId, setEditingResponseId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [attachment, setAttachment] = useState(null);
console.log(user)
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    let intervalId;

    const startPolling = () => {
      // Call immediately on mount
      fetchResponses();

      // Set up the 5-second timer
      intervalId = setInterval(() => {
        console.log('Fetching responses every 5 seconds...');
        fetchResponses();
      }, 5000);
    };

    if (isOpen && leaveData?.id) {
      startPolling();
    }

    // Cleanup function: This stops the timer when:
    // 1. The component unmounts
    // 2. isOpen or leaveData.id changes
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        console.log('Polling stopped');
      }
    };
  }, [isOpen, leaveData?.id]);

  const fetchResponses = async () => {
    try {
      setLoadingResponses(true);
      const response = await api.get(`/leaves/${leaveData.id}/responses`);
      console.log(response,"wow");
      setResponses(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch responses:", error);
      // showToast("Failed to load responses", "error");
    } finally {
      setLoadingResponses(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      setIsOpen(false);
      resetState();
    }
  };

  const resetState = () => {
    setResponses([]);
    setNewResponse("");
    setEditingResponseId(null);
    setEditContent("");
    setAttachment(null);
    setToast(null);
  };

  const handleStatusChange = async () => {
    if (selectedStatus === leaveData.status || selectedStatus === "Pending") return;
    
    setIsSubmitting(true);
    try {
      await onStatusChange(leaveData.id, selectedStatus);
      await fetchLeaveRequests();
      setIsOpen(false);
      resetState();
    } catch (error) {
      console.error("Failed to update status:", error);
      // showToast(error.response?.data?.message || "Failed to update status", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!newResponse.trim() && !attachment) return;

    try {
      const response = await api.post(`/leaves/${leaveData.id}/responses`, {
        content: newResponse.trim()
      });
      console.log(response.data.data,"response")
      console.log(responses,"local")

      setResponses(prev => [...prev, response.data.data]);
      setNewResponse("");
      setAttachment(null);
      
      showToast("Response submitted successfully");
    } catch (error) {
      console.error("Failed to submit response:", error);
      showToast(error.response?.data?.message || "Failed to submit response", "error");
    }
  };

  const handleUpdateResponse = async (responseId) => {
    if (!editContent.trim()) return;

    try {
      const response = await api.patch(`/leaves/${leaveData.id}/responses/${responseId}`, {
        content: editContent.trim()
      });
      
      setResponses(prev => 
        prev.map(res => 
          res._id === responseId 
            ? { ...res, ...response.data.data, isEdited: true, editedAt: new Date() }
            : res
        )
      );
      
      setEditingResponseId(null);
      setEditContent("");
      showToast("Response updated successfully");
    } catch (error) {
      console.error("Failed to update response:", error);
      showToast(error.response?.data?.message || "Failed to update response", "error");
    }
  };

  const handleDeleteResponse = async (responseId) => {
    if (!window.confirm("Are you sure you want to delete this response?")) return;

    try {
      await api.delete(`/leaves/${leaveData.id}/responses/${responseId}`);
      setResponses(prev => prev.filter(res => res._id !== responseId));
      showToast("Response deleted successfully");
    } catch (error) {
      console.error("Failed to delete response:", error);
      showToast(error.response?.data?.message || "Failed to delete response", "error");
    }
  };

  const handleAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showToast("File size must be less than 5MB", "error");
        return;
      }
      setAttachment(file);
      setNewResponse(prev => prev + `\n[Attached: ${file.name}]`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitResponse();
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "Approved": return "bg-green-100 text-green-800";
      case "Rejected": return "bg-red-100 text-red-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

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

  // Helper function to check if response belongs to current user
  const isUserResponse = (response) => {
    // Check if response has author object with _id that matches currentUser.id
    if (response.author?._id === user.user?._id) {
      return true;
    }
    
    // Check if response has author field that directly matches currentUser.id (string comparison)
    if (response.author === user?.user?._id) {
      return true;
    }
    
    // Additional check for email if needed
    if (response.author?.email === user?.user?.email) {
      return true;
    }
    
    return false;
  };

  if (!isOpen || !leaveData) return null;

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex justify-center items-center p-4 sm:p-6"
        onClick={handleBackdropClick}
      >
        <div className="w-full max-w-6xl bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative flex flex-col max-h-[90vh] animate-fadeIn overflow-hidden">
          {/* CLOSE BUTTON */}
          <button 
            onClick={() => !isSubmitting && (setIsOpen(false), resetState())}
            disabled={isSubmitting}
            className="absolute top-4 right-4 sm:top-5 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-red-500 transition-all text-2xl font-light z-10 disabled:opacity-50"
          >
            &times;
          </button>

          {/* HEADER */}
          <div className="px-6 py-6 sm:px-10 sm:py-8 border-b border-slate-50 text-center flex-shrink-0">
            <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-widest uppercase">
              LEAVE REQUEST DETAILS
            </h2>
            <div className="mt-2">
              <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${getStatusColor(leaveData.status)}`}>
                {leaveData.status}
              </span>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
            {/* LEFT COLUMN - LEAVE DETAILS */}
            <div className="lg:w-1/2 border-r border-slate-100 overflow-y-auto custom-scrollbar">
              <div className="p-6 sm:p-8 space-y-6">
                {/* Leave Information */}
                <div className="space-y-4">
                  {/* Employee Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <FaUser className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Employee</span>
                      </div>
                      <p className="text-sm font-bold text-slate-800">{leaveData.employeeName || leaveData.name}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        {leaveData.employee?.department || "Department not specified"}
                      </p>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <FaEnvelope className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email</span>
                      </div>
                      <p className="text-sm text-slate-700 truncate">{leaveData.email}</p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <FaCalendarAlt className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Start Date</span>
                      </div>
                      <p className="text-sm font-medium text-slate-800">
                        {new Date(leaveData.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <FaCalendarAlt className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">End Date</span>
                      </div>
                      <p className="text-sm font-medium text-slate-800">
                        {new Date(leaveData.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Duration & Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <FaClock className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Duration</span>
                      </div>
                      <p className="text-sm font-medium text-slate-800">
                        {leaveData.duration || 
                          `${Math.ceil((new Date(leaveData.endDate) - new Date(leaveData.startDate)) / (1000 * 60 * 60 * 24)) + 1} days`}
                      </p>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Leave Type</span>
                      </div>
                      <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 uppercase">
                        {leaveData.leaveType}
                      </span>
                    </div>
                  </div>

                  {/* Reason */}
                  {leaveData.reason && leaveData.reason !== "-" && (
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <FaFileAlt className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reason</span>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-line">{leaveData.reason}</p>
                    </div>
                  )}

                  {/* Applied At */}
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock size={14} className="text-slate-400" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Applied On</span>
                    </div>
                    <p className="text-sm text-slate-700">
                      {new Date(leaveData.appliedAt || leaveData.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* STATUS UPDATE SECTION - Only show if leave is Pending */}
                {leaveData.status === "Pending" && (
                  <div className="border-t border-slate-200 pt-6">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">
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
                        <button
                          type="button"
                          onClick={() => setIsOpen(false)}
                          disabled={isSubmitting}
                          className="flex-1 py-3 font-black text-[10px] text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleStatusChange}
                          disabled={selectedStatus === "Pending" || selectedStatus === leaveData.status || isSubmitting}
                          className={`flex-1 py-3 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                            selectedStatus === "Pending" || selectedStatus === leaveData.status || isSubmitting
                              ? "bg-slate-300 cursor-not-allowed"
                              : selectedStatus === "Approved"
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-red-600 hover:bg-red-700"
                          }`}
                        >
                          {isSubmitting ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>UPDATING...</span>
                            </div>
                          ) : (
                            `CONFIRM ${selectedStatus.toUpperCase()}`
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN - DISCUSSION SECTION */}
            <div className="lg:w-1/2 overflow-y-auto custom-scrollbar">
              <div className="p-6 sm:p-8 h-full flex flex-col">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <FaComment className="text-slate-400" />
                  DISCUSSION
                </h3>

                {/* Responses List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar mb-4 space-y-3">
                  {
                  // loadingResponses ? (
                  //   <div className="flex items-center justify-center h-32">
                  //     <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
                  //   </div>
                  // ) : 
                  responses.length > 0 ? (
                    responses.map((response) => (
                      <div key={response._id} className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-800 rounded-full text-sm font-bold shrink-0">
                            {getAvatarContent(response)}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-800">
                                  {response.author?.name || response.role || "Unknown User"}
                                </h4>
                                <span className="text-xs text-slate-400 uppercase">
                                  {response.author?.role || response.role}
                                </span>
                                {response.isEdited && (
                                  <span className="text-xs text-slate-400 italic">(edited)</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">
                                  {formatDate(response.time || response.createdAt)}
                                </span>
                                {/* Action buttons - Only show for user's own responses */}
                                {!response.isSystemNote && isUserResponse(response) && (
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => {
                                        setEditingResponseId(response._id);
                                        setEditContent(response.content);
                                      }}
                                      className="p-1 text-slate-400 hover:text-blue-600 transition"
                                      title="Edit"
                                    >
                                      <Edit2 size={12} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteResponse(response._id)}
                                      className="p-1 text-slate-400 hover:text-red-600 transition"
                                      title="Delete"
                                    >
                                      <Trash2 size={12} />
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
                                  className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-100 min-h-[60px] resize-none"
                                  rows="3"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleUpdateResponse(response._id)}
                                    className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingResponseId(null);
                                      setEditContent("");
                                    }}
                                    className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-300 transition"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Display Mode */
                              <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                                {response.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <FaComment className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-500 font-medium">No discussion yet</p>
                      <p className="text-xs text-slate-400 mt-1">Start a conversation about this leave request</p>
                    </div>
                  )}
                </div>

                {/* New Response Input */}
                <div className="border-t border-slate-200 pt-4">
                  <div className="relative">
                    <textarea
                      value={newResponse}
                      onChange={(e) => setNewResponse(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full border border-slate-200 rounded-xl p-3 pr-24 text-sm focus:ring-2 focus:ring-blue-100 min-h-[80px] resize-none"
                      placeholder="Type your response here..."
                      rows="3"
                    />
                    
                    {/* Attachment Button */}
                    <label className="absolute left-3 bottom-3 p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleAttachmentChange}
                        disabled={isSubmitting}
                      />
                      <Paperclip size={16} />
                    </label>
                    
                    {/* Attachment Preview */}
                    {attachment && (
                      <div className="absolute left-12 bottom-3 flex items-center gap-2 bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs">
                        <Paperclip size={12} />
                        <span className="truncate max-w-[100px]">{attachment.name}</span>
                        <button
                          onClick={() => {
                            setAttachment(null);
                            setNewResponse(prev => prev.replace(`\n[Attached: ${attachment.name}]`, ''));
                          }}
                          className="text-blue-700 hover:text-red-600"
                        >
                          <FaTimes size={10} />
                        </button>
                      </div>
                    )}
                    
                    {/* Send Button */}
                    <button
                      onClick={handleSubmitResponse}
                      disabled={!newResponse.trim() || isSubmitting}
                      className="absolute right-3 bottom-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      title="Send response"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                  
                  <p className="text-xs text-slate-500 mt-2 px-1">
                    Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-xs">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-xs">Shift+Enter</kbd> for new line
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewLeaveModal;
