import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion as Motion } from "framer-motion";
import {
 FaEye,
 FaCommentDots,
 FaClipboardList,
 FaHourglassHalf,
 FaCheckCircle,
 FaTimesCircle,
 FaExclamationTriangle,
 FaFileCsv,
 FaUsers,
 FaPlus,
 FaChevronLeft,
 FaChevronRight,
 FaCalendarDay,
} from "react-icons/fa";
import { CheckBadgeIcon } from "@heroicons/react/20/solid";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import timesheetApi from "../../api/timesheetApi";
import api from "../../axios";
import ApproveTimesheetViewModal from "../../components/ApproveTimesheetViewModal";
import AdminAddTimeLogModal from "../../components/AdminAddTimeLogModal";
import AdminCreateTimesheetModal from "../../components/AdminCreateTimesheetModal";
import ExportSelectionModal from "../../components/ExportSelectionModal";
import { STATUS_VARIANTS, resolveStatusVariant } from "../../components/StatusBadge";
import Toast from "../../components/Toast";
import PageContainer from "../../components/ui/PageContainer";
import PortalHero from "../../components/ui/PortalHero";
import PortalTabBar from "../../components/ui/PortalTabBar";
import ModernSelect from "../../components/ui/ModernSelect";
import GlassInput from "../../components/ui/GlassInput";
import GlassButton from "../../components/ui/GlassButton";
import FilterRow from "../../components/ui/FilterRow";
import FilterPanel from "../../components/ui/FilterPanel";
import StatCard from "../../components/ui/StatCard";
import StyledTable from "../../components/ui/StyledTable";
import { getInitials } from "../../utils/tableUtils";
import { formatDateForAPI } from "../../utils/dateUtils";
import { useConfirm } from "../../context/ConfirmContext";
import { useSelector } from "react-redux";

/* Status pill helpers — same tokens as the Leave Management tabs */
const statusBadge = (status) =>
 STATUS_VARIANTS[resolveStatusVariant(status)]?.badge || STATUS_VARIANTS.neutral.badge;

/* Hours pills (theme safe — dark variants included) */
const HOURS_PILL = {
  submitted: "lm-success-badge",
  approved: "lm-success-badge",
};

const EASE = [0.16, 1, 0.3, 1];

const ApproveTimesheets = () => {
 const confirm = useConfirm();
 const authStateUser = useSelector((state) => state.auth.user);
 const currentUser = authStateUser?.data?.user || authStateUser?.user || authStateUser || null;

 // Toast (same pattern as Leave Management)
 const [toast, setToast] = useState(null);
 const showToast = (message, type = "success") => {
  setToast({ message, type });
  setTimeout(() => setToast(null), 3000);
 };

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


 const [selectedWeekStart, setSelectedWeekStart] = useState(() => {
 return getMonday(new Date());
 });
 const [weeklyData, setWeeklyData] = useState({
 weekStart: getMonday(new Date()),
 weekEnd: getSunday(new Date()),
 timesheets: [], // Pending
 approvedTimesheets: [],
 rejectedTimesheets: [],
 weeklyTotal: 0,
 weeklySubmitted: 0,
 weeklyApproved: 0
 });

 const [loading, setLoading] = useState(false);
 const [error, setError] = useState(false);
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
 { title: "Pending", status: "Pending", icon: FaHourglassHalf, count: 0 },
 { title: "Approved", status: "Approved", icon: FaCheckCircle, count: 0 },
 { title: "Rejected", status: "Rejected", icon: FaTimesCircle, count: 0 },
 { title: "All", status: "All", icon: FaClipboardList, count: 0 },
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
 setError(false);
 try {
 const params = {};
 if (filterEmployee !== "All") params.employeeId = filterEmployee;
 if (filterStatus !== "All") params.status = filterStatus;
 if (filterDate) {
 params.startDate = formatDateForAPI(filterDate);
 params.endDate = formatDateForAPI(filterDate);
 }

 const response = await timesheetApi.getAllTimesheets(params);
 setAllTimesheets(Array.isArray(response) ? response : []);
 } catch (error) {
 console.error("Error loading all timesheets:", error);
 setError(true);
 showToast("Failed to load all timesheets");
 } finally {
 setAllLoading(false);
 }
 };

 const fetchWeeklyTimesheets = async () => {
 setLoading(true);
 setError(false);
 try {
 const weekStartObj = ensureDate(selectedWeekStart);
 const weekEndObj = getSunday(weekStartObj);

 // Validation: If future date range selected and no data, we will handle it in the UI
 if (weekStartObj > new Date()) {
 setWeeklyData({
 weekStart: weekStartObj,
 weekEnd: weekEndObj,
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
 const startStr = formatDateForAPI(weekStartObj);
 const endStr = formatDateForAPI(weekEndObj);

 const params = { startDate: startStr, endDate: endStr };
 if (filterEmployee !== "All") params.employeeId = filterEmployee;

 // FIX: Call the ADMIN endpoint with startDate/endDate/employeeId
 const response = await timesheetApi.getAllTimesheets(params);

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
 setError(true);
 showToast("Failed to load timesheets");
 } finally {
 setLoading(false);
 }
 };

 const handleRetry = () => {
 setError(false);
 if (activeTab === 3) fetchAllTimesheets();
 else fetchWeeklyTimesheets();
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
 await confirm({
 title: "Bulk Approve",
 message: `Are you sure you want to approve ${selectedIds.length} timesheets?`,
 confirmText: "Approve",
 isDanger: false,
 onConfirmAction: async () => {
 setUpdating(true);
 try {
 await Promise.all(selectedIds.map(id =>
 timesheetApi.updateTimesheetStatus(id, { status: "Approved" })
 ));
 showToast(`Successfully approved ${selectedIds.length} timesheets`);
 setSelectedIds([]);
 fetchWeeklyTimesheets();
 fetchAllTimesheets();
 } catch (error) {
 console.error("Bulk approval failed:", error);
 showToast("Failed to approve some timesheets");
 throw error;
 } finally {
 setUpdating(false);
 }
 }
 });
 };

 const handleViewDetails = async (timesheet) => {
 try {
 const detailedTimesheet = await timesheetApi.getTimesheetById(timesheet._id);
 setSelectedTimesheet(detailedTimesheet);
 setShowDetails(true);
 } catch (error) {
 console.error("Failed to fetch timesheet details:", error);
 showToast("Failed to load details");
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
 await fetchAllTimesheets();

 setShowDetails(false);
 setSelectedTimesheet(null);
 showToast(`Timesheet ${status.toLowerCase()} successfully`);
 } catch (error) {
 console.error("Failed to update timesheet:", error);
 const errorMessage = error.response?.data?.message || "Failed to update timesheet";
 showToast(errorMessage);
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

 // Normalize so employee sorting/rendering works on every row
 const normalized = data.map(ts => ({
 ...ts,
 employeeName: ts.employee?.name || ts.employeeName || "Unknown",
 }));

 if (!searchTerm) return normalized;

 const lowerSearch = searchTerm.toLowerCase();
 return normalized.filter(ts => {
 const employeeName = (ts.employeeName || "").toLowerCase();
 const tsName = (ts.name || "").toLowerCase();
 const tsStatus = (ts.status || "").toLowerCase();

 return employeeName.includes(lowerSearch) ||
 tsName.includes(lowerSearch) ||
 tsStatus.includes(lowerSearch);
 });
 };

 const getCurrentData = () => getFilteredData();

 /* ---------------- KPIs (reflect the active scope) ---------------- */
 const baseData = useMemo(() => {
 if (activeTab === 3) return allTimesheets;
 return [
 ...(weeklyData.timesheets || []),
 ...(weeklyData.approvedTimesheets || []),
 ...(weeklyData.rejectedTimesheets || []),
 ];
 }, [activeTab, allTimesheets, weeklyData]);

 const kpis = useMemo(() => {
 const byStatus = (s) => baseData.filter((r) => (r.status || "Pending") === s);
 const pending = byStatus("Pending");
 const approved = byStatus("Approved");
 const rejected = byStatus("Rejected");
 const sumHrs = (list, key) => list.reduce((sum, r) => sum + (Number(r[key]) || 0), 0);
 return {
 total: baseData.length,
 totalHrs: sumHrs(baseData, "submittedHours"),
 pending: pending.length,
 pendingHrs: sumHrs(pending, "submittedHours"),
 approved: approved.length,
 approvedHrs: sumHrs(approved, "approvedHours"),
 rejected: rejected.length,
 };
 }, [baseData]);

 /* ---------------- filters ---------------- */
 const weekChanged =
 ensureDate(selectedWeekStart).getTime() !== getMonday(new Date()).getTime();
 const hasFilters =
 Boolean(searchTerm) ||
 filterEmployee !== "All" ||
 Boolean(filterDate) ||
 (activeTab !== 3 && weekChanged);

 const resetFilters = () => {
 setSearchTerm("");
 setFilterEmployee("All");
 setFilterDate(null);
 setFilterStatus("All");
 setSelectedWeekStart(getMonday(new Date()));
 };

 const currentData = getCurrentData();

 const handleExportCSV = () => {
 const dataToExport = getCurrentData();
 if (dataToExport.length === 0) {
  showToast("No data to export", "error");
 return;
 }
 setIsExportModalOpen(true);
 };

 const performExportCSV = (selectedData) => {
 if (!selectedData || selectedData.length === 0) {
  showToast("No timesheets selected for export", "error");
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
 showToast(`Exported ${selectedData.length} timesheets successfully`);
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
 aria-label="Select all timesheets"
 className="w-4 h-4 rounded border-border-primary text-amber-600 dark:text-amber-400 focus:ring-amber-500"
 onChange={handleSelectAll}
 checked={selectedIds.length > 0 && selectedIds.length === currentData.length}
 />
 ),
 sortable: false,
 render: (_, row) => (
 <input
 type="checkbox"
 aria-label={`Select timesheet of ${row.employeeName}`}
 className="w-4 h-4 rounded border-border-primary text-amber-600 dark:text-amber-400 focus:ring-amber-500"
 checked={selectedIds.includes(row._id)}
 onChange={() => handleSelectRow(row._id)}
 onClick={(e) => e.stopPropagation()}
 />
 )
 },
 {
 key: "employeeName",
 label: "Employee",
 render: (_, row) => {
 const dateObj = ensureDate(row.date);
 const dateLabel = isNaN(dateObj.getTime())
 ? ""
 : dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
 return (
 <div className="flex items-center gap-2.5 min-w-[140px] md:min-w-[180px]">
 {row.employee?.avatar ? (
 <img
 src={row.employee.avatar}
 alt=""
 className="w-8 h-8 rounded-full object-cover border border-border-subtle flex-shrink-0"
 />
 ) : (
 <div className="w-8 h-8 rounded-full bg-amber-100 text-brand-text border border-amber-200 dark:bg-amber-900/40 dark:border-amber-800 dark:text-amber-400 flex items-center justify-center text-[11px] font-black flex-shrink-0">
 {getInitials(row.employeeName)}
 </div>
 )}
 <div className="min-w-0">
 <p className="text-sm font-bold text-heading truncate leading-tight">{row.employeeName}</p>
 <p className="text-[10px] text-muted truncate">
 <span className="hidden sm:inline">{row.employee?.email || "—"}</span>
 <span className="sm:hidden">{dateLabel || row.employee?.email || "—"}</span>
 </p>
 </div>
 </div>
 );
 },
 },
 {
 key: "date",
 label: "Date",
 hideBelow: "sm",
 render: (_, row) => {
 const dateObj = ensureDate(row.date);
 if (isNaN(dateObj.getTime())) return <span className="text-xs text-muted">-</span>;
 return (
 <div className="min-w-[110px]">
 <p className="text-xs font-bold text-heading whitespace-nowrap">
 {dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
 </p>
 <p className="text-[10px] text-muted mt-0.5">
 {dateObj.toLocaleDateString("en-US", { weekday: "long" })}
 </p>
 </div>
 );
 },
 },
 {
 key: "name",
 label: "Timesheet",
 hideBelow: "md",
 render: (_, row) => (
 <span
 className="text-xs font-semibold text-main truncate max-w-[160px] inline-block"
 title={row.name || "Unnamed"}
 >
 {row.name || "Unnamed"}
 </span>
 ),
 },
 {
 key: "submittedHours",
 label: "Submitted",
 align: "right",
 render: (_, row) => (
 <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tabular-nums border whitespace-nowrap ${HOURS_PILL.submitted}`}>
 {(row.submittedHours || 0).toFixed(1)} h
 </span>
 ),
 },
 {
 key: "approvedHours",
 label: activeTab === 0 ? "To Approve" : "Approved",
 align: "right",
 render: (_, row) => (
 <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tabular-nums border whitespace-nowrap ${HOURS_PILL.approved}`}>
 {(row.approvedHours || 0).toFixed(1)} h
 </span>
 ),
 },
 {
 key: "status",
 label: "Status",
 render: (_, row) => (
 <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border whitespace-nowrap ${statusBadge(row.status)}`}>
 {row.status || "Pending"}
 </span>
 ),
 },
 {
 key: "comments",
 label: "Comments",
 sortable: false,
 hideBelow: "lg",
 render: (_, row) => {
 const commentCount = row.comments?.length || 0;
 if (commentCount === 0) return <span className="text-muted text-xs">No comments</span>;
 return (
 <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-text whitespace-nowrap">
 <FaCommentDots size={13} />
 {commentCount} comment{commentCount !== 1 ? "s" : ""}
 </span>
 );
 },
 },
 ];

 const tableActions = [
 {
 icon: <FaEye size={13} />,
 title: "View timesheet",
 onClick: (row) => handleViewDetails(row),
 },
 ];

 /* ============ Tab bar model (Leave Management style) ============ */
 const HINTS = [
 "Timesheets waiting for your approval",
 "Timesheets approved in this scope",
 "Timesheets rejected in this scope",
 "Every timesheet regardless of status",
 ];
 const tabItems = tabs.map((item, index) => ({
 key: index,
 title: item.title,
 icon: item.icon,
 hint: HINTS[index],
 badge: item.count,
 }));


 const totalHrsValue =
 activeTab === 0
 ? (weeklyData.weeklySubmitted || 0).toFixed(2)
 : activeTab === 3
 ? (allTimesheets.reduce((sum, ts) => sum + (ts.approvedHours || 0), 0) || 0).toFixed(2)
 : (weeklyData.approvedTimesheets?.reduce((sum, ts) => sum + (ts.approvedHours || 0), 0) || 0).toFixed(2);

 return (
 <>
 <PageContainer isCard={false}>
 {toast && (
 <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
 )}

 <div className="flex flex-col gap-4 w-full">
{/* ============ HERO (Leave Management style) ============ */}
<PortalHero
      label="Timesheet approval overview"
   title="Approve Timesheets"
description="Review submitted hours, dig into time logs and approve or reject team timesheets — all from one place."
emblem={CheckBadgeIcon}
chips={[
 { icon: FaUsers, value: allUsers.length, label: " Employees" },
 { pulse: true, value: kpis.pending, label: " Awaiting approval" },
 ]}
 />

 {/* ============ TAB BAR (Leave Management style) ============ */}
 <PortalTabBar
 tabs={tabItems}
 activeKey={activeTab}
 onChange={setActiveTab}
 idPrefix="ts-tab"
 panelId="timesheet-tabpanel"
 ariaLabel="Timesheet status"
 layoutId="ts-tab-pill"
 right={
 <>
 <div className="hidden sm:flex items-center gap-2 bg-surface border border-border-subtle px-3.5 py-1.5 rounded-2xl whitespace-nowrap">
 <span className="text-[9px] font-black uppercase tracking-widest text-muted">
 {activeTab === 0 ? "Total Submitted" : "Total Approved"}
 </span>
 <span className="text-sm font-black text-heading tabular-nums">
 {totalHrsValue}
 <span className="ml-1 text-[10px] text-muted">HRS</span>
 </span>
 </div>

 <div className="flex flex-wrap items-center gap-2">
 {selectedIds.length > 0 && (
 <GlassButton
 variant="primary"
 size="sm"
 onClick={handleBulkApprove}
 disabled={updating}
 isLoading={updating}
 >
 Bulk Approve ({selectedIds.length})
 </GlassButton>
 )}
 <GlassButton variant="secondary" size="sm" icon={FaPlus} onClick={() => setIsAddTimeLogOpen(true)}>
 Time Log
 </GlassButton>
 <GlassButton variant="primary" size="sm" icon={FaPlus} onClick={() => setIsCreateTimesheetOpen(true)}>
 Timesheet
 </GlassButton>
 </div>
 </>
 }
 />

 {/* Tab content — remount on change so it fades in fresh */}
 <Motion.div
 key={activeTab}
 id="timesheet-tabpanel"
 role="tabpanel"
 aria-labelledby={`ts-tab-${activeTab}`}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.45, delay: 0.14, ease: EASE }}
 className="flex flex-col gap-4"
 >
 {error ? (
 /* ============ ERROR STATE ============ */
 <div className="glass-card text-center py-14">
 <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-danger-bg border border-danger-border flex items-center justify-center">
 <FaExclamationTriangle size={22} className="text-danger" />
 </div>
 <p className="text-sm font-bold text-heading">Failed to load timesheets</p>
 <p className="text-xs text-muted mt-1 mb-5">
 We couldn't load the timesheets. Please try again.
 </p>
 <GlassButton variant="primary" onClick={handleRetry}>
 RETRY
 </GlassButton>
 </div>
 ) : (
 <>
 {/* ============ KPI CARDS ============ */}
 <div className="lm-stagger grid grid-cols-2 xl:grid-cols-4 gap-4">
 <StatCard
 title="Total Timesheets"
 value={kpis.total}
 sub={`${kpis.totalHrs.toFixed(1)} hrs submitted`}
 icon={FaClipboardList}
 tone="text-main"
 iconBg="bg-app"
 />
 <StatCard
 title="Pending"
 value={kpis.pending}
 sub={`${kpis.pendingHrs.toFixed(1)} hrs awaiting`}
 icon={FaHourglassHalf}
 tone="text-amber-600 dark:text-amber-400"
 iconBg="bg-amber-100 dark:bg-amber-900/40"
 />
 <StatCard
 title="Approved"
 value={kpis.approved}
 sub={`${kpis.approvedHrs.toFixed(1)} hrs approved`}
 icon={FaCheckCircle}
 tone="text-emerald-600 dark:text-emerald-400"
 iconBg="bg-emerald-100 dark:bg-emerald-900/40"
 />
 <StatCard
 title="Rejected"
 value={kpis.rejected}
 sub="Timesheets declined"
 icon={FaTimesCircle}
 tone="text-rose-600 dark:text-rose-400"
 iconBg="bg-rose-100 dark:bg-rose-900/40"
 />
 </div>

 {/* ============ FILTERS ============ */}
 <FilterPanel
 title="Timesheets"
 subtitle={`${currentData.length} of ${baseData.length} timesheets · ${
 activeTab === 3 ? "all dates" : formatWeekRange(weeklyData.weekStart, weeklyData.weekEnd)
 }`}
 hint="Click View on any timesheet to review its details, time logs and comments, then approve or reject it"
 actions={
 <>
 {hasFilters && (
 <GlassButton variant="ghost" size="sm" onClick={resetFilters}>
 RESET
 </GlassButton>
 )}
 <GlassButton variant="secondary" size="sm" icon={FaFileCsv} onClick={handleExportCSV}>
 EXPORT CSV
 </GlassButton>
 </>
 }
 >
 <FilterRow>
 <GlassInput
 placeholder="Search by name or status..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="min-w-full sm:min-w-[220px] sm:flex-1"
 />

 <div className="w-full sm:w-auto sm:min-w-[180px] sm:max-w-[240px]">
 <ModernSelect
 value={filterEmployee}
 onChange={(e) => setFilterEmployee(e.target.value)}
 options={[
 { value: 'All', label: 'All Employees' },
 ...allUsers.map(user => ({ value: user._id, label: user.name }))
 ]}
 placeholder="All Employees"
 />
 </div>

 {/* Date Controls: week navigator for tabs 0–2, date picker for tab 3 */}
 {activeTab === 3 ? (
 <div className="relative group">
 <DatePicker
 selected={filterDate}
 onChange={(date) => setFilterDate(date)}
 placeholderText="Select Date"
 isClearable
 className="h-[42px] pl-9 pr-3 bg-surface border border-border-subtle rounded-xl text-xs font-semibold focus:ring-2 focus:ring-border-accent transition-all min-w-[150px] text-main cursor-pointer hover:border-border-accent"
 />
 <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
 <FaCalendarDay size={16} />
 </div>
 </div>
 ) : (
 <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
 <button
 onClick={navigateToPreviousWeek}
 disabled={loading}
 className="w-[42px] h-[42px] flex items-center justify-center rounded-xl border border-border-subtle bg-surface text-muted hover:text-heading hover:border-border-accent hover:bg-card-hover transition-all shadow-sm group disabled:opacity-50"
 title="Previous week"
 >
 <FaChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
 </button>

 <div className="relative flex-1 sm:flex-none min-w-[170px]" ref={calendarRef}>
 <button
 onClick={() => setShowCalendar(!showCalendar)}
 disabled={loading}
 className="w-full h-[42px] px-4 flex items-center gap-2 bg-surface border border-border-subtle text-main rounded-xl font-semibold text-xs hover:border-border-accent transition-all min-w-[170px] justify-center shadow-sm disabled:opacity-50"
 >
 <span className="cal-chip" aria-hidden="true">
  <FaCalendarDay size={14} />
  </span>
 <span className="truncate">{formatWeekRange(weeklyData.weekStart, weeklyData.weekEnd)}</span>
 </button>
 {showCalendar && (
 <div className="absolute z-50 mt-2 rounded-2xl shadow-2xl left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 animate-fadeIn">
 <DatePicker
 selected={ensureDate(selectedWeekStart)}
 onChange={handleWeekSelect}
 maxDate={new Date()}
 inline
 />
 </div>
 )}
 </div>

 <button
 onClick={navigateToNextWeek}
 disabled={loading}
 className="w-[42px] h-[42px] flex items-center justify-center rounded-xl border border-border-subtle bg-surface text-muted hover:text-heading hover:border-border-accent hover:bg-card-hover transition-all shadow-sm group disabled:opacity-50"
 title="Next week"
 >
 <FaChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
 </button>
 </div>
 )}
 </FilterRow>
 </FilterPanel>

 {/* ============ TABLE ============ */}
 <div key={`${activeTab}-${selectedWeekStart}`} className="animate-fadeIn">
 <StyledTable
 columns={timesheetColumns}
 data={currentData}
 loading={loading || allLoading}
 emptyMessage={getEmptyMessage()}
 onEmptyAction={hasFilters ? resetFilters : undefined}
 emptyActionLabel="Clear all filters"
 actions={tableActions}
 onRowClick={(row) => handleViewDetails(row)}
 rowsPerPage={rowsPerPage}
 onRowsPerPageChange={(newVal) => {
 setRowsPerPage(newVal);
 localStorage.setItem('approve_timesheets_rows_per_page', newVal);
 }}
 defaultSort={{ key: "date", direction: "desc" }}
 countLabel="timesheets"
 />
 </div>
 </>
 )}
 </Motion.div>
 </div>
 </PageContainer>

 {showDetails && selectedTimesheet && (
 <ApproveTimesheetViewModal
 timesheet={selectedTimesheet}
 onClose={() => { setShowDetails(false); setSelectedTimesheet(null); }}
 onApprove={selectedTimesheet?.status === 'Pending' && (String(currentUser?._id || currentUser?.id) !== String(selectedTimesheet?.employee?._id || selectedTimesheet?.employee)) ? handleApprove : undefined}
 onReject={selectedTimesheet?.status === 'Pending' && (String(currentUser?._id || currentUser?.id) !== String(selectedTimesheet?.employee?._id || selectedTimesheet?.employee)) ? handleReject : undefined}
 loading={updating}
 isApprovedTab={activeTab === 1 || selectedTimesheet?.status === 'Approved'}
 onCommentAdded={() => {
 fetchWeeklyTimesheets();
 fetchAllTimesheets();
 }}
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
