import React from "react";
import { Eye, Download } from "lucide-react";
import { toast } from "react-toastify";
import { downloadFile } from "../utils/downloadFile";
import DataTable from "./DataTable";

const ExpenseTable = ({
  expenses,
  loading,
  onView,
  onEdit,
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

  const handleViewReceipt = async (expense) => {
    const source = expense.receiptPublicId || expense.receiptUrl;
    if (source) {
      await downloadFile(source, `receipt-${expense.title || 'expense'}`);
    } else {
      toast.info("No receipt available");
    }
  };

  const columns = [
    {
      key: "title",
      label: "Expense",
      sortable: true,
      render: (val, row) => (
        <div className="flex flex-col">
          <p className="text-sm font-bold text-slate-700">{row.title}</p>
          {row.description && (
            <p className="text-[10px] font-medium text-slate-500 truncate max-w-[200px]">
              {row.description}
            </p>
          )}
        </div>
      )
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
      render: (val) => (
        <span className="text-xs font-semibold bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 uppercase tracking-tight text-slate-600">
          {getCategoryLabel(val)}
        </span>
      )
    },
    {
      key: "amount",
      label: "Amount",
      sortable: true,
      render: (val) => (
        <span className="text-sm font-bold text-slate-700">
          ${val?.toFixed(2)}
        </span>
      )
    },
    {
      key: "submittedByName",
      label: "Submitted By",
      sortable: true,
      render: (val, row) => {
        const name = row.submittedByName || "Unknown";
        return (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center text-[11px] font-bold">
              {name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-slate-700 font-bold">{name}</span>
          </div>
        );
      }
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (val) => (
        <span className="text-sm text-slate-500 font-medium">
          {new Date(val).toLocaleDateString()}
        </span>
      )
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (val) => getStatusBadge(val)
    }
  ];

  const rowActions = [
    {
      icon: <Eye size={16} />,
      label: "View Details",
      onClick: onView
    },
    {
      icon: <Download size={16} />,
      label: "View Receipt",
      onClick: handleViewReceipt,
      showIf: (row) => !!row.receiptUrl
    }
  ];

  return (
    <div className="w-full">
      <DataTable
        columns={columns}
        data={expenses}
        loading={loading}
        emptyMessage="No expenses found"
        rowActions={rowActions}
        onRowClick={onView}
      />
    </div>
  );
};

export default ExpenseTable;