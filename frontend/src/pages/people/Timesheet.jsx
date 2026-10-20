import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IoPencil } from "react-icons/io5";
import { FiTrash2 } from "react-icons/fi";
import {
  FaClipboardList,
  FaHourglassHalf,
  FaClock,
  FaCheckCircle,
 FaExclamationTriangle,
  FaCalendarDay,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { EyeIcon, PencilIcon } from "@heroicons/react/24/outline";
import { downloadFile } from "../../utils/downloadFile";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import timesheetApi from "../../api/timesheetApi";
import { toast } from "react-toastify";
import { useConfirm } from "../../context/ConfirmContext";
import GlobalTable from "../../components/ui/GlobalTable";
import {
  TableCommentCount,
  TableNumber,
  TableStatus,
  TableText,
} from "../../components/ui/TableCells";
import ViewTimesheetModal from "../../components/ViewTimesheetModal";
import EditTimesheetModal from "../../components/EditTimesheetModal";
import { moment, TIMEZONE, formatDateForAPI } from "../../utils/dateUtils";
import GlassButton from "../../components/ui/GlassButton";
import StatCard from "../../components/ui/StatCard";
import FilterPanel from "../../components/ui/FilterPanel";
import FilterRow from "../../components/ui/FilterRow";

const Timesheet = ({ refreshTrigger }) => {
 const [showCalendar, setShowCalendar] = useState(false);
 const [selectedTimesheet, setSelectedTimesheet] = useState(null);
 const [showViewModal, setShowViewModal] = useState(false);
 const [editingTimesheet, setEditingTimesheet] = useState(null);
 const [showEditModal, setShowEditModal] = useState(false);
 const confirm = useConfirm();
 
 function getMonday(date) {
 const d = new Date(date);
 const day = d.getDay();
 const diff = d.getDate() - day + (day === 0 ? -6 : 1);
 const monday = new Date(d.setDate(diff));
 monday.setHours(0, 0, 0, 0);
 return monday;
 }

 function getSunday(date) {
 const monday = getMonday(date);
 const sunday = new Date(monday);
 sunday.setDate(monday.getDate() + 6);
 sunday.setHours(23, 59, 59, 999);
 return sunday;
 }

 const [selectedWeekStart, setSelectedWeekStart] = useState(() => getMonday(new Date()));
 const [weeklyData, setWeeklyData] = useState({
 weekStart: getMonday(new Date()),
 weekEnd: getSunday(new Date()),
 timesheets: [],
 weeklyTotal: 0,
 remainingHours: 40
 });
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState(null);

 const calendarRef = useRef(null);

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
 return dateObj.toLocaleDateString("en-US", {
 month: "short",
 day: "numeric",
 year: "numeric"
 });
 }

 function formatWeekRange(start, end) {
 const startDate = start instanceof Date ? start : new Date(start);
 const endDate = end instanceof Date ? end : new Date(end);
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
 fetchWeeklyTimesheets();
 }, [selectedWeekStart, refreshTrigger]);

 const fetchWeeklyTimesheets = async () => {
 setLoading(true);
 setError(null);
 try {
 // Send correct EST string
 const weekStartDate = ensureDate(selectedWeekStart);
 const weekStartStr = moment(weekStartDate).format('YYYY-MM-DD');

 // Backend now returns strictly personal scope by default
 const response = await timesheetApi.getWeeklyTimesheets(weekStartStr);

 const processedResponse = {
 ...response,
 weekStart: response.weekStart ? new Date(response.weekStart) : getMonday(new Date()),
 weekEnd: response.weekEnd ? new Date(response.weekEnd) : getSunday(new Date()),
 timesheets: response.timesheets?.map(timesheet => ({
 ...timesheet,
 date: timesheet.date ? new Date(timesheet.date) : null
 })) || []
 };

 setWeeklyData(processedResponse);
 } catch (error) {
 console.error("Error loading weekly timesheets:", error);
 setError(error.response?.data?.message || "Failed to load timesheets");
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

 const downloadAttachment = async (timesheetId, attachmentId, filename) => {
 try {
 const timesheet = await timesheetApi.getTimesheetById(timesheetId);
 const attachment = timesheet.attachments?.find(att => att._id === attachmentId);

 if (attachment) {
 // Use the secure download utility with blobName priority
 await downloadFile(
 attachment.blobName || attachment.url || attachment.path, 
 filename || attachment.originalname
 );
 } else {
 toast.error("Attachment not found");
 }
 } catch (error) {
 console.error("Download failed:", error);
 // toast error is handled inside downloadFile
 }
 };

 const handleViewDetails = async (timesheet) => {
 try {
 const detailedTimesheet = await timesheetApi.getTimesheetById(timesheet._id);
 setSelectedTimesheet(detailedTimesheet);
 setShowViewModal(true);
 } catch (error) {
 console.error("Failed to fetch timesheet details:", error);
 toast.error("Failed to load details");
 }
 };

 const handleCommentAdded = (updatedTimesheet) => {
 // Update the timesheet in the list
 setWeeklyData(prev => ({
 ...prev,
 timesheets: prev.timesheets.map(ts =>
 ts._id === updatedTimesheet._id ? updatedTimesheet : ts
 )
 }));
 };

 const handleEditClick = (timesheet) => {
 if (timesheet.status !== 'Pending') {
 toast.error("You can only edit timesheets that are in Pending status");
 return;
 }
 setEditingTimesheet(timesheet);
 setShowEditModal(true);
 };

 const handleDeleteClick = (timesheet) => {
 if (timesheet.status !== 'Pending') {
 toast.error("You can only delete timesheets that are in Pending status");
 return;
 }
 confirm({
 title: "Delete Timesheet",
 message: "Are you sure you want to delete this timesheet? This action cannot be undone.",
 onConfirmAction: async () => {
 try {
 await timesheetApi.deleteTimesheet(timesheet._id);
 toast.success("Timesheet deleted successfully");
 fetchWeeklyTimesheets();
 } catch (error) {
 console.error("Failed to delete timesheet:", error);
 toast.error(error.response?.data?.message || "Failed to delete timesheet");
 throw error;
 }
 },
 });
 };

 const handleTimesheetUpdated = () => {
 fetchWeeklyTimesheets();
 setShowEditModal(false);
 setEditingTimesheet(null);
 };

  // FIX: Display date according to user's system timezone
  const formatTimesheetDate = (date) => {
  const dateObj = ensureDate(date);
  if (isNaN(dateObj.getTime())) return "Invalid Date";
  return dateObj.toLocaleDateString('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric'
  });
  };

 const timesheetColumns = [
 {
 key: "date",
 label: "Date",
 sortable: true,
 render: (_, row) => <TableText value={formatTimesheetDate(row.date)} />
 },
 {
 key: "name",
 label: "Timesheet Name",
 sortable: true,
 render: (_, row) => (
 <TableText value={row.name || "Unnamed"} title={row.name || "Unnamed"} truncate maxWidth="max-w-[150px]" />
 )
 },
 {
 key: "submittedHours",
 label: "Submitted Hours",
 sortable: true,
 render: (_, row) => <TableNumber value={row.submittedHours || 0} decimals={1} />
 },
 {
 key: "approvedHours",
 label: "Approved Hours",
 sortable: true,
 render: (_, row) => <TableNumber value={row.approvedHours || 0} decimals={1} />
 },
 {
 key: "status",
 label: "Status",
 sortable: true,
 render: (_, row) => <TableStatus value={row.status || "Pending"} />
 },
 {
 key: "comments",
 label: "Comments",
 sortable: false,
 render: (_, row) => <TableCommentCount count={row.comments?.length || 0} />
 }
 ];

const tableActions = [
  {
  icon: <EyeIcon className="w-4 h-4" />,
  title: "View Details",
  className: "",
  onClick: (row) => handleViewDetails(row)
  },
  {
  icon: <PencilIcon className="w-4 h-4" />,
  title: "Edit",
  className: (row) => row.status === 'Pending' ? "" : "bg-surface text-muted cursor-not-allowed",
  onClick: (row) => handleEditClick(row)
  },
  {
  icon: <FiTrash2 size={14} />,
  title: "Delete",
  className: (row) => row.status === 'Pending' ? "" : "bg-surface text-muted cursor-not-allowed",
  onClick: (row) => handleDeleteClick(row)
  }
  ];

 const timesheetCount = weeklyData.timesheets?.length || 0;
 const approvedHoursWeek = (weeklyData.timesheets || []).reduce(
 (sum, ts) => sum + (ts.approvedHours || 0),
 0
 );
 const remaining = weeklyData.remainingHours || 0;
 const remainingTone =
 remaining > 10
 ? "text-sky-600 dark:text-sky-400"
 : remaining > 0
 ? "text-amber-600 dark:text-amber-400"
 : "text-rose-600 dark:text-rose-400";

 return (
 <div className="flex flex-col gap-4">
 {error ? (
 /* ============ ERROR STATE ============ */
 <div className="glass-card text-center py-14">
 <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-danger-bg border border-danger-border flex items-center justify-center">
 <FaExclamationTriangle size={22} className="text-danger" />
 </div>
 <p className="text-sm font-bold text-heading">Failed to load timesheets</p>
 <p className="text-xs text-muted mt-1 mb-5">{error}</p>
 <GlassButton variant="primary" onClick={fetchWeeklyTimesheets}>
 RETRY
 </GlassButton>
 </div>
 ) : (
 <>
 {/* ============ KPI CARDS ============ */}
 <div className="lm-stagger grid grid-cols-2 xl:grid-cols-4 gap-4">
 <StatCard
 title="Timesheets"
 value={timesheetCount}
 sub={formatWeekRange(weeklyData.weekStart, weeklyData.weekEnd)}
 icon={FaClipboardList}
 tone="text-main"
 />
 <StatCard
 title="Total Hours"
 value={(weeklyData.weeklyTotal || 0).toFixed(1)}
 sub="Submitted this week"
 icon={FaHourglassHalf}
 tone="text-amber-600 dark:text-amber-400"
 />
 <StatCard
 title="Remaining"
 value={remaining.toFixed(1)}
 sub="Hours left of weekly target"
 icon={FaClock}
 tone={remainingTone}
 />
 <StatCard
 title="Approved Hours"
 value={approvedHoursWeek.toFixed(1)}
 sub="Approved this week"
 icon={FaCheckCircle}
 tone="text-emerald-600 dark:text-emerald-400"
 />
 </div>

 {/* ============ FILTERS ============ */}
 <FilterPanel
 title="Weekly Timesheets"
 subtitle={`${timesheetCount} timesheets · ${formatWeekRange(weeklyData.weekStart, weeklyData.weekEnd)}`}
 hint="Step through weeks with the arrows or jump to any week from the calendar. Click a row to view a timesheet."
 >
 <FilterRow>
 <button
 onClick={navigateToPreviousWeek}
 disabled={loading}
 className="w-[42px] h-[42px] flex items-center justify-center rounded-xl border border-border-subtle bg-surface text-muted hover:text-heading hover:border-border-accent hover:bg-card-hover transition-all shadow-sm group disabled:opacity-50"
 title="Previous Week"
 >
 <FaChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
 </button>

 <div className="relative flex-1 sm:flex-none min-w-[190px]" ref={calendarRef}>
 <button
 className="w-full h-[42px] px-4 flex items-center gap-2 bg-surface border border-border-subtle text-main rounded-xl font-semibold text-xs hover:border-border-accent transition-all min-w-[190px] justify-center shadow-sm disabled:opacity-50"
 onClick={() => setShowCalendar(!showCalendar)}
 disabled={loading}
 >
 <span className="cal-chip" aria-hidden="true">
  <FaCalendarDay size={14} />
  </span>
 <span className="truncate">{formatWeekRange(weeklyData.weekStart, weeklyData.weekEnd)}</span>
 </button>

 <AnimatePresence>
 {showCalendar && (
 <motion.div
 initial={{ opacity: 0, y: -10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="absolute z-50 mt-2 bg-surface dark:bg-slate-800 shadow-2xl rounded-xl border border-border-subtle p-2"
 >
 <DatePicker
 selected={ensureDate(selectedWeekStart)}
 onChange={handleWeekSelect}
 dateFormat="M/d/yyyy"
 inline
 calendarClassName="week-selector"
 />
 </motion.div>
 )}
 </AnimatePresence>
 </div>

 <button
 onClick={navigateToNextWeek}
 disabled={loading}
 className="w-[42px] h-[42px] flex items-center justify-center rounded-xl border border-border-subtle bg-surface text-muted hover:text-heading hover:border-border-accent hover:bg-card-hover transition-all shadow-sm group disabled:opacity-50"
 title="Next Week"
 >
 <FaChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
 </button>
 </FilterRow>
 </FilterPanel>

 {/* ============ TABLE ============ */}
 <div key={selectedWeekStart?.getTime?.() || "default"} className="animate-fadeIn">
 <GlobalTable
 columns={timesheetColumns}
 data={weeklyData.timesheets || []}
 loading={loading}
 emptyMessage={`No timesheets for ${formatWeekRange(weeklyData.weekStart, weeklyData.weekEnd)}`}
 rowsPerPage={5}
 actions={tableActions}
 onRowClick={(row) => handleViewDetails(row)}
 defaultSort={{ key: "date", direction: "desc" }}
 countLabel="timesheets"
 />
 </div>
 </>
 )}

 {/* View Details Modal */}
 {showViewModal && selectedTimesheet && (
 <ViewTimesheetModal
 timesheet={selectedTimesheet}
 onClose={() => {
 setShowViewModal(false);
 setSelectedTimesheet(null);
 }}
 onCommentAdded={handleCommentAdded}
 />
 )}

 {/* Edit Timesheet Modal */}
 {showEditModal && editingTimesheet && (
 <EditTimesheetModal
 open={showEditModal}
 onClose={() => {
 setShowEditModal(false);
 setEditingTimesheet(null);
 }}
 timesheet={editingTimesheet}
 onTimesheetUpdated={handleTimesheetUpdated}
 />
 )}
 </div>
 );
};

export default Timesheet;
