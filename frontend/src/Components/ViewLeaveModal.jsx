import React, { useState } from "react";
import { FaCalendarAlt, FaUser, FaEnvelope, FaClock, FaFileAlt } from "react-icons/fa";

const ViewLeaveModal = ({ isOpen, setIsOpen, leaveData, onStatusChange }) => {
  const [selectedStatus, setSelectedStatus] = useState(leaveData?.status || "Pending");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !leaveData) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      setIsOpen(false);
    }
  };

  const handleStatusChange = async () => {
    if (selectedStatus === leaveData.status || selectedStatus === "Pending") return;
    
    setIsSubmitting(true);
    try {
      await onStatusChange(leaveData.id, selectedStatus);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions = ["Approved", "Rejected"];
  if (leaveData.status !== "Pending") {
    statusOptions.push(leaveData.status);
  }

  const getStatusColor = (status) => {
    switch(status) {
      case "Approved": return "bg-green-100 text-green-800";
      case "Rejected": return "bg-red-100 text-red-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex justify-center items-center p-4 sm:p-6"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-lg bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative flex flex-col max-h-[90vh] animate-fadeIn overflow-hidden">
        {/* CLOSE BUTTON */}
        <button 
          onClick={() => !isSubmitting && setIsOpen(false)}
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

        {/* CONTENT */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto custom-scrollbar">
          {/* LEAVE INFO */}
          <div className="space-y-4">
            {/* Employee Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <FaUser className="text-slate-400" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Employee</span>
                </div>
                <p className="text-sm font-bold text-slate-800">{leaveData.name}</p>
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
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</span>
                </div>
                <p className="text-sm font-medium text-slate-800">{leaveData.date}</p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <FaClock className="text-slate-400" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Duration</span>
                </div>
                <p className="text-sm font-medium text-slate-800">{leaveData.duration}</p>
              </div>
            </div>

            {/* Leave Type */}
            <div className="bg-slate-50 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Leave Type</span>
              </div>
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 uppercase">
                {leaveData.leaveType}
              </span>
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
          </div>

          {/* STATUS UPDATE SECTION - Only show if leave is Pending */}
          {leaveData.status === "Pending" && (
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">
                Update Status
              </h3>
              
              <div className="space-y-4">
                <div className="relative">
                  <select
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-blue-100"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="Pending" disabled>SELECT STATUS</option>
                    <option value="Approved">APPROVE</option>
                    <option value="Rejected">REJECT</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

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
    </div>
  );
};

export default ViewLeaveModal;