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
import ModernSelect from "../../components/ui/ModernSelect";
import ExpenseFilters from "../../components/ExpenseFilter";
import ExpenseStats from "../../components/ExpenseStats";
import ExpenseForm from "../../components/ExpenseForm";
import ExpenseDetail from "../../components/ExpenseDetails";
import { downloadFile } from "../../utils/downloadFile";
import PageContainer from "../../components/ui/PageContainer";
import TableWithPagination from "../../components/TableWithPagination";
import expensesApi from "../../api/expensesApi";
import GlassModal from "../../components/ui/GlassModal";

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
 setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.data || []);
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
 const resData = await expensesApi.getAllExpenses();
 const expensesArray = Array.isArray(resData) ? resData : resData.data || [];
 const sortedExpenses = expensesArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
 setExpenses(sortedExpenses);
 } catch (error) {
 console.error("get expenses Error//////////////////////////////////////:", error.response?.data);

 toast.error("Failed to fetch expenses");
 }
 };

 const canApprove = currentUserRole === 'admin' || currentUserRole === 'manager' || currentUserRole === 'superadmin';
 const canEdit = currentUserRole === 'superadmin';
 const isManager = currentUserRole === 'manager';

 // --- EXPENSE ACTIONS ---
 const handleApprove = async (expenseId) => {
 try {
 const resData = await expensesApi.approveExpense(expenseId);
 toast.success("Expense approved successfully");
 await fetchExpenses();
 if (selectedExpense?._id === expenseId) {
 setSelectedExpense(resData.data);
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
 const resData = await expensesApi.rejectExpense(expenseId, reason);
 toast.success("Expense rejected");
 await fetchExpenses();
 if (selectedExpense?._id === expenseId) {
 setSelectedExpense(resData.data);
 }
 setIsEditModalOpen(false);
 } catch (error) {
 toast.error(error.response?.data?.msg || "Failed to reject expense");
 }
 };

 const handleDelete = async (expenseId) => {
 if (!window.confirm("Are you sure you want to delete this expense?")) return;
 
 try {
 await expensesApi.deleteExpense(expenseId);
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
 setEditMode("edit"); // Always open edit form when clicking edit button
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

 const resData = await expensesApi.updateExpense(editingExpense._id, updates);
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

 const getStatusBadge = (status) => {
 switch (status) {
 case "approved": return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border bg-emerald-50 text-emerald-600 border-emerald-100 uppercase tracking-wide">Approved</span>;
 case "rejected": return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border bg-rose-50 text-rose-600 border-rose-100 uppercase tracking-wide">Rejected</span>;
 default: return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border bg-amber-50 text-amber-600 border-amber-100 uppercase tracking-wide">Pending</span>;
 }
 };

 const getCategoryLabel = (category) => {
 const categories = { travel: "Travel", food: "Food", supplies: "Supplies", equipment: "Equipment", other: "Other" };
 return categories[category] || category;
 };

 const expenseColumns = [
 {
 key: "expense",
 label: "Expense",
 render: (_, expense) => (
 <div className="flex flex-col">
 <p className="text-sm font-bold text-main">{expense.title}</p>
 {expense.description && (
 <p className="text-[10px] font-medium text-muted truncate max-w-[200px]">
 {expense.description}
 </p>
 )}
 </div>
 )
 },
 {
 key: "category",
 label: "Category",
 render: (val) => (
 <span className="p-4 text-xs font-semibold bg-app px-2.5 py-1 rounded-md border border-subtle uppercase tracking-tight text-muted">
 {getCategoryLabel(val)}
 </span>
 )
 },
 {
 key: "amount",
 label: "Amount",
 render: (val) => <span className="text-sm font-bold text-main">${val?.toFixed(2)}</span>
 },
 {
 key: "submittedBy",
 label: "Submitted By",
 render: (_, expense) => (
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold border border-indigo-100">
 {(expense.submittedByName || expense.submittedBy?.name || "?").charAt(0).toUpperCase()}
 </div>
 <span className="text-xs font-semibold text-muted">
 {expense.submittedByName || expense.submittedBy?.name || "Unknown"}
 </span>
 </div>
 )
 },
 {
 key: "createdAt",
 label: "Date",
 render: (val) => <span className="text-xs font-medium text-muted">{new Date(val).toLocaleDateString()}</span>
 },
 {
 key: "status",
 label: "Status",
 render: (val) => getStatusBadge(val)
 },
 {
 key: "actions",
 label: "Actions",
 align: "right",
 render: (_, expense) => (
 <div className="flex items-center justify-end gap-1">
 <button
 onClick={(e) => { e.stopPropagation(); setSelectedExpense(expense); setIsDetailModalOpen(true); }}
 className="p-1.5 text-muted hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
 title="View Details"
 >
 <Eye size={14} />
 </button>
 {expense.receiptUrl && (
 <button
 onClick={(e) => { e.stopPropagation(); downloadFile(expense.receiptUrl, `receipt-${expense.title}`); }}
 className="p-1.5 text-muted hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
 title="Download Receipt"
 >
 <Download size={14} />
 </button>
 )}
 {canEdit && expense.status === 'pending' && (
 <button
 onClick={(e) => { e.stopPropagation(); handleEditClick(expense); }}
 className="p-1.5 text-muted hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
 title="Edit Expense"
 >
 <Edit2 size={14} />
 </button>
 )}
 </div>
 )
 }
 ];

 return (
 <PageContainer
 title="Expense Management"
 subtitle="Track, approve, and manage employee expenses"
 headerActions={
 <div className="flex items-center gap-2">
 <button
 onClick={() => setIsSubmitModalOpen(true)}
 className="btn btn-primary flex items-center gap-2"
 >
 <Upload size={14} /> Submit Expense
 </button>
 <button
 onClick={handleDownload}
 className="btn btn-secondary flex items-center gap-2"
 >
 <Download size={14} /> Export CSV
 </button>
 </div>
 }
 topWidgets={
 <ExpenseStats stats={stats} />
 }
 filters={
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
 showUserFilter={currentUser?.role === "Admin" || currentUser?.role === "Manager" || currentUser?.role === "Super Admin"}
 />
 }
 loading={loading}
 >
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
 <div className="bg-surface rounded-2xl border border-white/60 shadow-[inset_0_2px_10px_rgba(255,255,255,0.3)] overflow-hidden">
 <TableWithPagination
 columns={expenseColumns}
 data={filteredExpenses}
 loading={loading}
 emptyMessage="No expenses found"
 onRowClick={(expense) => {
 setSelectedExpense(expense);
 setIsDetailModalOpen(true);
 }}
 />
 </div>

 {/* Submit Expense Modal */}
 <GlassModal
   isOpen={isSubmitModalOpen}
   onClose={() => setIsSubmitModalOpen(false)}
   title={<span className="text-xs font-bold text-heading uppercase tracking-widest">Submit New Expense</span>}
   maxWidth="max-w-2xl"
 >
   <ExpenseForm
     onSubmitSuccess={() => {
       setIsSubmitModalOpen(false);
       fetchExpenses();
     }}
     onCancel={() => setIsSubmitModalOpen(false)}
   />
 </GlassModal>

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
 setEditMode("reject"); // Open reject form when coming from detail modal reject button
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
 <GlassModal
   isOpen={isEditModalOpen && !!editingExpense}
   onClose={() => {
     setIsEditModalOpen(false);
     setEditingExpense(null);
     setEditMode("edit");
   }}
   title={<span className="text-sm font-black text-heading uppercase tracking-widest">{editMode === "reject" ? 'Reject Expense' : 'Edit Expense'}</span>}
   maxWidth="max-w-md"
 >
 <div className="space-y-4">
 {editMode === "reject" ? (
 // Reject Form
 <div>
 <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2">
 Rejection Reason <span className="text-rose-500">*</span>
 </label>
 <textarea
 value={editFormData.rejectionReason}
 onChange={(e) => setEditFormData({ ...editFormData, rejectionReason: e.target.value })}
 className="w-full border border-border-subtle rounded-xl px-3 py-3 text-sm font-medium focus:ring-2 focus:ring-slate-400 outline-none bg-surface text-main min-h-[100px] resize-none"
 placeholder="Please provide a reason for rejection..."
 />

 <div className="flex gap-3 mt-6">
 <button
 onClick={() => {
 setIsEditModalOpen(false);
 setEditingExpense(null);
 setEditMode("edit");
 }}
 className="flex-1 py-2 text-xs font-bold text-muted hover:text-main uppercase tracking-wider transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={() => {
 handleReject(editingExpense._id, editFormData.rejectionReason);
 }}
 className="flex-1 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-rose-600 shadow-md shadow-rose-500/20 flex justify-center items-center gap-2 transition-all"
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
 <button 
 type="button"
 onClick={() => downloadFile(editFormData.receiptPublicId || editFormData.receiptUrl, `receipt-${editFormData.title}`)}
 className="flex items-center gap-2 text-amber-600 hover:underline text-sm font-medium transition-all"
 >
 <FileText size={16} />
 View Receipt
 </button>
 </div>
 )}

 <div className="flex gap-3 mt-6">
 <button
 onClick={() => {
 setIsEditModalOpen(false);
 setEditingExpense(null);
 setEditMode("edit");
 }}
 className="flex-1 py-2 text-xs font-bold text-primary-color/50 hover:text-primary-color uppercase tracking-wider transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={handleSaveEdit}
 className="btn btn-primary flex-1 flex justify-center items-center gap-2"
 >
 <Save size={14} /> Save Changes
 </button>
 </div>
 </>
 )}
 </div>
 </GlassModal>
 </PageContainer>
 );
};

export default ExpenseManagement;