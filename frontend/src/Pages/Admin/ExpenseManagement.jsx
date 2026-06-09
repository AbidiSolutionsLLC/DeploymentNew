import React, { useState, useEffect } from "react";
import api from "../../axios";
import {
  Search, Calendar, Clock, User, CheckCircle,
  AlertCircle, XCircle, Download, Edit2, Save, X, ArrowRight,
  FileText, DollarSign, TrendingUp, Filter, Eye,
  Upload, Image as ImageIcon, File, Trash2
} from "lucide-react";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ModernSelect from "../../Components/ui/ModernSelect";
import FilterBar from "../../Components/FilterBar";
import ExpenseStats from "../../Components/ExpenseStats";
import ExpenseTable from "../../Components/ExpenseTable";
import ExpenseForm from "../../Components/ExpenseForm";
import ExpenseDetail from "../../Components/ExpenseDetails";
import { downloadFile } from "../../utils/downloadFile";

// --- MAIN COMPONENT ---
const ExpenseManagement = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  
  // Consolidated Filter State
  const [filterValues, setFilterValues] = useState({
    search: "",
    status: "all",
    category: "all",
    user: "all",
    dateStart: new Date(new Date().setDate(new Date().getDate() - 30)),
    dateEnd: new Date()
  });

  const handleFilterChange = (key, value) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilterValues({
      search: "",
      status: "all",
      category: "all",
      user: "all",
      dateStart: new Date(new Date().setDate(new Date().getDate() - 30)),
      dateEnd: new Date()
    });
  };

  // Modal States
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editMode, setEditMode] = useState("edit"); // "edit" or "reject"

  // Edit Form State
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    amount: "",
    category: "",
    status: "",
    receiptUrl: "",
    receiptPublicId: "",
    rejectionReason: ""
  });

  // Permission State
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState("");

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        // Get current user
        const userRes = await api.get("/auth/me");
        const userData = userRes.data.user || userRes.data;
        setCurrentUser(userData);
        const role = userData.role || "";
        const normalizedRole = role.replace(/\s+/g, '').toLowerCase();
        setCurrentUserRole(normalizedRole);

        // Get expenses
        await fetchExpenses();

        // Get users if admin/manager/superadmin
        if (role === 'admin' || role === 'manager' || role === 'superadmin') {
          const usersRes = await api.get("/users");
          setUsers(usersRes.data);
        }
      } catch (error) {
        console.error("Init Error:", error.response?.data);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  const fetchExpenses = async () => {
    try {
      const res = await api.get("/expenses/");
      const sortedExpenses = res.data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setExpenses(sortedExpenses);
    } catch (error) {
        console.error("get expenses Error:", error.response?.data);
      toast.error("Failed to fetch expenses");
    }
  };

  const canApprove = currentUserRole === 'admin' || currentUserRole === 'manager' || currentUserRole === 'superadmin';
  const canEdit = currentUserRole === 'superadmin';

  // --- EXPENSE ACTIONS ---
  const handleApprove = async (expenseId) => {
    try {
      const res = await api.put(`/expenses/${expenseId}/approve`);
      toast.success("Expense approved successfully");
      await fetchExpenses();
      if (selectedExpense?._id === expenseId) {
        setSelectedExpense(res.data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to approve expense");
    }
  };

  const handleReject = async (expenseId, reason) => {
    if (!reason?.trim()) {
      toast.error("Rejection reason is required");
      return;
    }
    
    try {
      const res = await api.put(`/expenses/${expenseId}/reject`, { reason });
      toast.success("Expense rejected");
      await fetchExpenses();
      if (selectedExpense?._id === expenseId) {
        setSelectedExpense(res.data.data);
      }
      setIsEditModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to reject expense");
    }
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    
    try {
      await api.delete(`/expenses/${expenseId}`);
      toast.success("Expense deleted successfully");
      await fetchExpenses();
      if (selectedExpense?._id === expenseId) {
        setIsDetailModalOpen(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to delete expense");
    }
  };

  const handleEditClick = (expense) => {
    setEditingExpense(expense);
    setEditFormData({
      title: expense.title || "",
      description: expense.description || "",
      amount: expense.amount?.toString() || "",
      category: expense.category || "",
      status: expense.status || "",
      receiptUrl: expense.receiptUrl || "",
      receiptPublicId: expense.receiptPublicId || "",
      rejectionReason: expense.rejectionReason || ""
    });
    setEditMode("edit");
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      const updates = {
        title: editFormData.title,
        description: editFormData.description,
        amount: parseFloat(editFormData.amount),
        category: editFormData.category,
        status: editFormData.status
      };

      const res = await api.put(`/expenses/${editingExpense._id}`, updates);
      toast.success("Expense updated successfully");
      setIsEditModalOpen(false);
      await fetchExpenses();
      
      if (selectedExpense?._id === editingExpense._id) {
        setSelectedExpense(res.data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to update expense");
    }
  };

  // --- DOWNLOAD REPORT ---
  const handleDownload = () => {
    if (filteredExpenses.length === 0) {
      toast.warn("No data to download");
      return;
    }

    const headers = ["Title", "Description", "Amount", "Category", "Submitted By", "Status", "Date", "Approved By", "Approved At"];
    const rows = filteredExpenses.map(exp => [
      `"${exp.title}"`,
      `"${exp.description || ''}"`,
      exp.amount,
      exp.category,
      `"${exp.submittedByName || exp.submittedBy?.name || 'Unknown'}"`,
      exp.status,
      new Date(exp.createdAt).toLocaleDateString(),
      `"${exp.approvedByName || ''}"`,
      exp.approvedAt ? new Date(exp.approvedAt).toLocaleDateString() : ''
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `expense_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- FILTERING ---
  const filteredExpenses = expenses.filter((exp) => {
    const { search, status, category, user, dateStart, dateEnd } = filterValues;
    
    // Date filter
    const expDate = new Date(exp.createdAt);
    expDate.setHours(0, 0, 0, 0);
    
    const start = dateStart ? new Date(dateStart) : null;
    if (start) start.setHours(0, 0, 0, 0);
    
    const end = dateEnd ? new Date(dateEnd) : null;
    if (end) end.setHours(23, 59, 59, 999);
    
    const matchesDate = (!start || expDate >= start) && (!end || expDate <= end);
    
    // Status filter
    const matchesStatus = status === "all" || exp.status === status;
    
    // Category filter
    const matchesCategory = category === "all" || exp.category === category;
    
    // User filter
    const matchesUser = user === "all" || exp.submittedBy?._id === user || exp.submittedBy === user;
    
    // Search filter
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      exp.title?.toLowerCase().includes(searchLower) ||
      exp.description?.toLowerCase().includes(searchLower) ||
      exp.submittedByName?.toLowerCase().includes(searchLower) ||
      exp.amount?.toString().includes(searchLower);
    
    return matchesDate && matchesStatus && matchesCategory && matchesUser && matchesSearch;
  });

  // Calculate statistics
  const stats = {
    total: filteredExpenses.length,
    pending: filteredExpenses.filter(e => e.status === 'pending').length,
    approved: filteredExpenses.filter(e => e.status === 'approved').length,
    rejected: filteredExpenses.filter(e => e.status === 'rejected').length,
    totalAmount: filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
    approvedAmount: filteredExpenses
      .filter(e => e.status === 'approved')
      .reduce((sum, e) => sum + (e.amount || 0), 0),
    pendingAmount: filteredExpenses
      .filter(e => e.status === 'pending')
      .reduce((sum, e) => sum + (e.amount || 0), 0)
  };

  const filterConfig = [
    { type: 'search', key: 'search', placeholder: 'Search expenses...' },
    {
      type: 'dateRange',
      key: 'date',
      label: 'Date Range'
    },
    {
      type: 'select',
      key: 'status',
      label: 'Status',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' }
      ]
    },
    {
      type: 'select',
      key: 'category',
      label: 'Category',
      options: [
        { value: 'all', label: 'All Categories' },
        { value: 'travel', label: 'Travel' },
        { value: 'food', label: 'Food' },
        { value: 'supplies', label: 'Supplies' },
        { value: 'equipment', label: 'Equipment' },
        { value: 'other', label: 'Other' }
      ]
    },
    ...(currentUser?.role === 'Admin' || currentUser?.role === 'Manager' || currentUser?.role === 'Super Admin' ? [
      {
        type: 'select',
        key: 'user',
        label: 'Employee',
        options: [
          { value: 'all', label: 'All Employees' },
          ...users.map(u => ({ value: u._id, label: u.name }))
        ]
      }
    ] : [])
  ];
  return (
    <div className="flex-1 min-w-0 overflow-hidden w-full bg-transparent min-h-screen p-4 flex flex-col">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 mb-4 p-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">
              Expense Management
            </h2>
            <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">
              Track, approve, and manage employee expenses
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="btn btn-primary gap-2 shadow-lg shadow-blue-100"
            >
              <Upload size={14} /> Submit Expense
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="flex-shrink-0">
        <ExpenseStats stats={stats} />
      </div>

      {/* Filters */}
      <FilterBar
        filters={filterConfig}
        values={filterValues}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        onExport={handleDownload}
        totalResults={filteredExpenses.length}
      />

      {/* Expenses Table */}
      <div className="flex-1 overflow-hidden mt-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 h-full flex flex-col overflow-hidden">
          <ExpenseTable
            expenses={filteredExpenses}
            loading={loading}
            onView={(expense) => {
              setSelectedExpense(expense);
              setIsDetailModalOpen(true);
            }}
            onEdit={handleEditClick}
            canEdit={canEdit}
          />
        </div>
      </div>

      {/* Submit Expense Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex justify-center items-center p-4">
          <div className="modal-container-standard">
            <div className="px-6 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h3 className="text-base font-black text-slate-800 uppercase tracking-widest">
                Submit New Expense
              </h3>
              <button 
                onClick={() => setIsSubmitModalOpen(false)} 
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-scroll p-6">
              <ExpenseForm
                onSubmitSuccess={() => {
                  setIsSubmitModalOpen(false);
                  fetchExpenses();
                }}
                onCancel={() => setIsSubmitModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Expense Detail Modal */}
      {isDetailModalOpen && selectedExpense && (
        <ExpenseDetail
          expense={selectedExpense}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedExpense(null);
          }}
          onApprove={handleApprove}
          onReject={(expense) => {
            setEditingExpense(expense);
            setEditFormData({ ...editFormData, rejectionReason: "" });
            setEditMode("reject");
            setIsEditModalOpen(true);
          }}
          onEdit={handleEditClick}
          onDelete={handleDelete}
          canApprove={canApprove}
          canEdit={canEdit}
          currentUser={currentUser}
        />
      )}

      {/* Edit/Reject Modal */}
      {isEditModalOpen && editingExpense && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex justify-center items-center p-4">
          <div className="modal-container-sm">
            <div className="px-6 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h3 className="text-base font-black text-slate-800 uppercase tracking-widest">
                {editMode === "reject" ? 'Reject Expense' : 'Edit Expense'}
              </h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingExpense(null);
                  setEditMode("edit");
                }}
                className="text-slate-400 hover:text-rose-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-scroll p-6 space-y-5">
              {editMode === "reject" ? (
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    Rejection Reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={editFormData.rejectionReason}
                    onChange={(e) => setEditFormData({ ...editFormData, rejectionReason: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-blue-50/50 focus:bg-white outline-none bg-slate-50 text-slate-700 min-h-[120px] resize-none transition-all"
                    placeholder="Please provide a reason for rejection..."
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editFormData.title}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-blue-50/50 focus:bg-white outline-none bg-slate-50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Description
                    </label>
                    <textarea
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-blue-50/50 focus:bg-white outline-none bg-slate-50 transition-all"
                      rows="3"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Amount ($)
                    </label>
                    <input
                      type="number"
                      value={editFormData.amount}
                      onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-4 focus:ring-blue-50/50 focus:bg-white outline-none bg-slate-50 transition-all"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <ModernSelect
                    label="Category"
                    name="category"
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    options={[
                      { value: "travel", label: "Travel" },
                      { value: "food", label: "Food" },
                      { value: "supplies", label: "Supplies" },
                      { value: "equipment", label: "Equipment" },
                      { value: "other", label: "Other" }
                    ]}
                    placeholder="SELECT CATEGORY"
                  />

                  <ModernSelect
                    label="Status"
                    name="status"
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    options={[
                      { value: "pending", label: "Pending" },
                      { value: "approved", label: "Approved" },
                      { value: "rejected", label: "Rejected" }
                    ]}
                    placeholder="SELECT STATUS"
                  />

                  {editFormData.receiptUrl && (
                    <div className="mt-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Current Receipt
                      </label>
                      <button 
                        type="button"
                        onClick={() => downloadFile(editFormData.receiptPublicId || editFormData.receiptUrl, `receipt-${editFormData.title}`)}
                        className="flex items-center gap-2 text-blue-600 hover:underline text-sm font-bold transition-all"
                      >
                        <FileText size={16} />
                        VIEW RECEIPT
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="px-6 py-6 border-t border-slate-100 flex gap-4 bg-slate-50/50 sticky bottom-0">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingExpense(null);
                  setEditMode("edit");
                }}
                className="btn btn-ghost flex-1 py-3"
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  if (editMode === "reject") {
                    handleReject(editingExpense._id, editFormData.rejectionReason);
                  } else {
                    handleSaveEdit();
                  }
                }}
                className={`btn flex-1 gap-2 shadow-lg ${
                  editMode === "reject" 
                    ? "bg-rose-500 hover:bg-rose-600 shadow-rose-200 text-white" 
                    : "btn-primary shadow-blue-100"
                }`}
              >
                {editMode === "reject" ? <XCircle size={14} /> : <Save size={14} />}
                {editMode === "reject" ? 'REJECT EXPENSE' : 'SAVE CHANGES'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseManagement;