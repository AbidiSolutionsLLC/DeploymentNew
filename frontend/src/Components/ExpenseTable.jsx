import React from "react";
import { Eye, Edit2, CheckCircle, XCircle, Download, FileText } from "lucide-react";
import { toast } from "react-toastify";

const ExpenseTable = ({
  expenses,
  loading,
  onView,
  onEdit,
  onApprove,
  onReject,
  canApprove,
  canEdit
}) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-success-light text-success border border-success/20">
            <CheckCircle size={12} /> Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-error-light text-error border border-error/20">
            <XCircle size={12} /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-warning-light text-warning border border-warning/20">
            <FileText size={12} /> Pending
          </span>
        );
    }
  };

  const getCategoryLabel = (category) => {
    const categories = {
      travel: "Travel",
      food: "Food",
      supplies: "Supplies",
      equipment: "Equipment",
      other: "Other"
    };
    return categories[category] || category;
  };

  const handleViewReceipt = (receiptUrl) => {
    if (receiptUrl) {
      window.open(`http://localhost:5000${receiptUrl}`, '_blank');
    } else {
      toast.info("No receipt available");
    }
  };

  if (loading) {
    return (
      <div className="bg-card-surface rounded-xl border border-default p-12">
        <div className="text-center text-primary-color/40">Loading expenses...</div>
      </div>
    );
  }

  return (
    <div className="bg-card-surface rounded-xl border border-default overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/90 border-b border-default">
              <th className="px-6 py-4 text-[10px] font-black text-primary-color/40 uppercase tracking-widest">Expense</th>
              <th className="px-6 py-4 text-[10px] font-black text-primary-color/40 uppercase tracking-widest">Category</th>
              <th className="px-6 py-4 text-[10px] font-black text-primary-color/40 uppercase tracking-widest">Amount</th>
              <th className="px-6 py-4 text-[10px] font-black text-primary-color/40 uppercase tracking-widest">Submitted By</th>
              <th className="px-6 py-4 text-[10px] font-black text-primary-color/40 uppercase tracking-widest">Date</th>
              <th className="px-6 py-4 text-[10px] font-black text-primary-color/40 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-black text-primary-color/40 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-default">
            {expenses.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-primary-color/40">
                  No expenses found
                </td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <tr key={expense._id} className="hover:bg-hover-surface/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <p className="text-sm font-bold text-primary-color">{expense.title}</p>
                      {expense.description && (
                        <p className="text-[10px] font-bold text-primary-color/40 uppercase truncate max-w-[200px]">
                          {expense.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-primary-color/60 uppercase tracking-wider">
                      {getCategoryLabel(expense.category)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-black text-heading-color">
                      ${expense.amount?.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary-light text-primary-brand flex items-center justify-center text-[10px] font-bold">
                        {expense.submittedByName?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <span className="text-xs font-bold text-primary-color">
                        {expense.submittedByName || "Unknown"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-primary-color/60">
                      {new Date(expense.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(expense.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {/* View Button */}
                      <button
                        onClick={() => onView(expense)}
                        className="p-1.5 text-primary-color/40 hover:text-primary-brand hover:bg-primary-light rounded-lg transition-all"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>

                      {/* Receipt Button */}
                      {expense.receiptUrl && (
                        <button
                          onClick={() => handleViewReceipt(expense.receiptUrl)}
                          className="p-1.5 text-primary-color/40 hover:text-primary-brand hover:bg-primary-light rounded-lg transition-all"
                          title="View Receipt"
                        >
                          <Download size={16} />
                        </button>
                      )}

                      {/* Edit Button (Superadmin only) */}
                      {canEdit && (
                        <button
                          onClick={() => onEdit(expense)}
                          className="p-1.5 text-primary-color/40 hover:text-primary-brand hover:bg-primary-light rounded-lg transition-all"
                          title="Edit Expense"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}

                      {/* Approve/Reject Buttons (Admin/Superadmin) */}
                      {canApprove && expense.status === 'pending' && (
                        <>
                          <button
                            onClick={() => onApprove(expense._id)}
                            className="p-1.5 text-success hover:text-success/80 hover:bg-success-light rounded-lg transition-all"
                            title="Approve"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => onReject(expense)}
                            className="p-1.5 text-error hover:text-error/80 hover:bg-error-light rounded-lg transition-all"
                            title="Reject"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseTable;