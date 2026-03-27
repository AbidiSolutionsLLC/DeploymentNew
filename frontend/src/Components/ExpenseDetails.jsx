import React from "react";
import { X, Download, CheckCircle, XCircle, Edit2, Trash2, Calendar, User, DollarSign, Tag, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";

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
    if (expense.receiptUrl) {
      window.open(`http://localhost:5000${expense.receiptUrl}`, '_blank');
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
      <div className="bg-card-surface rounded-2xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-fadeIn border border-default">
        {/* Header */}
        <div className="px-6 py-4 border-b border-default flex justify-between items-center bg-hover-surface/50 sticky top-0">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-black text-heading-color uppercase tracking-widest">
              Expense Details
            </h3>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black ${statusConfig.bg} text-${statusConfig.color} border border-${statusConfig.color}/20 uppercase`}>
              <StatusIcon size={12} />
              {statusConfig.text}
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="text-primary-color/40 hover:text-error transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Title & Amount */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-black text-heading-color mb-1">{expense.title}</h2>
              <p className="text-sm text-primary-color/60">{expense.description || "No description provided"}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-primary-color">${expense.amount?.toFixed(2)}</p>
              <p className="text-[10px] font-black text-primary-color/40 uppercase tracking-wider">
                {expense.category}
              </p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-hover-surface/50 rounded-xl p-4 border border-default">
              <div className="flex items-center gap-2 mb-2">
                <User size={14} className="text-primary-color/40" />
                <p className="text-[10px] font-black text-primary-color/40 uppercase tracking-wider">
                  Submitted By
                </p>
              </div>
              <p className="text-sm font-bold text-primary-color">
                {expense.submittedByName || expense.submittedBy?.name || "Unknown"}
              </p>
              <p className="text-[10px] text-primary-color/40">
                ID: {expense.submittedBy?._id || expense.submittedBy}
              </p>
            </div>

            <div className="bg-hover-surface/50 rounded-xl p-4 border border-default">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={14} className="text-primary-color/40" />
                <p className="text-[10px] font-black text-primary-color/40 uppercase tracking-wider">
                  Submitted On
                </p>
              </div>
              <p className="text-sm font-bold text-primary-color">
                {formatDate(expense.createdAt)}
              </p>
            </div>

            {expense.approvedBy && (
              <div className="bg-hover-surface/50 rounded-xl p-4 border border-default">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={14} className="text-success" />
                  <p className="text-[10px] font-black text-primary-color/40 uppercase tracking-wider">
                    Approved By
                  </p>
                </div>
                <p className="text-sm font-bold text-primary-color">
                  {expense.approvedByName || expense.approvedBy?.name || "Unknown"}
                </p>
                {expense.approvedAt && (
                  <p className="text-[10px] text-primary-color/40">
                    {formatDate(expense.approvedAt)}
                  </p>
                )}
              </div>
            )}

            {expense.rejectionReason && (
              <div className="col-span-2 bg-error-light/30 rounded-xl p-4 border border-error/20">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle size={14} className="text-error" />
                  <p className="text-[10px] font-black text-error uppercase tracking-wider">
                    Rejection Reason
                  </p>
                </div>
                <p className="text-sm text-error">{expense.rejectionReason}</p>
              </div>
            )}
          </div>

          {/* Receipt */}
          {expense.receiptUrl && (
            <div className="mb-6">
              <p className="text-[10px] font-black text-primary-color/40 uppercase tracking-wider mb-3">
                Receipt
              </p>
              <div 
                onClick={handleViewReceipt}
                className="bg-hover-surface/50 rounded-xl p-4 border border-default flex items-center justify-between cursor-pointer hover:border-primary-brand transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center">
                    <Download size={20} className="text-primary-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-primary-color">View Receipt</p>
                    <p className="text-[10px] text-primary-color/40">Click to open</p>
                  </div>
                </div>
                <Download size={16} className="text-primary-color/40" />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-default flex gap-3 bg-hover-surface/50">
          {expense.status === 'pending' && canApprove && (
            <>
              <button
                onClick={() => onApprove(expense._id)}
                className="flex-1 py-2 bg-success text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-success/80 shadow-md shadow-success/10 flex justify-center items-center gap-2 transition-all"
              >
                <CheckCircle size={14} /> Approve
              </button>
              <button
                onClick={() => onReject(expense)}
                className="flex-1 py-2 bg-error text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-error/80 shadow-md shadow-error/10 flex justify-center items-center gap-2 transition-all"
              >
                <XCircle size={14} /> Reject
              </button>
            </>
          )}

          {canEdit && (
            <button
              onClick={() => {
                onClose();
                onEdit(expense);
              }}
              className="flex-1 py-2 bg-primary-color text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary-color/80 shadow-md shadow-primary-color/10 flex justify-center items-center gap-2 transition-all"
            >
              <Edit2 size={14} /> Edit
            </button>
          )}

          {(canEdit || (isOwner && expense.status === 'pending')) && (
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this expense?")) {
                  onDelete(expense._id);
                  onClose();
                }
              }}
              className="flex-1 py-2 bg-error/10 text-error rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-error/20 flex justify-center items-center gap-2 transition-all"
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