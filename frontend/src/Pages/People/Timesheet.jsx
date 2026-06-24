import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IoCalendarNumberOutline, IoDownloadOutline, IoPencil, IoTrash } from "react-icons/io5";
import { FaAngleLeft, FaAngleRight, FaEye, FaCommentDots } from "react-icons/fa";
import { downloadFile } from "../../utils/downloadFile";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import timesheetApi from "../../api/timesheetApi";
import { toast } from "react-toastify";
import TableWithPagination from "../../components/TableWithPagination";
import ViewTimesheetModal from "../../components/ViewTimesheetModal";
import EditTimesheetModal from "../../components/EditTimesheetModal";
import { moment, TIMEZONE } from "../../utils/dateUtils";
import PageContainer from "../../components/ui/PageContainer";
import GlassModal from "../../components/ui/GlassModal";
import { STATUS_VARIANTS, resolveStatusVariant } from "../../components/StatusBadge";

const Timesheet = ({ refreshTrigger }) => {
 const [showCalendar, setShowCalendar] = useState(false);
 const [selectedTimesheet, setSelectedTimesheet] = useState(null);
 const [showViewModal, setShowViewModal] = useState(false);
 const [editingTimesheet, setEditingTimesheet] = useState(null);
 const [showEditModal, setShowEditModal] = useState(false);
 const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({ show: false, timesheetId: null });
 
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

 const [selectedWeekStart, setSelectedWeekStart] = useState(getMonday(new Date()));
 const [weeklyData, setWeeklyData] = useState({
 weekStart: getMonday(new Date()).toISOString(),
 weekEnd: getSunday(new Date()).toISOString(),
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
 setDeleteConfirmDialog({ show: true, timesheetId: timesheet._id });
 };

 const handleConfirmDelete = async () => {
 const id = deleteConfirmDialog.timesheetId;
 if (!id) return;

 try {
 await timesheetApi.deleteTimesheet(id);
 toast.success("Timesheet deleted successfully");
 fetchWeeklyTimesheets();
 } catch (error) {
 console.error("Failed to delete timesheet:", error);
 toast.error(error.response?.data?.message || "Failed to delete timesheet");
 } finally {
 setDeleteConfirmDialog({ show: false, timesheetId: null });
 }
 };

 const handleCancelDelete = () => {
 setDeleteConfirmDialog({ show: false, timesheetId: null });
 };

 const handleTimesheetUpdated = () => {
 fetchWeeklyTimesheets();
 setShowEditModal(false);
 setEditingTimesheet(null);
 };

 // FIX: Display date as UTC to match backend storage
 const formatTimesheetDate = (date) => {
 const dateObj = ensureDate(date);
 if (isNaN(dateObj.getTime())) return "Invalid Date";
 return dateObj.toLocaleDateString('en-US', {
 weekday: 'short',
 month: 'short',
 day: 'numeric',
 timeZone: 'UTC'
 });
 };

 const timesheetColumns = [
 {
 key: "date",
 label: "Date",
 sortable: true,
 render: (row) => (
 <span className="text-main font-medium">
 {formatTimesheetDate(row.date)}
 </span>
 )
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
 render: (row) => (
 <span className="text-main font-medium">
 {(row.submittedHours || 0).toFixed(1)}
 </span>
 )
 },
 {
 key: "approvedHours",
 label: "Approved Hours",
 sortable: true,
 render: (row) => (
 <span className="text-main font-medium">
 {(row.approvedHours || 0).toFixed(1)}
 </span>
 )
 },
 {
 key: "status",
 label: "Status",
 sortable: true,
 render: (row) => (
 <span
 className={`px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wide ${STATUS_VARIANTS[resolveStatusVariant(row.status)]?.badge || STATUS_VARIANTS.neutral.badge}`}
 >
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
 <div className="flex items-center justify-center text gap-1 text-amber-600">
 <FaCommentDots size={14} />
 <span className="text-xs font-medium">{commentCount} {commentCount !== 1 ? 's' : ''}</span>
 </div>
 );
 }
 }
 ];

 const tableActions = [
 {
 icon: <FaEye size={14} />,
 title: "View Details",
 className: "bg-amber-50 text-amber-600 hover:bg-amber-100",
 onClick: (row) => handleViewDetails(row)
 },
 {
 icon: <IoPencil size={14} />,
 title: "Edit",
 className: (row) => `hover:bg-green-100 ${row.status === 'Pending' ? 'bg-green-50 text-green-600' : 'bg-surface text-muted cursor-not-allowed'}`,
 onClick: (row) => handleEditClick(row)
 },
 {
 icon: <IoTrash size={14} />,
 title: "Delete",
 className: (row) => `hover:bg-red-100 ${row.status === 'Pending' ? 'bg-red-50 text-red-600' : 'bg-surface text-muted cursor-not-allowed'}`,
 onClick: (row) => handleDeleteClick(row)
 }
 ];

 return (
 <PageContainer
 title="Weekly Timesheets"
 subtitle="Track your work hours and timesheets"
 loading={loading}
 isCard={true}
 headerActions={
 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
 <div className="flex flex-row items-center gap-3">
 <button
 onClick={navigateToPreviousWeek}
 className="btn-ghost p-2.5 rounded-lg text-muted"
 title="Previous Week"
 disabled={loading}
 >
 <FaAngleLeft size={18} />
 </button>

 <div className="relative" ref={calendarRef}>
 <button
 className="px-3 bg-surface rounded-lg flex items-center gap-2 hover:bg-hover btn btn-secondary"
 onClick={() => setShowCalendar(!showCalendar)}
 disabled={loading}
 >
 <IoCalendarNumberOutline size={18} className="text-muted" />
 <span className="text-sm font-medium">
 {formatWeekRange(weeklyData.weekStart, weeklyData.weekEnd)}
 </span>
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
 dateFormat="MM/dd/yyyy"
 inline
 calendarClassName="week-selector"
 />
 </motion.div>
 )}
 </AnimatePresence>
 </div>

 <button
 onClick={navigateToNextWeek}
 className="btn-ghost p-2.5 rounded-lg text-muted"
 title="Next Week"
 disabled={loading}
 >
 <FaAngleRight size={18} />
 </button>
 </div>

 <div className="flex flex-col sm:flex-row gap-2 items-center">
 <div className="bg-amber-50/80 border border-amber-200 px-3 py-2 rounded-lg shadow-sm">
 <span className="text-xs font-medium text-amber-900">
 Total: <span className="font-bold">{weeklyData.weeklyTotal?.toFixed(1) || 0}h</span>
 </span>
 </div>
 <div className={`px-3 py-2 rounded-lg shadow-sm border ${
 (weeklyData.remainingHours || 0) > 10 ? 'bg-green-50/80 border-green-200 text-green-900' :
 (weeklyData.remainingHours || 0) > 0 ? 'bg-yellow-50/80 border-yellow-200 text-yellow-900' : 'bg-red-50/80 border-red-200 text-red-900'
 }`}>
 <span className="text-xs font-medium">
 Remaining: <span className="font-bold">{(weeklyData.remainingHours || 0).toFixed(1)}h</span>
 </span>
 </div>
 </div>
 </div>
 }
 >
 <div className="bg-surface rounded-2xl border border-white/60 shadow-[inset_0_2px_10px_rgba(255,255,255,0.3)] overflow-hidden">
 <AnimatePresence mode="wait">
 <motion.div
 key={selectedWeekStart?.getTime?.() || 'default'}
 initial={{ x: 300, opacity: 0 }}
 animate={{ x: 0, opacity: 1 }}
 exit={{ x: -300, opacity: 0 }}
 transition={{ duration: 0.2 }}
 >
 {loading && (
 <div className="text-center p-6">
 <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
 <p className="mt-3 text-muted text-xs font-medium uppercase tracking-wide">
 Loading weekly timesheets...
 </p>
 </div>
 )}

 {error && (
 <div className="text-red-500 p-4 text-center text-sm bg-red-50 rounded-lg">
 {error}
 </div>
 )}

 {!loading && !error && (
 <TableWithPagination
 columns={timesheetColumns}
 data={weeklyData.timesheets || []}
 loading={loading}
 error={error}
 emptyMessage={`No timesheets for ${formatWeekRange(weeklyData.weekStart, weeklyData.weekEnd)}`}
 rowsPerPage={5}
 actions={tableActions}
 onRowClick={(row) => handleViewDetails(row)}
 />
 )}
 
 
 </motion.div>
 </AnimatePresence>
 </div>

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

 <GlassModal
 isOpen={deleteConfirmDialog.show}
 onClose={handleCancelDelete}
 title="Delete Timesheet"
 maxWidth="sm"
 footer={
 <div className="flex w-full gap-3">
 <button
 onClick={handleCancelDelete}
 className="btn-ghost flex-1 text-muted"
 >
 Cancel
 </button>
 <button
 onClick={handleConfirmDelete}
 className="flex-1 /10 text-red-600 font-bold text-xs hover: hover: border border-red-500/20 hover:border-transparent active:scale-95 btn btn-danger"
 >
 Delete
 </button>
 </div>
 }
 >
 <div className="text-center py-4">
 <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
 <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
 </svg>
 </div>
 <p className="text-sm text-heading font-medium">
 Are you sure you want to delete this timesheet? This action cannot be undone.
 </p>
 </div>
 </GlassModal>
 </PageContainer>
 );
};

export default Timesheet;
