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
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-600 border-emerald-100 uppercase tracking-wide">
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border bg-rose-50 text-rose-600 border-rose-100 uppercase tracking-wide">
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border bg-blue-50 text-blue-600 border-blue-100 uppercase tracking-wide">
            Pending
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
    <div className="overflow-x-auto rounded-xl border border-slate-200/60 shadow-sm">
      <table className="min-w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200">
            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Expense</th>
            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Submitted By</th>
            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
            <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {expenses.length === 0 ? (
            <tr>
              <td colSpan="7" className="p-12 text-center text-slate-400 font-medium">
                No expenses found
              </td>
            </tr>
          ) : (
            expenses.map((expense) => (
              <tr key={expense._id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="p-4">
                  <div className="flex flex-col">
                    <p className="text-sm font-bold text-slate-700">{expense.title}</p>
                    {expense.description && (
                      <p className="text-[10px] font-medium text-slate-500 truncate max-w-[200px]">
                        {expense.description}
                      </p>
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <span className="p-4 text-xs font-semibold bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 uppercase tracking-tight text-slate-600">
                    {getCategoryLabel(expense.category)}
                  </span>
                </td>
                <td className="p-4 text-sm font-bold text-slate-700">
                  ${expense.amount?.toFixed(2)}
                </td>
                <td className="p-4 font-bold">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center text-[11px] font-bold">
                      {expense.submittedByName?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <span className="text-sm text-slate-700">
                      {expense.submittedByName || "Unknown"}
                    </span>
                  </div>
                </td>
                <td className="p-4 text-sm text-slate-500 font-medium">
                  {new Date(expense.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4">
                  {getStatusBadge(expense.status)}
                </td>
                <td className="p-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onView(expense)}
                      className="p-2 text-slate-400 hover:text-[#64748b] hover:bg-slate-100 rounded-xl transition-all"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>

                    {expense.receiptUrl && (
                      <button
                        onClick={() => handleViewReceipt(expense.receiptUrl)}
                        className="p-2 text-slate-400 hover:text-[#64748b] hover:bg-slate-100 rounded-xl transition-all"
                        title="View Receipt"
                      >
                        <Download size={16} />
                      </button>
                    )}

                    {canEdit && (
                      <button
                        onClick={() => onEdit(expense)}
                        className="p-2 text-slate-400 hover:text-[#64748b] hover:bg-slate-100 rounded-xl transition-all"
                        title="Edit Expense"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}

                    {canApprove && expense.status === 'pending' && (
                      <>
                        <button
                          onClick={() => onApprove(expense._id)}
                          className="p-2 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                          title="Approve"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => onReject(expense)}
                          className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
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
  );
};

export default ExpenseTable;