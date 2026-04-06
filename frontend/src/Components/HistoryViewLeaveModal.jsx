import React from "react";
import {
  FaCalendarAlt,
  FaUser,
  FaEnvelope,
  FaClock,
  FaFileAlt,
} from "react-icons/fa";
import { Clock } from "lucide-react";
import { parseISOToLocalDate, formatDisplayDate } from "../utils/dateUtils";

const HistoryViewLeaveModal = ({
  isOpen,
  setIsOpen,
  leaveData,
}) => {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "Approved": return "bg-green-100 text-green-800";
      case "Rejected": return "bg-red-100 text-red-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  if (!isOpen || !leaveData) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex justify-center items-center p-4 sm:p-6"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-4xl bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative flex flex-col max-h-[90vh] animate-fadeIn overflow-hidden">
        {/* CLOSE BUTTON */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 sm:top-5 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-red-500 transition-all text-2xl font-light z-10"
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

        {/* MAIN CONTENT - READ ONLY */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 sm:p-8 space-y-6">
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
                  {formatDisplayDate(leaveData.startDate)}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <FaCalendarAlt className="text-slate-400" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">End Date</span>
                </div>
                <p className="text-sm font-medium text-slate-800">
                  {formatDisplayDate(leaveData.endDate)}
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
                    `${Math.ceil((parseISOToLocalDate(leaveData.endDate) - parseISOToLocalDate(leaveData.startDate)) / (1000 * 60 * 60 * 24)) + 1} days`}
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

            {/* Read Only Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs text-blue-700 font-medium text-center">
                This is a read-only view of the leave request from employee history.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryViewLeaveModal;
