import React, { useState, useEffect, useRef } from "react";
import { IoCalendarNumberOutline } from "react-icons/io5";
import { FaAngleLeft, FaAngleRight, FaEye, FaCommentDots } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import timesheetApi from "../../api/timesheetApi";
import { toast } from "react-toastify";
import { Download, Plus, X, RotateCcw } from "lucide-react";
import api from "../../axios";
import TableWithPagination from "../../components/TableWithPagination";
import ApproveTimesheetViewModal from "../../components/ApproveTimesheetViewModal";
import AdminAddTimeLogModal from "../../components/AdminAddTimeLogModal";
import AdminCreateTimesheetModal from "../../components/AdminCreateTimesheetModal";
import ExportSelectionModal from "../../components/ExportSelectionModal";
import PageContainer from "../../components/ui/PageContainer";


const ApproveTimesheets = () => {
 // Helper functions defined first
 function getMonday(date) {
 const d = new Date(date);
 const day = d.getDay();
 const diff = d.getDate() - day + (day === 0 ? -6 : 1);
 const monday = new Date(d.setDate(diff));
 monday.setHours(0,0,0,0);
 return monday;
 }

 function getSunday(date) {
 const monday = getMonday(date);
 const sunday = new Date(monday);
 sunday.setDate(monday.getDate() + 6);
 sunday.setHours(23,59,59,999);
 return sunday;
 }

 const [selectedWeekStart, setSelectedWeekStart] = useState(getMonday(new Date()));
 const [weeklyData, setWeeklyData] = useState({
 weekStart: getMonday(new Date()).toISOString(),
 weekEnd: getSunday(new Date()).toISOString(),
 timesheets: [], // Pending
 approvedTimesheets: [],
 rejectedTimesheets: [],
 weeklyTotal: 0,
 weeklySubmitted: 0,
 weeklyApproved: 0
 });

 const [loading, setLoading] = useState(false);
 const [updating, setUpdating] = useState(false);
 const [selectedTimesheet, setSelectedTimesheet] = useState(null);
 const [showDetails, setShowDetails] = useState(false);
 const [showCalendar, setShowCalendar] = useState(false);
 const [activeTab, setActiveTab] = useState(0); // 0 = Pending, 1 = Approved
 const [allUsers, setAllUsers] = useState([]);
 const [isAddTimeLogOpen, setIsAddTimeLogOpen] = useState(false);
 const [isCreateTimesheetOpen, setIsCreateTimesheetOpen] = useState(false);
 const [isExportModalOpen, setIsExportModalOpen] = useState(false);

 const calendarRef = useRef(null);
 const [searchTerm, setSearchTerm] = useState("");
 const [isSearchActive, setIsSearchActive] = useState(false);
 const [selectedIds, setSelectedIds] = useState([]);
 const [rowsPerPage, setRowsPerPage] = useState(() => {
 return parseInt(localStorage.getItem('approve_timesheets_rows_per_page')) || 10;
 });

 // Filters for "All Timesheets" tab
 const [filterEmployee, setFilterEmployee] = useState("All");
 const [filterDate, setFilterDate] = useState(null);
 const [filterStatus, setFilterStatus] = useState("All");
 const [allTimesheets, setAllTimesheets] = useState([]);
 const [allLoading, setAllLoading] = useState(false);


 const tabs = [
 { title: "Pending Timesheets", status: "Pending", count: 0 },
 { title: "Approved Timesheets", status: "Approved", count: 0 },
 { title: "Rejected Timesheets", status: "Rejected", count: 0 },
 { title: "All Timesheets", status: "All", count: 0 }
 ];

 const ensureDate = (date) => {
 if (date instanceof Date) return date;
 if (typeof date === 'string' || typeof date === 'number') {
 const d = new Date(date);
 return isNaN(d.getTime()) ? new Date() : d;
 }
 return new Date();
 };

 function formatDate(date) {
 const dateObj = ensureDate(date);
 if (isNaN(dateObj.getTime())) return "Invalid Date";
 return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
 }

 function formatWeekRange(start, end) {
 const startDate = ensureDate(start);
 const endDate = ensureDate(end);
 if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return "Invalid Date Range";
 return `${formatDate(startDate)} - ${formatDate(endDate)}`;
 }

 useEffect(() => {
 const handleClickOutside = (event) => {
 if (calendarRef.current && !calendarRef.current.contains(event.target)) {
 setShowCalendar(false);
 }
 };
 if (showCalendar) document.addEventListener("mousedown", handleClickOutside);
 return () => document.removeEventListener("mousedown", handleClickOutside);
 }, [showCalendar]);

 useEffect(() => {
 const fetchData = async () => {
 try {
 const userRes = await api.get("/auth/me");
 const role = userRes.data.user.role || "";
 const processedRole = role.replace(/\s+/g, '').toLowerCase();

 if (processedRole === 'superadmin' || processedRole === 'admin') {
 const allUsersRes = await api.get("/users");
 setAllUsers(Array.isArray(allUsersRes.data) ? allUsersRes.data : allUsersRes.data.data || []);
 }
 } catch (error) {
 console.error("Error fetching users:", error);
 }
 };
 fetchData();
 }, []);

 useEffect(() => {
 if (activeTab === 3) {
 fetchAllTimesheets();
 } else {
 fetchWeeklyTimesheets();
 }
 }, [selectedWeekStart, activeTab, filterEmployee, filterDate, filterStatus]);

 const fetchAllTimesheets = async () => {
 setAllLoading(true);
 try {
 const params = {};
 if (filterEmployee !== "All") params.employeeId = filterEmployee;
 if (filterStatus !== "All") params.status = filterStatus;
 if (filterDate) {
 params.startDate = filterDate.toISOString().split('T')[0];
 params.endDate = filterDate.toISOString().split('T')[0];
 }
 
 const response = await timesheetApi.getAllTimesheets(params);
 setAllTimesheets(Array.isArray(response) ? response : []);
 } catch (error) {
 console.error("Error loading all timesheets:", error);
 toast.error("Failed to load all timesheets");
 } finally {
 setAllLoading(false);
 }
 };

 const fetchWeeklyTimesheets = async () => {
 setLoading(true);
 try {
 const weekStartObj = ensureDate(selectedWeekStart);
 const weekEndObj = getSunday(weekStartObj);

 // Validation: If future date range selected and no data, we will handle it in the UI
 if (weekStartObj > new Date()) {
 setWeeklyData({
 weekStart: weekStartObj.toISOString(),
 weekEnd: weekEndObj.toISOString(),
 timesheets: [],
 approvedTimesheets: [],
 rejectedTimesheets: [],
 weeklyTotal: 0,
 weeklySubmitted: 0,
 weeklyApproved: 0
 });
 setLoading(false);
 return;
 }

 // FIX: Use YYYY-MM-DD for the query
 const startStr = weekStartObj.toISOString().split('T')[0];
 const endStr = weekEndObj.toISOString().split('T')[0];

 // FIX: Call the ADMIN endpoint with startDate/endDate
 // Note: Make sure your API wrapper passes these params correctly
 const response = await timesheetApi.getAllTimesheets({ startDate: startStr, endDate: endStr });
 
 // The Admin endpoint returns an ARRAY, not an object.
 const allTimesheets = Array.isArray(response) ? response : (response.timesheets || []);
 
 // Safety filter for date range (TC_PT_002)
 const filteredInRange = allTimesheets.filter(ts => {
 if (!ts.date) return true;
 const tsDate = new Date(ts.date);
 tsDate.setHours(0,0,0,0);
 return tsDate >= weekStartObj && tsDate <= weekEndObj;
 });
 
 const pendingTimesheets = filteredInRange.filter(ts => ts.status === "Pending");
 const approvedTimesheets = filteredInRange.filter(ts => ts.status === "Approved");
 const rejectedTimesheets = filteredInRange.filter(ts => ts.status === "Rejected");

 const processedResponse = {
 weekStart: weekStartObj,
 weekEnd: weekEndObj,
 timesheets: pendingTimesheets.map(ts => ({ ...ts, date: ts.date ? new Date(ts.date) : null })),
 approvedTimesheets: approvedTimesheets.map(ts => ({ ...ts, date: ts.date ? new Date(ts.date) : null })),
 rejectedTimesheets: rejectedTimesheets.map(ts => ({ ...ts, date: ts.date ? new Date(ts.date) : null })),
 weeklyTotal: pendingTimesheets.length,
 weeklySubmitted: pendingTimesheets.reduce((sum, ts) => sum + (ts.submittedHours || 0), 0),
 weeklyApproved: approvedTimesheets.reduce((sum, ts) => sum + (ts.approvedHours || 0), 0)
 };

 setWeeklyData(processedResponse);
 } catch (error) {
 console.error("Error loading admin timesheets:", error);
 toast.error("Failed to load timesheets");
 } finally {
 setLoading(false);
 }
 };

 const navigateToPreviousWeek = () => {
 const currentDate = ensureDate(selectedWeekStart);
 const newDate = new Date(currentDate);
 newDate.setDate(newDate.getDate() - 7);
 setSelectedWeekStart(getMonday(newDate));
 };

 const navigateToNextWeek = () => {
 const currentDate = ensureDate(selectedWeekStart);
 const newDate = new Date(currentDate);
 newDate.setDate(newDate.getDate() + 7);
 setSelectedWeekStart(getMonday(newDate));
 };

 const handleWeekSelect = (date) => {
 const selectedDate = ensureDate(date);
 setSelectedWeekStart(getMonday(selectedDate));
 setShowCalendar(false);
 };

 const handleClearDateRange = () => {
 setSelectedWeekStart(getMonday(new Date()));
 };

 const handleSelectAll = (e) => {
 const currentData = getFilteredData();
 if (e.target.checked) {
 setSelectedIds(currentData.map(ts => ts._id));
 } else {
 setSelectedIds([]);
 }
 };

 const handleSelectRow = (id) => {
 setSelectedIds(prev => 
 prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
 );
 };

 const handleBulkApprove = async () => {
 if (selectedIds.length === 0) return;
 if (!window.confirm(`Are you sure you want to approve ${selectedIds.length} timesheets?`)) return;
 
 setUpdating(true);
 try {
 await Promise.all(selectedIds.map(id => 
 timesheetApi.updateTimesheetStatus(id, { status: "Approved" })
 ));
 toast.success(`Successfully approved ${selectedIds.length} timesheets`);
 setSelectedIds([]);
 fetchWeeklyTimesheets();
 } catch (error) {
 console.error("Bulk approval failed:", error);
 toast.error("Failed to approve some timesheets");
 } finally {
 setUpdating(false);
 }
 };

 const handleViewDetails = async (timesheet) => {
 try {
 const detailedTimesheet = await timesheetApi.getTimesheetById(timesheet._id);
 setSelectedTimesheet(detailedTimesheet);
 setShowDetails(true);
 } catch (error) {
 console.error("Failed to fetch timesheet details:", error);
 toast.error("Failed to load details");
 }
 };

 const handleStatusChange = async (timesheetId, status, approvedHours = null, comment = "") => {
 setUpdating(true);
 try {
 const updateData = { status };
 if (approvedHours !== null) updateData.approvedHours = approvedHours;
 if (comment && comment.trim()) updateData.comment = comment.trim();

 await timesheetApi.updateTimesheetStatus(timesheetId, updateData);
 
 // Refresh list after update
 await fetchWeeklyTimesheets();
 
 setShowDetails(false);
 setSelectedTimesheet(null);
 toast.success(`Timesheet ${status.toLowerCase()} successfully`);
 } catch (error) {
 console.error("Failed to update timesheet:", error);
 const errorMessage = error.response?.data?.message || "Failed to update timesheet";
 toast.error(errorMessage);
 } finally {
 setUpdating(false);
 }
 };

 const handleApprove = (timesheetId, approvedHours, comment) => handleStatusChange(timesheetId, "Approved", approvedHours, comment);
 const handleReject = (timesheetId, comment) => handleStatusChange(timesheetId, "Rejected", 0, comment);

 // Update tabs counts dynamically based on fetched data
 tabs[0].count = weeklyData.timesheets?.length || 0;
 tabs[1].count = weeklyData.approvedTimesheets?.length || 0;
 tabs[2].count = weeklyData.rejectedTimesheets?.length || 0;
 tabs[3].count = allTimesheets.length || 0;

 const getFilteredData = () => {
 let data = [];
 switch (activeTab) {
 case 0: data = weeklyData.timesheets || []; break;
 case 1: data = weeklyData.approvedTimesheets || []; break;
 case 2: data = weeklyData.rejectedTimesheets || []; break;
 case 3: data = allTimesheets || []; break;
 default: data = [];
 }

 if (!searchTerm) return data;
 
 const lowerSearch = searchTerm.toLowerCase();
 return data.filter(ts => {
 const employeeName = (ts.employee?.name || ts.employeeName || "").toLowerCase();
 const tsName = (ts.name || "").toLowerCase();
 const tsStatus = (ts.status || "").toLowerCase();
 
 return employeeName.includes(lowerSearch) ||
 tsName.includes(lowerSearch) ||
 tsStatus.includes(lowerSearch);
 });
 };

 const getCurrentData = () => getFilteredData();

 const handleExportCSV = () => {
 const dataToExport = getCurrentData();
 if (dataToExport.length === 0) {
 toast.warn("No data to export");
 return;
 }
 setIsExportModalOpen(true);
 };

 const performExportCSV = (selectedData) => {
 if (!selectedData || selectedData.length === 0) {
 toast.warn("No timesheets selected for export");
 return;
 }

 const headers = [
 "Employee Name", 
 "Email", 
 "Timesheet Date", 
 "Timesheet Name", 
 "Status", 
 "Submitted Hours", 
 "Approved Hours", 
 "Timelog Job", 
 "Timelog Description", 
 "Timelog Hours"
 ];

 const rows = [];
 selectedData.forEach(ts => {
 const base = [
 `"${ts.employee?.name || ts.employeeName || 'Unknown'}"`,
 `"${ts.employee?.email || 'N/A'}"`,
 ts.date ? new Date(ts.date).toLocaleDateString() : "N/A",
 `"${ts.name || 'Unnamed'}"`,
 ts.status || "Pending",
 ts.submittedHours || 0,
 ts.approvedHours || 0
 ];

 if (ts.timeLogs && ts.timeLogs.length > 0) {
 ts.timeLogs.forEach(log => {
 rows.push([
 ...base,
 `"${log.job || 'N/A'}"`,
 `"${log.description || 'N/A'}"`,
 log.hours || 0
 ]);
 });
 } else {
 rows.push([...base, "N/A", "N/A", 0]);
 }
 });

 const csvContent = [
 headers.join(","),
 ...rows.map(row => row.join(","))
 ].join("\n");

 const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
 const url = URL.createObjectURL(blob);
 const link = document.createElement("a");
 const weekStr = formatDate(selectedWeekStart).replace(/[\s,]+/g, '_');
 link.setAttribute("href", url);
 link.setAttribute("download", `timesheets_${tabs[activeTab].status.toLowerCase()}_${weekStr}.csv`);
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 toast.success(`Exported ${selectedData.length} timesheets successfully`);
 };


 const getCurrentActions = () => {
 if (activeTab === 0) {
 return [{
 icon: <FaEye size={14} />,
 title: "View & Approve/Reject",
 className: "bg-amber-50 text-amber-600 hover:bg-amber-100",
 onClick: (row) => handleViewDetails(row)
 }];
 } else {
 return [{
 icon: <FaEye size={14} />,
 title: "View Details",
 className: "bg-surface text-muted hover:bg-surface",
 onClick: (row) => handleViewDetails(row)
 }];
 }
 };

 const getEmptyMessage = () => {
 if (activeTab === 3) return "No timesheets found matching the filters";
 const weekRange = formatWeekRange(weeklyData.weekStart, weeklyData.weekEnd);
 if (activeTab === 0) return `No pending timesheets for ${weekRange}`;
 if (activeTab === 1) return `No approved timesheets for ${weekRange}`;
 return `No rejected timesheets for ${weekRange}`;
 };

 const timesheetColumns = [
 {
 key: "select",
 label: (
 <input 
 type="checkbox" 
 className="w-4 h-4 rounded border-border-primary text-amber-600 focus:ring-amber-500"
 onChange={handleSelectAll}
 checked={selectedIds.length > 0 && selectedIds.length === getFilteredData().length}
 />
 ),
 sortable: false,
 render: (row) => (
 <input 
 type="checkbox" 
 className="w-4 h-4 rounded border-border-primary text-amber-600 focus:ring-amber-500"
 checked={selectedIds.includes(row._id)}
 onChange={() => handleSelectRow(row._id)}
 onClick={(e) => e.stopPropagation()}
 />
 )
 },
 {
 key: "employeeName",
 label: "Employee",
 sortable: true,
 render: (row) => (
 <div className="flex items-center gap-2">
 {row.employee?.avatar ? (
 <img src={row.employee.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
 ) : (
 <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold">
 {row.employee?.name?.charAt(0) || "U"}
 </div>
 )}
 <span className="text-main font-medium">{row.employee?.name || row.employeeName || "Unknown"}</span>
 </div>
 )
 },
 {
 key: "date",
 label: "Date",
 sortable: true,
 render: (row) => {
 const dateObj = ensureDate(row.date);
 return (
 <span className="text-main font-medium">
 {isNaN(dateObj.getTime()) ? "Invalid Date" : dateObj.toLocaleDateString('en-US', {
 weekday: 'short', month: 'short', day: 'numeric'
 })}
 </span>
 );
 }
 },
 {
 key: "name",
 label: "Timesheet Name",
 sortable: true,
 render: (row) => (
 <span className="text-main font-medium truncate max-w-[150px] inline-block" title={row.name || "Unnamed"}>
 {row.name || "Unnamed"}
 </span>
 )
 },
 {
 key: "submittedHours",
 label: "Submitted Hours",
 sortable: true,
 render: (row) => <span className="text-main font-medium">{(row.submittedHours || 0).toFixed(1)}</span>
 },
 {
 key: "approvedHours",
 label: activeTab === 0 ? "To Approve" : "Approved Hours",
 sortable: true,
 render: (row) => <span className="text-main font-medium">{(row.approvedHours || 0).toFixed(1)}</span>
 },
 {
 key: "status",
 label: "Status",
 sortable: true,
 render: (row) => (
 <span className={`px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wide ${
 row.status === "Approved" ? "bg-green-100 text-green-800" : 
 row.status === "Rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
 }`}>
 {row.status || "Pending"}
 </span>
 )
 },
 {
 key: "comments",
 label: "Comments",
 sortable: false,
 render: (row) => {
 const commentCount = row.comments?.length || 0;
 if (commentCount === 0) {
 return <span className="text-muted text-xs">No comments</span>;
 }
 return (
 <div className="flex items-center gap-1 text-amber-600">
 <FaCommentDots size={14} />
 <span className="text-xs font-medium">{commentCount} comment{commentCount !== 1 ? 's' : ''}</span>
 </div>
 );
 }
 }
 ];

 return (
 <>
 <PageContainer
 title="Approve Timesheets"
 subtitle="Manage team timesheets and time logs"
 isCard={true}
 headerActions={
 <div className="flex items-center gap-3">
 {selectedIds.length > 0 && (
 <button
 onClick={handleBulkApprove}
 disabled={updating}
 className="btn btn-primary shadow-lg shadow-brand-primary/20 active:scale-95 disabled:opacity-50"
 >
 Bulk Approve ({selectedIds.length})
 </button>
 )}
 <button
 onClick={() => setIsAddTimeLogOpen(true)}
 className="btn btn-secondary flex items-center gap-2 active:scale-95"
 >
 <Plus size={16} strokeWidth={3} /> Time Log
 </button>
 <button
 onClick={() => setIsCreateTimesheetOpen(true)}
 className="btn btn-primary flex items-center gap-2 active:scale-95"
 >
 <Plus size={16} strokeWidth={3} /> Timesheet
 </button>
 </div>
 }
 filters={
 <div className="flex flex-col w-full">

 {/* ══ ROW 2: Input Controls ══ */}
 <div className="flex flex-wrap items-center gap-4">

 {/* Search */}
 <div className="relative group">
 <input
 type="text"
 placeholder="Search by name or status..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="glass-input pl-9 pr-9 w-52"
 />
 <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-brand-primary transition-colors pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
 </svg>
 {searchTerm && (
 <button
 onClick={() => setSearchTerm("")}
 className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-heading transition-colors"
 >
 <X size={14} />
 </button>
 )}
 </div>

 {/* Employee Filter — always visible */}
 <div className="relative">
 <select
 value={filterEmployee}
 onChange={(e) => setFilterEmployee(e.target.value)}
 className="h-[42px] pl-3 pr-8 bg-surface border border-border-subtle rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-100 focus:border-brand transition-all min-w-[160px] text-main appearance-none cursor-pointer hover:border-border-accent"
 >
 <option value="All">All Employees</option>
 {allUsers.map(user => (
 <option key={user._id} value={user._id}>{user.name}</option>
 ))}
 </select>
 <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
 </div>
 </div>

 {/* Date Controls: week navigator for tabs 0–2, date picker for tab 3 */}
 {activeTab === 3 ? (
 <div className="relative group">
 <DatePicker
 selected={filterDate}
 onChange={(date) => setFilterDate(date)}
 placeholderText="Select Date"
 isClearable
 className="h-[42px] pl-9 pr-3 bg-surface border border-border-subtle rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-100 transition-all min-w-[150px] text-main cursor-pointer hover:border-border-accent"
 />
 <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
 <IoCalendarNumberOutline size={16} />
 </div>
 </div>
 ) : (
 <div className="flex items-center gap-2">
 <button
 onClick={navigateToPreviousWeek}
 disabled={loading}
 className="w-[42px] h-[42px] flex items-center justify-center rounded-xl bg-surface text-muted hover:bg-amber-50 hover:text-amber-600 transition-all border border-border-subtle"
 >
 <FaAngleLeft size={14} />
 </button>

 <div className="relative" ref={calendarRef}>
 <button
 onClick={() => setShowCalendar(!showCalendar)}
 disabled={loading}
 className="h-[42px] px-4 flex items-center gap-2 bg-surface border border-border-subtle text-main rounded-xl font-semibold text-xs hover:border-amber-200 hover:bg-amber-50/30 transition-all min-w-[190px] justify-center shadow-sm"
 >
 <IoCalendarNumberOutline size={15} className="text-amber-500 flex-shrink-0" />
 <span>{formatWeekRange(weeklyData.weekStart, weeklyData.weekEnd)}</span>
 </button>
 <AnimatePresence>
 {showCalendar && (
 <motion.div
 initial={{ opacity: 0, y: 8 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: 8 }}
 className="absolute z-50 mt-2 rounded-2xl shadow-2xl left-0"
 >
 <DatePicker
 selected={ensureDate(selectedWeekStart)}
 onChange={handleWeekSelect}
 maxDate={new Date()}
 inline
 />
 </motion.div>
 )}
 </AnimatePresence>
 </div>

 <button
 onClick={navigateToNextWeek}
 disabled={loading}
 className="w-[42px] h-[42px] flex items-center justify-center rounded-xl bg-surface text-muted hover:bg-amber-50 hover:text-amber-600 transition-all border border-border-subtle"
 >
 <FaAngleRight size={14} />
 </button>
 </div>
 )}

 {/* Reset button — always visible */}
 <button
 onClick={() => {
 setFilterEmployee("All");
 setFilterDate(null);
 setFilterStatus("All");
 setSearchTerm("");
 if (activeTab !== 3) handleClearDateRange();
 }}
 title="Reset all filters"
 className="flex items-center gap-1.5 h-[42px] px-4 rounded-xl text-xs font-semibold text-muted hover:text-main hover:bg-app border border-transparent hover:border-border-subtle transition-all"
 >
 <RotateCcw size={13} />
 Reset
 </button>
 </div>

 {/* ══ ROW 3: Tabs (left) + Export + Summary (right) ══ */}
 <div className="flex flex-wrap justify-between items-center gap-4 mt-4">

 {/* LEFT: Status Tabs */}
 <div className="inline-flex items-center bg-surface p-1 rounded-xl shadow-sm border border-border-subtle">
 {tabs.map((item, index) => (
 <button
 key={index}
 onClick={() => setActiveTab(index)}
 className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
 activeTab === index
 ? "bg-surface text-brand-primary shadow-sm"
 : "text-muted hover:text-heading hover:bg-surface"
 }`}
 >
 {item.title.split(' ')[0]}
 {item.count > 0 && (
 <span className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[10px] ${
 activeTab === index ? 'bg-brand-primary/10 text-brand-primary' : 'bg-app text-muted'
 }`}>
 {item.count}
 </span>
 )}
 </button>
 ))}
 </div>

 {/* RIGHT: Export + Summary card */}
 <div className="flex items-center gap-4">
 <button
 onClick={handleExportCSV}
 className="btn btn-secondary flex items-center gap-2"
 >
 <Download size={15} /> Export CSV
 </button>

 <div className="bg-surface border border-border-subtle px-5 py-2 rounded-2xl flex flex-col items-end">
 <span className="text-[9px] font-black uppercase tracking-widest text-muted">
 {activeTab === 0 ? "Total Submitted" : "Total Approved"}
 </span>
 <span className="text-sm font-black text-heading">
 {activeTab === 0
 ? (weeklyData.weeklySubmitted || 0).toFixed(2)
 : (activeTab === 3
 ? (allTimesheets.reduce((sum, ts) => sum + (ts.approvedHours || 0), 0) || 0).toFixed(2)
 : (weeklyData.approvedTimesheets?.reduce((sum, ts) => sum + (ts.approvedHours || 0), 0) || 0).toFixed(2)
 )
 }
 <span className="ml-1 text-[10px] text-muted">HRS</span>
 </span>
 </div>
 </div>
 </div>

 </div>
 }
 >

 <div className="rounded-[1.5rem] shadow-sm border border-border-subtle overflow-hidden">
 <AnimatePresence mode="wait">
 <motion.div key={`${activeTab}-${selectedWeekStart}`} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.2 }}>
 {loading || allLoading ? (
 <div className="flex flex-col items-center justify-center py-12">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mb-4"></div>
 <p className="text-sm font-medium text-muted">Loading data...</p>
 </div>
 ) : (
 <TableWithPagination
 columns={timesheetColumns}
 data={getCurrentData()}
 loading={loading || allLoading}
 emptyMessage={getEmptyMessage()}
 rowsPerPage={rowsPerPage}
 onRowsPerPageChange={(newVal) => {
 setRowsPerPage(newVal);
 localStorage.setItem('approve_timesheets_rows_per_page', newVal);
 }}
 actions={getCurrentActions()}
 onRowClick={(row) => handleViewDetails(row)}
 />
 )}
 </motion.div>
 </AnimatePresence>
 </div>
 </PageContainer>

 {showDetails && selectedTimesheet && (
 <ApproveTimesheetViewModal
 timesheet={selectedTimesheet}
 onClose={() => { setShowDetails(false); setSelectedTimesheet(null); }}
 onApprove={activeTab === 0 ? handleApprove : undefined}
 onReject={activeTab === 0 ? handleReject : undefined}
 loading={updating}
 isApprovedTab={activeTab === 1}
 onCommentAdded={() => fetchWeeklyTimesheets()}
 />
 )}

 {isAddTimeLogOpen && (
 <AdminAddTimeLogModal
 open={isAddTimeLogOpen}
 onClose={() => setIsAddTimeLogOpen(false)}
 onSuccess={() => fetchWeeklyTimesheets()}
 allUsers={allUsers}
 />
 )}

 {isCreateTimesheetOpen && (
 <AdminCreateTimesheetModal
 open={isCreateTimesheetOpen}
 onClose={() => setIsCreateTimesheetOpen(false)}
 onTimesheetCreated={() => fetchWeeklyTimesheets()}
 allUsers={allUsers}
 />
 )}

 {isExportModalOpen && (
 <ExportSelectionModal
 isOpen={isExportModalOpen}
 onClose={() => setIsExportModalOpen(false)}
 items={getCurrentData()}
 onExport={performExportCSV}
 title={`Select ${tabs[activeTab].status} Timesheets to Export`}
 />
 )}
 </>
 );
};

export default ApproveTimesheets;

