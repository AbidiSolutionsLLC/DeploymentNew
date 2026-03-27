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
import ExpenseFilters from "../../Components/ExpenseFilter";
import ExpenseStats from "../../Components/ExpenseStats";
import ExpenseTable from "../../Components/ExpenseTable";
import ExpenseForm from "../../Components/ExpenseForm";
import ExpenseDetail from "../../Components/ExpenseDetails";

// --- MAIN COMPONENT ---
const ExpenseManagement = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  
  // Filter State
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState("all");
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [endDate, setEndDate] = useState(new Date());

  // Modal States
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);

  // Edit Form State
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    amount: "",
    category: "",
    status: "",
    receiptUrl: "",
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
        setCurrentUser(userRes.data);
        const role = userRes.data.role || "";
        setCurrentUserRole(role.replace(/\s+/g, '').toLowerCase());

        // Get expenses
        await fetchExpenses();
        
        // Get users if admin/superadmin
        if (role === 'admin' || role === 'superadmin') {
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
        console.error("get expenses Error//////////////////////////////////////:", error.response?.data);

      toast.error("Failed to fetch expenses");
    }
  };

  const canApprove = currentUserRole === 'admin' || currentUserRole === 'superadmin';
  const canEdit = currentUserRole === 'superadmin';
  const isManager = currentUserRole === 'manager';

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
      rejectionReason: expense.rejectionReason || ""
    });
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
    // Date filter
    const expDate = new Date(exp.createdAt);
    expDate.setHours(0, 0, 0, 0);
    
    const start = startDate ? new Date(startDate) : null;
    if (start) start.setHours(0, 0, 0, 0);
    
    const end = endDate ? new Date(endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);
    
    const matchesDate = (!start || expDate >= start) && (!end || expDate <= end);
    
    // Status filter
    const matchesStatus = statusFilter === "all" || exp.status === statusFilter;
    
    // Category filter
    const matchesCategory = categoryFilter === "all" || exp.category === categoryFilter;
    
    // User filter (for admin/superadmin)
    const matchesUser = selectedUser === "all" || exp.submittedBy?._id === selectedUser || exp.submittedBy === selectedUser;
    
    // Search filter
    const searchLower = searchTerm.toLowerCase();
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

  return (
    <div className="w-full bg-transparent min-h-screen p-4">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>

      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 mb-4 p-4">
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
              className="px-6 py-3 bg-[#64748b] text-white rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest shadow-lg shadow-slate-100 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
            >
              <Upload size={14} /> Submit Expense
            </button>
            <button
              onClick={handleDownload}
              className="px-6 py-3 bg-white text-slate-700 rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest shadow-md border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-2"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <ExpenseStats stats={stats} />

      {/* Filters */}
      <ExpenseFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        selectedUser={selectedUser}
        onUserChange={setSelectedUser}
        users={users}
        showUserFilter={currentUser?.role === "Admin" || currentUser?.role === "Super Admin"}
      />

      {/* Expenses Table */}
      <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4 mb-4">
        <ExpenseTable
          expenses={filteredExpenses}
          loading={loading}
          onView={(expense) => {
            setSelectedExpense(expense);
            setIsDetailModalOpen(true);
          }}
          onEdit={handleEditClick}
          onApprove={handleApprove}
          onReject={(expense) => {
            setEditingExpense(expense);
            setEditFormData({ ...editFormData, status: expense.status });
            setIsEditModalOpen(true);
          }}
          canApprove={canApprove}
          canEdit={canEdit}
        />
      </div>

      {/* Submit Expense Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[1.2rem] shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-fadeIn border border-white/50">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">
                Submit New Expense
              </h3>
              <button 
                onClick={() => setIsSubmitModalOpen(false)} 
                className="text-primary-color/40 hover:text-error transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
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
          onReject={handleReject}
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
          <div className="bg-card-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn border border-default">
            <div className="px-6 py-4 border-b border-default flex justify-between items-center bg-hover-surface/50">
              <h3 className="text-sm font-black text-heading-color uppercase tracking-widest">
                {editingExpense.status === 'pending' && canApprove ? 'Reject Expense' : 'Edit Expense'}
              </h3>
              <button 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingExpense(null);
                }} 
                className="text-primary-color/40 hover:text-error transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {editingExpense.status === 'pending' && canApprove ? (
                // Reject Form
                <div>
                  <label className="block text-[10px] font-black text-primary-color/40 uppercase tracking-widest mb-2">
                    Rejection Reason <span className="text-error">*</span>
                  </label>
                  <textarea
                    value={editFormData.rejectionReason}
                    onChange={(e) => setEditFormData({ ...editFormData, rejectionReason: e.target.value })}
                    className="w-full border border-default rounded-xl px-3 py-3 text-sm font-medium focus:ring-2 focus:ring-primary-light outline-none bg-card-surface text-primary-color min-h-[100px] resize-none"
                    placeholder="Please provide a reason for rejection..."
                  />
                  
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        setIsEditModalOpen(false);
                        setEditingExpense(null);
                      }}
                      className="flex-1 py-2 text-xs font-bold text-primary-color/50 hover:text-primary-color uppercase tracking-wider transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        handleReject(editingExpense._id, editFormData.rejectionReason);
                      }}
                      className="flex-1 py-2 bg-error text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-error/80 shadow-md shadow-error/10 flex justify-center items-center gap-2 transition-all"
                    >
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </div>
              ) : (
                // Edit Form
                <>
                  <div>
                    <label className="block text-[10px] font-black text-primary-color/40 uppercase tracking-widest mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editFormData.title}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                      className="w-full border border-default rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary-light outline-none bg-card-surface text-primary-color"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-primary-color/40 uppercase tracking-widest mb-2">
                      Description
                    </label>
                    <textarea
                      value={editFormData.description}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      className="w-full border border-default rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary-light outline-none bg-card-surface text-primary-color"
                      rows="3"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-primary-color/40 uppercase tracking-widest mb-2">
                      Amount ($)
                    </label>
                    <input
                      type="number"
                      value={editFormData.amount}
                      onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                      className="w-full border border-default rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary-light outline-none bg-card-surface text-primary-color"
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
                      <label className="block text-[10px] font-black text-primary-color/40 uppercase tracking-widest mb-2">
                        Current Receipt
                      </label>
                      <a 
                        href={`http://localhost:5000${editFormData.receiptUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary-brand hover:underline text-sm"
                      >
                        <FileText size={16} />
                        View Receipt
                      </a>
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        setIsEditModalOpen(false);
                        setEditingExpense(null);
                      }}
                      className="flex-1 py-2 text-xs font-bold text-primary-color/50 hover:text-primary-color uppercase tracking-wider transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 py-2 bg-primary-color text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary-color/80 shadow-md shadow-primary-color/10 flex justify-center items-center gap-2 transition-all"
                    >
                      <Save size={14} /> Save Changes
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseManagement;