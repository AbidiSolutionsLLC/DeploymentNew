import React from "react";
import { FaCalendarAlt, FaUser, FaClock, FaTimes, FaStickyNote } from "react-icons/fa";
import { formatDisplayDate } from "../utils/dateUtils";

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
      case "Approved": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "Rejected": return "bg-rose-500/10 text-rose-600 border-rose-500/20";
      default: return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    }
  };

  if (!isOpen || !leaveData) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex justify-center items-center p-4 sm:p-6 animate-in fade-in duration-300"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-xl bg-white rounded-[40px] shadow-2xl relative flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 overflow-hidden border border-white/20">
        
        {/* Header */}
        <div className="px-10 py-10 border-b border-slate-100 flex justify-between items-start bg-white sticky top-0 z-10">
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight uppercase">
              Leave Details
            </h2>
            <div className="mt-3 flex items-center gap-3">
              <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(leaveData.status)}`}>
                {leaveData.status}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                History Record
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all border border-transparent hover:border-rose-100"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-10 bg-gradient-to-br from-white to-slate-50/30">
          <div className="space-y-8">
            
            {/* Employee Info */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50/30 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-teal-100/40 transition-colors" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                    <FaUser size={14} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Employee Profile</span>
                </div>
                <p className="text-lg font-black text-slate-900 tracking-tight">{leaveData.employeeName || leaveData.name}</p>
                <div className="mt-3 inline-block px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-lg border border-slate-100 uppercase tracking-widest">
                  {leaveData.leaveType}
                </div>
              </div>
            </div>

            {/* Dates & Duration Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <FaCalendarAlt size={14} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Date</span>
                </div>
                <p className="text-sm font-black text-slate-800">{formatDisplayDate(leaveData.startDate)}</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <FaCalendarAlt size={14} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End Date</span>
                </div>
                <p className="text-sm font-black text-slate-800">{formatDisplayDate(leaveData.endDate)}</p>
              </div>
            </div>

            {/* Duration & Notes */}
            <div className="space-y-6">
              <div className="flex items-center gap-6 px-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <FaClock size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Duration</p>
                    <p className="text-sm font-black text-slate-900">
                      {leaveData.totalDays || "N/A"} {leaveData.totalDays === 1 ? 'Day' : 'Days'}
                    </p>
                  </div>
                </div>
              </div>

              {leaveData.reason && (
                <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100">
                  <div className="flex items-center gap-3 mb-4">
                    <FaStickyNote className="text-slate-300" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Reason</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed font-bold italic">
                    "{leaveData.reason}"
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-white border-t border-slate-50 text-center">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-4">
            End of History Record
          </p>
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4">
            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest leading-relaxed">
              This is a read-only historical view. Any modifications must be made via the active requests panel.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HistoryViewLeaveModal;
