import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { refreshUserData } from "../../slices/userSlice";
import { FaMoneyBillWave, FaHospital, FaEye, FaEdit } from "react-icons/fa";
import { MdEventAvailable } from "react-icons/md";
import ApplyLeaveModal from "../../components/LeaveModal";
import EditLeaveModal from "../../components/EditLeaveModal";
import HolidayTable from "../../components/HolidayTable";
import ViewLeaveModal from "../../components/ViewLeaveModal";
import api from "../../axios";
import { parseISOToLocalDate, formatDisplayDate, calculateWorkingDays } from "../../utils/dateUtils";
import { toast } from "react-toastify";
import TableWithPagination from "../../components/TableWithPagination";
const LeaveSummary = () => {
 const [isOpen, setIsOpen] = useState(false);
 const [viewModalOpen, setViewModalOpen] = useState(false);
 const [editModalOpen, setEditModalOpen] = useState(false);
 const [selectedLeave, setSelectedLeave] = useState(null);
 const [editingLeave, setEditingLeave] = useState(null);
 const dispatch = useDispatch();
 const [holidays, setHolidays] = useState([]);
 const [loading, setLoading] = useState({
 holidays: true,
 });
 const [errorMsg, setErrorMsg] = useState("");

 const { user } = useSelector((state) => state.auth);
 const { userInfo, refreshing } = useSelector((state) => state.user);

 useEffect(() => {
 const userId = user?.data?.user?._id || user?.user?._id || user?._id || user?.id;
 if (userId) {
 dispatch(refreshUserData(userId));
 }
 }, [dispatch, user]);

 const userData = userInfo

 // Extract data from user
 const leaveBalances = userData?.leaves || {};
 const availableLeaves = userData?.avalaibleLeaves || 0;
 const bookedLeaves = userData?.bookedLeaves || 0;
 const leaveHistory = userData?.leaveHistory || [];


 // Calculate total leaves
 const totalLeaves = Object.values(leaveBalances).reduce((sum, balance) => sum + (balance || 0), 0);

 // Refresh user data on component mount
 useEffect(() => {
 if (userData?._id) {
 dispatch(refreshUserData(userData._id));
 }
 }, [dispatch, userData?._id]);


 const fetchHolidays = async () => {
 try {
 const response = await api.get("/holidays");
 setHolidays(response.data?.data || response.data);
 console.log("holidays", response.data?.data || response.data);

 } catch (err) {
 console.error("Failed to fetch holidays:", err);
 setErrorMsg(err.response?.data?.message || "Failed to load holidays");
 } finally {
 setLoading(prev => ({ ...prev, holidays: false }));
 }
 };

 useEffect(() => {
 fetchHolidays();
 }, []);

 // Create leave data cards
 const leaveData = [
 {
 icon: <FaMoneyBillWave />,
 label: "PTO (Paid Time Off)",
 available: leaveBalances.pto || 0,
 badgeColor: "bg-gradient-to-r from-green-500 to-green-600",
 },
 {
 icon: <FaHospital />,
 label: "Sick Leave",
 available: leaveBalances.sick || 0,
 badgeColor: "bg-gradient-to-r from-amber-500 to-amber-600",
 }
 ];

 // Format applied leaves
 const formatAppliedLeaves = () => {
 return leaveHistory.map(leave => ({
 id: leave.leaveId,
 startDate: formatDisplayDate(leave.startDate),
 endDate: leave.endDate,
 appliedAt: leave.appliedAt ? formatDisplayDate(leave.appliedAt) : (leave.createdAt ? formatDisplayDate(leave.createdAt) : '-'),
 leaveType: leave.leaveType || leave.type || "-",
 reason: leave.reason || "-",
 duration: (leave.daysTaken ? `${leave.daysTaken} days` : null) || leave.duration || `${calculateWorkingDays(
 parseISOToLocalDate(leave.startDate), 
 parseISOToLocalDate(leave.endDate)
 )} days`,
 status: leave.status || "Pending",
 }));
 };

 const appliedLeaves = formatAppliedLeaves();

 // Handle view leave
 const handleViewLeave = async (leave) => {
 try {
 // Fetch full leave details from API
 const response = await api.get(`/leaves/${leave.id}`);
 const fullLeaveData = response.data;

 setSelectedLeave({
 id: fullLeaveData._id,
 startDate: fullLeaveData.startDate,
 endDate: fullLeaveData.endDate,
 appliedAt: fullLeaveData.appliedAt || fullLeaveData.createdAt,
 name: fullLeaveData.employeeName,
 email: fullLeaveData.email,
 leaveType: fullLeaveData.leaveType,
 reason: fullLeaveData.reason || "-",
 duration: leave.duration,
 status: fullLeaveData.status,
 });
 setViewModalOpen(true);
 } catch (error) {
 console.error("Failed to fetch leave details:", error);
 // Fallback to basic data
 setSelectedLeave({
 ...leave,
 name: user?.user?.name || user?.name,
 email: user?.user?.email || user?.email,
 });
 setViewModalOpen(true);
 }
 };

 // Handle edit leave
 const handleEditLeave = async (leave) => {
 try {
 if (!leave.id) {
 toast.error("Failed to load leave for editing");
 return;
 }
 // Fetch full leave details from API
 const response = await api.get(`/leaves/${leave.id}`);
 const fullLeaveData = response.data;

 setEditingLeave(fullLeaveData);
 setEditModalOpen(true);
 } catch (error) {
 console.error("Failed to fetch leave details for editing:", error);
 toast.error("Failed to load leave for editing");
 }
 };

 // Handle leave edit submission
 const handleLeaveEdited = () => {
 // Refresh user data when a leave is edited
 if (userData?._id) {
 dispatch(refreshUserData(userData._id));
 }
 setEditModalOpen(false);
 setEditingLeave(null);
 };

 // Handle leave addition callback
 const handleLeaveAdded = () => {
 // Refresh user data when a new leave is added
 if (userData?._id) {
 dispatch(refreshUserData(userData._id));
 }
 };

 const columns = [
 { key: "startDate", label: "Start Date" },
 { key: "endDate", label: "End Date", render: (_, row) => formatDisplayDate(row.endDate) },
 { key: "leaveType", label: "Leave Type" },
 { 
 key: "reason", 
 label: "Reason",
 sortable: false,
 render: (_, row) => (
 <div className="max-w-[220px] text-muted" title={row.reason}>
 <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
 {row.reason}
 </span>
 </div>
 )
 },
 { key: "duration", label: "Duration" },
 { 
 key: "status", 
 label: "Status",
 render: (_, row) => (
 <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wide ${
 row.status === "Approved" ? "bg-green-100 text-green-800" : 
 row.status === "Rejected" ? "bg-red-100 text-red-800" : 
 "bg-yellow-100 text-yellow-800"
 }`}>
 {row.status}
 </span>
 )
 },
 { key: "appliedAt", label: "Applied Date" }
 ];

 const actions = [
 {
 icon: <div className="flex items-center gap-1"><FaEye size={12} /> View</div>,
 title: "View",
 className: "px-3 py-1.5 bg-app text-main rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors",
 onClick: (row) => handleViewLeave(row)
 },
 {
 icon: <div className="flex items-center gap-1"><FaEdit size={12} /> Edit</div>,
 title: "Edit",
 className: (row) => row.status === 'Pending' ? "px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-200 transition-colors" : "hidden",
 onClick: (row) => {
 if(row.status === 'Pending') handleEditLeave(row);
 }
 }
 ];

 return (
 <div className="min-h-screen bg-transparent p-4">
 {/* View Leave Modal */}
 {selectedLeave && (
 <ViewLeaveModal
 isOpen={viewModalOpen}
 setIsOpen={setViewModalOpen}
 leaveData={selectedLeave}
 isAdminPortal={false}
 />
 )}

 {/* Leave Summary Header */}
 <div className="bg-surface rounded-[1.2rem] shadow-md border border-white/50 mb-6 p-4">
 <div className="flex flex-col items-center sm:flex-row sm:justify-between sm:items-center">
 <div>
 <div className="text-base font-bold text-main uppercase tracking-tight mb-2">
 Leave Summary
 </div>
 <div className="flex flex-col sm:flex-row sm:items-center gap-3">
 <div className="flex items-center">
 <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
 <span className="text-xs text-main font-medium">
 Available Leaves: <span className="font-bold text-main">{availableLeaves}</span>
 </span>
 </div>
 <div className="flex items-center">
 <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>
 <span className="text-xs text-main font-medium">
 Booked Leaves: <span className="font-bold text-main">{bookedLeaves}</span>
 </span>
 </div>
 </div>
 </div>
 <div className="flex items-center gap-2">
 {refreshing && (
 <div className="text-xs text-muted flex items-center gap-1">
 <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
 Refreshing...
 </div>
 )}
              <button
                onClick={() => setIsOpen(true)}
                className="group relative flex items-center gap-3 px-8 py-4 bg-brand-primary text-white rounded-[1.5rem] font-bold text-xs uppercase tracking-[0.15em] hover:-translate-y-1 active:translate-y-0 transition-all duration-300 overflow-hidden"
              >
                <svg className="w-5 h-5 text-white transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Apply Leave</span>
              </button>
 </div>
 </div>
 </div>

 {/* Leave Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
 {/* Total Leaves Card */}
 <div className="bg-surface rounded-[1.2rem] shadow-md border border-white/50 p-4">
 <div className="flex items-center justify-between mb-3">
 <div className="text-main text-sm font-medium uppercase tracking-wide">Total Leaves</div>
 <div className="text-amber-600">
 <MdEventAvailable size={20} />
 </div>
 </div>
 <div className="text-2xl font-bold text-main">{totalLeaves}</div>
 <div className="h-1 w-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full mt-2"></div>
 </div>

 {/* Individual Leave Type Cards */}
 {leaveData.map((item, index) => (
 <div key={index} className="bg-surface rounded-[1.2rem] shadow-md border border-white/50 p-4">
 <div className="flex items-center justify-between mb-3">
 <div className="text-main text-sm font-medium uppercase tracking-wide">{item.label}</div>
 <div className="text-muted">
 {item.icon}
 </div>
 </div>
 <div className="text-2xl font-bold text-main">{item.available}</div>
 <div className={`h-1 w-full ${item.badgeColor} rounded-full mt-2`}></div>
 </div>
 ))}
 </div>

 {/* Applied Leaves Table */}
 <div className="bg-surface rounded-[1.2rem] shadow-md border border-white/50 p-4 mb-6">
 <div className="flex justify-between items-center mb-4">
 <h1 className="text-base font-bold text-main uppercase tracking-tight">Applied Leaves</h1>
 <button
 onClick={() => userData?._id && dispatch(refreshUserData(userData._id))}
 className="text-xs text-muted hover:text-main flex items-center gap-1"
 >
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
 </svg>
 Refresh
 </button>
 </div>

 {refreshing ? (
 <div className="p-4 text-center">
 <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-slate-600"></div>
 <p className="mt-2 text-muted text-xs font-medium uppercase tracking-wide">Loading leaves...</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <TableWithPagination
 columns={columns}
 data={appliedLeaves}
 loading={refreshing}
 emptyMessage="No records found"
 actions={actions}
 rowsPerPage={5}
 />
 </div>
 )}
 </div>

 {/* Holidays Table */}
 <div className="bg-surface rounded-[1.2rem] shadow-md border border-white/50 p-4 mb-6">
 <h1 className="text-base font-bold text-main uppercase tracking-tight mb-4">Holidays</h1>
 {loading.holidays ? (
 <div className="p-4 text-center">
 <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-slate-600"></div>
 <p className="mt-2 text-muted text-xs font-medium uppercase tracking-wide">Loading holidays...</p>
 </div>
 ) : errorMsg ? (
 <div className="text-red-600 bg-red-50 px-4 py-3 rounded-lg text-sm font-medium">{errorMsg}</div>
 ) : (
 <HolidayTable holidays={holidays} searchTerm="" />
 )}
 </div>

 <ApplyLeaveModal
 isOpen={isOpen}
 setIsOpen={setIsOpen}
 onLeaveAdded={handleLeaveAdded}
 />
 
 {editingLeave && (
 <EditLeaveModal
 isOpen={editModalOpen}
 setIsOpen={setEditModalOpen}
 leaveData={editingLeave}
 onLeaveEdited={handleLeaveEdited}
 />
 )}
 </div>
 );
};

export default LeaveSummary;