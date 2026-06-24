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
import GlassModal from "./ui/GlassModal";
import GlassButton from "./ui/GlassButton";
import { STATUS_VARIANTS, resolveStatusVariant } from "./StatusBadge";

const HistoryViewLeaveModal = ({
 isOpen,
 setIsOpen,
 leaveData,
}) => {
 const getStatusColor = (status) => STATUS_VARIANTS[resolveStatusVariant(status)]?.badge || STATUS_VARIANTS.neutral.badge;

 if (!isOpen || !leaveData) return null;

 return (
 <GlassModal
 isOpen={isOpen}
 onClose={() => setIsOpen(false)}
 title={
 <div className="flex flex-col">
 <span>LEAVE REQUEST DETAILS</span>
 <div className="mt-2">
 <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${getStatusColor(leaveData.status)}`}>
 {leaveData.status}
 </span>
 </div>
 </div>
 }
 maxWidth="max-w-4xl"
 footer={
 <GlassButton variant="secondary" onClick={() => setIsOpen(false)} className="w-full">
 Close
 </GlassButton>
 }
 >
 <div className="space-y-6">
 {/* Employee Info */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="bg-surface/50 dark:bg-slate-800/50 p-4 rounded-xl">
 <div className="flex items-center gap-3 mb-2">
 <FaUser className="text-muted dark:text-muted" />
 <span className="text-[10px] font-black text-muted dark:text-muted uppercase tracking-widest">Employee</span>
 </div>
 <p className="text-sm font-bold text-heading dark:text-white">{leaveData.employeeName || leaveData.name}</p>
 <p className="text-xs text-muted dark:text-muted mt-1">
 {leaveData.employee?.department || "Department not specified"}
 </p>
 </div>

 <div className="bg-surface/50 dark:bg-slate-800/50 p-4 rounded-xl">
 <div className="flex items-center gap-3 mb-2">
 <FaEnvelope className="text-muted dark:text-muted" />
 <span className="text-[10px] font-black text-muted dark:text-muted uppercase tracking-widest">Email</span>
 </div>
 <p className="text-sm text-heading dark:text-white truncate">{leaveData.email}</p>
 </div>
 </div>

 {/* Dates */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div className="bg-surface/50 dark:bg-slate-800/50 p-4 rounded-xl">
 <div className="flex items-center gap-3 mb-2">
 <FaCalendarAlt className="text-muted dark:text-muted" />
 <span className="text-[10px] font-black text-muted dark:text-muted uppercase tracking-widest">Start Date</span>
 </div>
 <p className="text-sm font-medium text-heading dark:text-white">
 {formatDisplayDate(leaveData.startDate)}
 </p>
 </div>

 <div className="bg-surface/50 dark:bg-slate-800/50 p-4 rounded-xl">
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
 <div className="bg-surface/50 dark:bg-slate-800/50 p-4 rounded-xl">
 <div className="flex items-center gap-3 mb-2">
 <FaClock className="text-muted dark:text-muted" />
 <span className="text-[10px] font-black text-muted dark:text-muted uppercase tracking-widest">Duration</span>
 </div>
 <p className="text-sm font-medium text-heading dark:text-white">
 {leaveData.duration ||
 `${Math.ceil((parseISOToLocalDate(leaveData.endDate) - parseISOToLocalDate(leaveData.startDate)) / (1000 * 60 * 60 * 24)) + 1} days`}
 </p>
 </div>

 <div className="bg-surface/50 dark:bg-slate-800/50 p-4 rounded-xl">
 <div className="flex items-center gap-3 mb-2">
 <span className="text-[10px] font-black text-muted dark:text-muted uppercase tracking-widest">Leave Type</span>
 </div>
 <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-brand-primary/10 text-brand-primary uppercase">
 {leaveData.leaveType}
 </span>
 </div>
 </div>

 {/* Reason */}
 {leaveData.reason && leaveData.reason !== "-" && (
 <div className="bg-surface/50 dark:bg-slate-800/50 p-4 rounded-xl">
 <div className="flex items-center gap-3 mb-2">
 <FaFileAlt className="text-muted dark:text-muted" />
 <span className="text-[10px] font-black text-muted dark:text-muted uppercase tracking-widest">Reason</span>
 </div>
 <p className="text-sm text-heading dark:text-white whitespace-pre-line">{leaveData.reason}</p>
 </div>
 )}

 {/* Applied At */}
 <div className="bg-surface/50 dark:bg-slate-800/50 p-4 rounded-xl">
 <div className="flex items-center gap-3 mb-2">
 <Clock size={14} className="text-muted dark:text-muted" />
 <span className="text-[10px] font-black text-muted dark:text-muted uppercase tracking-widest">Applied On</span>
 </div>
 <p className="text-sm text-heading dark:text-white">
 {new Date(leaveData.appliedAt || leaveData.createdAt).toLocaleString()}
 </p>
 </div>

 {/* Read Only Notice */}
 <div className="bg-amber-50/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4">
 <p className="text-xs text-amber-700 dark:text-amber-400 font-medium text-center">
 This is a read-only view of the leave request from employee history.
 </p>
 </div>
 </div>
 </GlassModal>
 );
};

export default HistoryViewLeaveModal;
