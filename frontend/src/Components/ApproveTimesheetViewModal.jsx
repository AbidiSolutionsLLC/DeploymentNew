import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";

const ApproveTimesheetViewModal = ({ 
  timesheet, 
  onClose, 
  onApprove, 
  onReject,
  loading,
  isApprovedTab = false 
}) => {
  const [approvedHours, setApprovedHours] = useState(timesheet?.submittedHours || 0);
  
  if (!timesheet) return null;

  const handleApprove = () => {
    if (onApprove) {
      onApprove(timesheet._id, approvedHours);
    }
  };

  const handleReject = () => {
    if (onReject) {
      onReject(timesheet._id);
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