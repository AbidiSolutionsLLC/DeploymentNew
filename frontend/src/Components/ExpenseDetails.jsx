import React from "react";
import { X, CheckCircle, XCircle, Trash2, Calendar, User, Paperclip, AlertCircle } from "lucide-react";
import { IoCalendarNumberOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { downloadFile } from "../utils/downloadFile";
import GlassModal from "./ui/GlassModal";

const ExpenseDetail = ({
 expense,
 onClose,
 onApprove,
 onReject,
 onEdit,
 onDelete,
 canApprove,
 canEdit,
 currentUser
}) => {
 const handleViewReceipt = () => {
 // Priority: receiptPublicId (typically stores blob name in Azure migration) -> receiptUrl
 const source = expense.receiptPublicId || expense.receiptUrl;
 if (source) {
 downloadFile(source, `receipt-${expense.title || 'expense'}`);
 }
 };

 const getStatusConfig = (status) => {
 switch (status) {
 case "approved":
 return {
 color: "success",
 icon: CheckCircle,
 bg: "bg-success-light",
 text: "Approved"
 };
 case "rejected":
 return {
 color: "error",
 icon: XCircle,
 bg: "bg-error-light",
 text: "Rejected"
 };
 default:
 return {
 color: "warning",
 icon: AlertCircle,
 bg: "bg-warning-light",
 text: "Pending"
 };
 }
 };

 const statusConfig = getStatusConfig(expense.status);
 const StatusIcon = statusConfig.icon;

 const formatDate = (date) => {
 return new Date(date).toLocaleDateString("en-US", {
 year: "numeric",
 month: "long",
 day: "numeric",
 hour: "2-digit",
 minute: "2-digit"
 });
 };

 const isOwner = currentUser?.id === expense.submittedBy?._id || currentUser?.id === expense.submittedBy;

  const titleContent = (
    <div className="flex items-center gap-3">
      <h3 className="text-xs font-bold text-main uppercase tracking-widest">
        Expense Details
      </h3>
      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${expense.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100' : expense.status === 'rejected' ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-100' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100'} uppercase tracking-wide`}>
        {expense.status}
      </span>
    </div>
  );

  const footerContent = (
    <div className="flex gap-3 w-full">
      {expense.status === 'pending' && canApprove && (currentUser?.role?.toLowerCase() === 'superadmin' || !isOwner) && (
        <>
          <button
            onClick={() => onApprove(expense._id)}
            className="flex-1 px-4 py-3 bg-[#64748b] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-slate-100 hover:brightness-110 active:scale-95 transition-all flex justify-center items-center gap-2"
          >
            <CheckCircle size={14} /> Approve
          </button>
          <button
            onClick={() => onReject(expense)}
            className="flex-1 px-4 py-3 bg-surface text-rose-600 dark:text-rose-400 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-md border border-rose-100 hover:bg-rose-50 dark:bg-rose-900/30 active:scale-95 transition-all flex justify-center items-center gap-2"
          >
            <XCircle size={14} /> Reject
          </button>
        </>
      )}

      {(canEdit || (isOwner && expense.status === 'pending')) && (
        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to delete this expense?")) {
              onDelete(expense._id);
              onClose();
            }
          }}
          className="flex-1 px-4 py-3 bg-surface text-rose-500 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-sm border border-rose-100 hover:bg-rose-50 dark:bg-rose-900/30 active:scale-95 transition-all flex justify-center items-center gap-2"
        >
          <Trash2 size={14} /> Delete
        </button>
      )}
    </div>
  );

  return (
    <GlassModal
      isOpen={true}
      onClose={onClose}
      title={titleContent}
      footer={footerContent}
      maxWidth="max-w-2xl"
    >
      {/* Title & Amount */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold text-main mb-1">{expense.title}</h2>
          <p className="text-sm font-medium text-muted">{expense.description || "No description provided"}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-main">${expense.amount?.toFixed(2)}</p>
          <span className="text-[10px] font-bold bg-app px-2.5 py-1 rounded-md border border-subtle uppercase tracking-tight text-muted">
            {expense.category}
          </span>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-app/80 rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <User size={14} className="text-muted" />
            <p className="text-[10px] font-bold text-muted uppercase tracking-wider">
              Submitted By
            </p>
          </div>
          <p className="text-sm font-bold text-main">
            {expense.submittedByName || expense.submittedBy?.name || "Unknown"}
          </p>
        </div>

        <div className="bg-app/80 rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <IoCalendarNumberOutline size={14} className="text-muted" />
            <p className="text-[10px] font-bold text-muted uppercase tracking-wider">
              Submitted On
            </p>
          </div>
          <p className="text-sm font-bold text-main">
            {formatDate(expense.createdAt)}
          </p>
        </div>

        {expense.approvedBy && (
          <div className="bg-emerald-50 dark:bg-emerald-900/30/50 rounded-xl p-4 border border-emerald-100">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={14} className="text-emerald-500" />
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400/60 uppercase tracking-wider">
                Approved By
              </p>
            </div>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
              {expense.approvedByName || expense.approvedBy?.name || "Unknown"}
            </p>
            {expense.approvedAt && (
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400/50 font-medium">
                {formatDate(expense.approvedAt)}
              </p>
            )}
          </div>
        )}

        {expense.status === 'rejected' && (
          <div className="col-span-2 bg-rose-50 dark:bg-rose-900/30/50 rounded-xl p-4 border border-rose-100 grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <XCircle size={14} className="text-rose-500" />
                <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400/60 uppercase tracking-wider">
                  Rejection Reason
                </p>
              </div>
              <p className="text-sm font-bold text-rose-700 dark:text-rose-400">{expense.rejectionReason}</p>
            </div>

            {(expense.rejectedByName || expense.rejectedBy) && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User size={14} className="text-rose-400" />
                  <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400/60 uppercase tracking-wider">
                    Rejected By
                  </p>
                </div>
                <p className="text-sm font-bold text-rose-700 dark:text-rose-400">
                  {expense.rejectedByName || expense.rejectedBy?.name || "Unknown"}
                </p>
                {expense.rejectedAt && (
                  <p className="text-[10px] text-rose-600 dark:text-rose-400/50 font-medium">
                    {formatDate(expense.rejectedAt)}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Receipt */}
      {expense.receiptUrl && (
        <div className="mb-6">
          <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-3">
            Receipt
          </p>
          <button 
            onClick={handleViewReceipt}
            className="btn-ghost w-full flex items-center justify-between p-3 rounded-xl"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
                {(expense.receiptUrl?.split('.').pop().split('?')[0] || "IMG").toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-main truncate">Expense Receipt</p>
                <p className="text-[10px] text-muted font-medium">Click to download recipient</p>
              </div>
            </div>
            <div className="text-muted group-hover:text-amber-600 dark:text-amber-400">
              <Paperclip size={16} />
            </div>
          </button>
        </div>
      )}
    </GlassModal>
  );
};

export default ExpenseDetail;