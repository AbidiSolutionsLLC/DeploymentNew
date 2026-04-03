import React from "react";
import { X, CheckCircle, XCircle, Trash2, Calendar, User, Paperclip } from "lucide-react";
import { toast } from "react-toastify";
import { downloadFile } from "../utils/downloadFile";

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

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex justify-center items-center p-4 overflow-y-auto">
      <div className="bg-white rounded-[1.2rem] shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-fadeIn border border-white/50">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
              Expense Details
            </h3>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${expense.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : expense.status === 'rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-blue-50 text-blue-600 border-blue-100'} uppercase tracking-wide`}>
              {expense.status}
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-rose-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
          {/* Title & Amount */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-1">{expense.title}</h2>
              <p className="text-sm font-medium text-slate-500">{expense.description || "No description provided"}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-slate-800">${expense.amount?.toFixed(2)}</p>
              <span className="text-[10px] font-bold bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 uppercase tracking-tight text-slate-600">
                {expense.category}
              </span>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <User size={14} className="text-slate-400" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Submitted By
                </p>
              </div>
              <p className="text-sm font-bold text-slate-700">
                {expense.submittedByName || expense.submittedBy?.name || "Unknown"}
              </p>
            </div>

            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={14} className="text-slate-400" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Submitted On
                </p>
              </div>
              <p className="text-sm font-bold text-slate-700">
                {formatDate(expense.createdAt)}
              </p>
            </div>

            {expense.approvedBy && (
              <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-wider">
                    Approved By
                  </p>
                </div>
                <p className="text-sm font-bold text-emerald-700">
                  {expense.approvedByName || expense.approvedBy?.name || "Unknown"}
                </p>
                {expense.approvedAt && (
                  <p className="text-[10px] text-emerald-600/50 font-medium">
                    {formatDate(expense.approvedAt)}
                  </p>
                )}
              </div>
            )}

            {expense.status === 'rejected' && (
              <div className="col-span-2 bg-rose-50/50 rounded-xl p-4 border border-rose-100 grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle size={14} className="text-rose-500" />
                    <p className="text-[10px] font-bold text-rose-600/60 uppercase tracking-wider">
                      Rejection Reason
                    </p>
                  </div>
                  <p className="text-sm font-bold text-rose-700">{expense.rejectionReason}</p>
                </div>

                {(expense.rejectedByName || expense.rejectedBy) && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <User size={14} className="text-rose-400" />
                      <p className="text-[10px] font-bold text-rose-600/60 uppercase tracking-wider">
                        Rejected By
                      </p>
                    </div>
                    <p className="text-sm font-bold text-rose-700">
                      {expense.rejectedByName || expense.rejectedBy?.name || "Unknown"}
                    </p>
                    {expense.rejectedAt && (
                      <p className="text-[10px] text-rose-600/50 font-medium">
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
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                Receipt
              </p>
              <button 
                onClick={handleViewReceipt}
                className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-blue-50 hover:border-blue-200 transition-all group text-left"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
                    {(expense.receiptUrl?.split('.').pop().split('?')[0] || "IMG").toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700 truncate">Expense Receipt</p>
                    <p className="text-[10px] text-slate-400 font-medium">Click to download recipient</p>
                  </div>
                </div>
                <div className="text-slate-400 group-hover:text-blue-600">
                  <Paperclip size={16} />
                </div>
              </button>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50/50 mt-auto">
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
                className="flex-1 px-4 py-3 bg-white text-rose-600 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-md border border-rose-100 hover:bg-rose-50 active:scale-95 transition-all flex justify-center items-center gap-2"
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
              className="flex-1 px-4 py-3 bg-white text-rose-500 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-sm border border-rose-100 hover:bg-rose-50 active:scale-95 transition-all flex justify-center items-center gap-2"
            >
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseDetail;