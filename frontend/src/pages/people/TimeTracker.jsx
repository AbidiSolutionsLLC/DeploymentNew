import React, { useState, useEffect, useRef } from "react";
import AddTimeLogModal from "./AddTimeLogModal";
import { FiTrash2 } from "react-icons/fi";
import {
  FaList,
  FaFileInvoice,
  FaClipboardList,
  FaHourglassHalf,
  FaChartLine,
  FaClock,
  FaPlus,
  FaRegCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle,
} from "react-icons/fa";
import { ClockIcon } from "@heroicons/react/20/solid";
import { EyeIcon, PencilIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import EditTimeLogModal from "./EditTimeLogModal";
import ViewTimeLogModal from "./ViewTimeLogModal";
import timeLogApi from "../../api/timeLogApi";
import { toast } from "react-toastify";
import Timesheet from "./Timesheet";
import CreateTimesheetModal from "./CreateTimesheetModal";
import timesheetApi from "../../api/timesheetApi";
import { useConfirm } from "../../context/ConfirmContext";
import PageContainer from "../../components/ui/PageContainer";
import PortalHero from "../../components/ui/PortalHero";
import PortalTabBar from "../../components/ui/PortalTabBar";
import StatCard from "../../components/ui/StatCard";
import FilterPanel from "../../components/ui/FilterPanel";
import FilterRow from "../../components/ui/FilterRow";
import GlobalTable from "../../components/ui/GlobalTable";
import { TableNumber, TableText } from "../../components/ui/TableCells";
import GlassButton from "../../components/ui/GlassButton";

const EASE = [0.16, 1, 0.3, 1];

const TimeTracker = () => {
 const [activeTab, setActiveTab] = useState(0);
 const [isAddTimeLogModalOpen, setIsAddTimeLogModalOpen] = useState(false);
 const [modalMode, setModalMode] = useState("add");
 const [editingLogId, setEditingLogId] = useState(null);
 const [viewingLog, setViewingLog] = useState(null);
 const [timeLogs, setTimeLogs] = useState([]);
 const [selectedDate, setSelectedDate] = useState(() => new Date());
 const [showCalendar, setShowCalendar] = useState(false);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState(null);
 const [isCreateTimesheetModalOpen, setIsCreateTimesheetModalOpen] = useState(false);
 const [timesheets, setTimesheets] = useState([]);
 const [refreshTimesheetTrigger, setRefreshTimesheetTrigger] = useState(0);
 const confirm = useConfirm();

 // Tab bar model — live counts ride along as badges (Leave Management style)
 const tabs = [
 { key: 0, title: "Time Logs", icon: FaList, hint: "Daily work entries for a selected date", badge: timeLogs.length },
 { key: 1, title: "Timesheets", icon: FaFileInvoice, hint: "Weekly timesheets submitted for approval", badge: Array.isArray(timesheets) ? timesheets.length : 0 },
 ];

 const calendarRef = useRef(null);

 useEffect(() => {
 const handleClickOutside = (event) => {
 if (calendarRef.current && !calendarRef.current.contains(event.target)) {
 setShowCalendar(false);
 }
 };

 if (showCalendar) {
 document.addEventListener("mousedown", handleClickOutside);
 }

 return () => {
 document.removeEventListener("mousedown", handleClickOutside);
 };
 }, [showCalendar]);

 const fetchTimeLogs = async () => {
 try {
 setLoading(true);
 const response = await timeLogApi.getEmployeeTimeLogs();
 setTimeLogs(response);
 setError(null);
 } catch (err) {
 setError(err.response?.data?.message || "Failed to load time logs");
 toast.error("Failed to load time logs");
 } finally {
 setLoading(false);
 }
 };

 const fetchTimesheets = async (month, year) => {
 try {
 const today = new Date();
 const targetMonth = month || today.getMonth() + 1;
 const targetYear = year || today.getFullYear();

 const response = await timesheetApi.getEmployeeTimesheets(targetMonth, targetYear);
 setTimesheets(response);
 } catch (error) {
 console.error("Failed to fetch timesheets:", error);
 toast.error("Failed to load timesheets");
 }
 };

 useEffect(() => {
 if (activeTab === 0) {
 fetchTimeLogs();
 }
 }, [activeTab]);

 useEffect(() => {
 if (activeTab === 1) {
 fetchTimesheets();
 }
 }, [activeTab]);

 // Load the timesheet list once up-front so the Timesheets tab badge is live
 // before that tab is ever opened.
 useEffect(() => {
 fetchTimesheets();
 }, []);

 const handleTimesheetCreated = async () => {
 if (activeTab === 1) {
 setRefreshTimesheetTrigger(prev => prev + 1);
 }
 fetchTimesheets(); // keep the tab badge in sync with the new timesheet
 setIsCreateTimesheetModalOpen(false);
 };


  // Helper to safely parse backend date using local timezone
  const getBackendDateParts = (dateStr) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return {
  day: date.getDate(),
  month: date.getMonth(),
  year: date.getFullYear()
  };
  };

 const filteredData = selectedDate
 ? timeLogs.filter(item => {
 const parts = getBackendDateParts(item.date);
 return (
 parts &&
 parts.day === selectedDate.getDate() &&
 parts.month === selectedDate.getMonth() &&
 parts.year === selectedDate.getFullYear()
 );
 })
 : timeLogs;

 const totalHours = filteredData.reduce((sum, log) => sum + (log.totalHours || log.hours || 0), 0);
 const totalAllHours = timeLogs.reduce((sum, log) => sum + (log.totalHours || log.hours || 0), 0);
 const avgHours = filteredData.length ? totalHours / filteredData.length : 0;
 const shortDateLabel = selectedDate
 ? selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
 : "";

 useEffect(() => {
 // Current page is managed internally by GlobalTable
 }, [selectedDate, timeLogs]);

 const handleSaveLogs = async (newLogs) => {
 try {
 if (modalMode === "add") {
 for (const log of newLogs) {
 const formData = new FormData();
 formData.append('job', log.jobTitle);
 formData.append('date', log.date);
 formData.append('hours', log.totalHours);
 formData.append('description', log.description);
 if (log.attachment) {
 formData.append('attachments', log.attachment);
 }
 await timeLogApi.createTimeLog(formData);
 }
 } else if (modalMode === "edit" && editingLogId) {
 const log = newLogs[0];
 const formData = new FormData();
 formData.append('job', log.jobTitle);
 formData.append('date', log.date);
 formData.append('hours', log.totalHours);
 formData.append('description', log.description);
 if (log.attachment) {
 formData.append('attachments', log.attachment);
 }
 await timeLogApi.updateTimeLog(editingLogId, formData);
 }

 await fetchTimeLogs();
 setIsAddTimeLogModalOpen(false);
 setEditingLogId(null);
 setModalMode("add");
 toast.success("Time log saved successfully");
 } catch (error) {
 console.error("Failed to save time log:", error);
 toast.error(error.response?.data?.message || "Failed to save time log");
 }
 };

 const handleDeleteClick = (id) => {
 confirm({
 title: "Delete Time Log",
 message: "Are you sure you want to delete this time log? This action cannot be undone.",
 onConfirmAction: async () => {
 try {
 await timeLogApi.deleteTimeLog(id);
 fetchTimeLogs();
 toast.success("Time log deleted successfully");
 } catch (error) {
 console.error("Failed to delete time log:", error);
 toast.error(error.response?.data?.message || "Failed to delete time log");
 throw error;
 }
 },
 });
 };

 const handleViewLog = (log) => {
 setViewingLog({
 ...log,
 jobTitle: log.jobTitle || log.job,
 totalHours: log.totalHours || log.hours,
 attachmentName: log.attachments?.[0]?.originalname
 });
 };

 const formatDate = (date) => {
 return date ? new Date(date).toLocaleDateString('en-US', {
 year: 'numeric',
 month: 'long',
 day: 'numeric'
 }) : '';
 };

 // Display backend date correctly (using local timezone)
 const formatBackendDate = (dateStr) => {
 if (!dateStr) return '';
 const date = new Date(dateStr);
 return date.toLocaleDateString('en-US', {
 year: 'numeric',
 month: 'numeric',
 day: 'numeric'
 });
 };

 const navigateToPreviousDay = () => {
 const newDate = new Date(selectedDate);
 newDate.setDate(newDate.getDate() - 1);
 setSelectedDate(newDate);
 };

 const navigateToNextDay = () => {
 const newDate = new Date(selectedDate);
 const today = new Date();
 // Optional: Limit next day navigation to not go beyond today
 if (newDate < today.setHours(0, 0, 0, 0)) {
 newDate.setDate(newDate.getDate() + 1);
 setSelectedDate(newDate);
 } else {
 // Allow going to today
 const nextDate = new Date(selectedDate);
 nextDate.setDate(nextDate.getDate() + 1);
 if (nextDate <= new Date()) setSelectedDate(nextDate);
 }
 };


  const timeLogColumns = [
    {
      key: "jobTitle",
      label: "Job / Task",
      sortable: true,
      render: (value, row) => {
        const task = row.task && typeof row.task === 'object' ? row.task : null;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-heading text-xs">
              {row.jobTitle || row.job}
            </span>
            {task && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted">
                {task.taskID && (
                  <span className="font-mono text-brand-primary font-bold">{task.taskID}</span>
                )}
                <span className="truncate max-w-[180px]">{task.title}</span>
                {task.status && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-app border border-border-subtle uppercase">
                    {task.status}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (value, row) => <TableText value={formatBackendDate(row.date)} muted />
    },
    {
      key: "description",
      label: "Description",
      sortable: false,
      render: (value, row) => (
        <TableText value={row.description} muted truncate maxWidth="max-w-xs" />
      )
    },
    {
      key: "status",
      label: "Timesheet Status",
      sortable: true,
      render: (value, row) => (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
          row.isAddedToTimesheet
            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
            : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
        }`}>
          {row.isAddedToTimesheet ? "In Timesheet" : "Unsubmitted"}
        </span>
      )
    },
    {
      key: "totalHours",
      label: "Hours",
      sortable: true,
      render: (value, row) => <TableNumber value={row.totalHours || row.hours} />
    }
  ];
// Define actions for Time Logs
  const timeLogActions = [
  {
  icon: <EyeIcon className="w-4 h-4" />,
  title: "View",
  className: "",
  onClick: (row) => handleViewLog(row)
  },
  {
  icon: <PencilIcon className="w-4 h-4" />,
  title: "Edit",
  className: (row) => row.isAddedToTimesheet ? "hidden" : "",
  onClick: (row) => {
  setEditingLogId(row._id);
  setModalMode("edit");
  setIsAddTimeLogModalOpen(true);
  }
  },
  {
  icon: <FiTrash2 size={16} />,
  title: "Delete",
  className: (row) => row.isAddedToTimesheet ? "hidden" : "",
  onClick: (row) => handleDeleteClick(row._id)
  }
  ];

 // Table rendering is handled below in the return

 return (
 <>
 <PageContainer isCard={false}>
 <div className="flex flex-col gap-4 w-full">
{/* ============ HERO (Leave Management style) ============ */}
<PortalHero
    label="Time tracking overview"
  title="Time Tracker"
  description="Log your daily work, review submitted hours and manage weekly timesheets — all from one place."
  chips={[
  { icon: FaClipboardList, value: timeLogs.length, label: " Time logs" },
  { icon: FaHourglassHalf, value: totalAllHours.toFixed(1), label: " Hours logged" },
  { pulse: true, value: totalHours.toFixed(1), label: ` Hours on ${shortDateLabel}` },
  ]}
  />

 {/* ============ TAB BAR ============ */}
 <PortalTabBar
 tabs={tabs}
 activeKey={activeTab}
 onChange={setActiveTab}
 idPrefix="tt-tab"
 panelId="timetracker-tabpanel"
 ariaLabel="Time tracker sections"
 layoutId="tt-tab-pill"
 right={
 <>
 <span className="hidden xl:block text-[10px] font-black uppercase tracking-widest text-muted">
 {activeTab === 0 ? shortDateLabel : "Weekly timesheets"}
 </span>
 <GlassButton
 variant="primary"
 size="sm"
 icon={FaPlus}
 onClick={() => {
 if (activeTab === 0) {
 setModalMode("add");
 setIsAddTimeLogModalOpen(true);
 } else {
 setIsCreateTimesheetModalOpen(true);
 }
 }}
 >
 {activeTab === 0 ? "Time Log" : "Timesheet"}
 </GlassButton>
 </>
 }
 />

 {/* Tab content — remount on change so it fades in fresh */}
 <motion.div
 key={activeTab}
 id="timetracker-tabpanel"
 role="tabpanel"
 aria-labelledby={`tt-tab-${activeTab}`}
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.45, delay: 0.14, ease: EASE }}
 className="flex flex-col gap-4"
 >
 {activeTab === 0 &&
 (error ? (
 /* ============ ERROR STATE ============ */
 <div className="glass-card text-center py-14">
 <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-danger-bg border border-danger-border flex items-center justify-center">
 <FaExclamationTriangle size={22} className="text-danger" />
 </div>
 <p className="text-sm font-bold text-heading">Failed to load time logs</p>
 <p className="text-xs text-muted mt-1 mb-5">{error}</p>
 <GlassButton variant="primary" onClick={fetchTimeLogs}>
 RETRY
 </GlassButton>
 </div>
 ) : (
 <>
 {/* ============ KPI CARDS ============ */}
 <div className="lm-stagger grid grid-cols-2 xl:grid-cols-4 gap-4">
 <StatCard
 title="Logs This Day"
 value={filteredData.length}
 sub={formatDate(selectedDate)}
 icon={FaClipboardList}
 tone="text-main"
 iconBg="bg-app"
 />
 <StatCard
 title="Submitted Hours"
 value={totalHours.toFixed(1)}
 sub="Logged on the selected day"
 icon={FaHourglassHalf}
 tone="text-amber-600 dark:text-amber-400"
 iconBg="bg-amber-100 dark:bg-amber-900/40"
 />
 <StatCard
 title="Avg Hours / Log"
 value={avgHours.toFixed(1)}
 sub="Average per time log"
 icon={FaChartLine}
 tone="text-sky-600 dark:text-sky-400"
 iconBg="bg-sky-100 dark:bg-sky-900/40"
 />
 <StatCard
 title="Total Hours"
 value={totalAllHours.toFixed(1)}
 sub={`${timeLogs.length} logs all time`}
 icon={FaClock}
 tone="text-emerald-600 dark:text-emerald-400"
 iconBg="bg-emerald-100 dark:bg-emerald-900/40"
 />
 </div>

 {/* ============ FILTERS ============ */}
 <FilterPanel
 title="Daily Time Logs"
 subtitle={`${filteredData.length} of ${timeLogs.length} entries · ${formatDate(selectedDate)}`}
 hint="Step through days with the arrows — future dates are locked. Click any row to view its details."
 >
 <FilterRow>
 <button
 onClick={navigateToPreviousDay}
 className="w-[42px] h-[42px] flex items-center justify-center rounded-xl border border-border-subtle bg-surface text-muted hover:text-heading hover:border-border-accent hover:bg-card-hover transition-all shadow-sm group"
 title="Previous day"
 >
 <FaChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
 </button>

<div className="relative flex-1 sm:flex-none min-w-[170px]" ref={calendarRef}>
  <button
  onClick={() => setShowCalendar(!showCalendar)}
  className="w-full h-[42px] px-4 flex items-center gap-2 bg-surface border border-border-subtle text-main rounded-xl font-semibold text-xs hover:border-border-accent transition-all min-w-[170px] justify-center shadow-sm"
  >
  <span className="cal-chip" aria-hidden="true">
   <FaRegCalendarAlt size={14} />
   </span>
  <span className="truncate">{formatDate(selectedDate)}</span>
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
 selected={selectedDate}
 onChange={(date) => {
 setSelectedDate(date);
 setShowCalendar(false);
 }}
 maxDate={new Date()} // Block future dates
 inline
 />
 </motion.div>
 )}
 </AnimatePresence>
 </div>

 <button
 onClick={navigateToNextDay}
 disabled={selectedDate >= new Date().setHours(0, 0, 0, 0)} // Disable if today
 className={`w-[42px] h-[42px] flex items-center justify-center rounded-xl border border-border-subtle transition-all shadow-sm group ${
 selectedDate >= new Date().setHours(0, 0, 0, 0)
 ? "bg-surface/50 text-muted/50 cursor-not-allowed"
 : "bg-surface text-muted hover:text-heading hover:border-border-accent hover:bg-card-hover"
 }`}
 title="Next day"
 >
 <FaChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
 </button>
 </FilterRow>
 </FilterPanel>

 {/* ============ TABLE ============ */}
 <GlobalTable
 columns={timeLogColumns}
 data={filteredData}
 loading={loading}
 emptyMessage={
 selectedDate
 ? `No time logs found for ${formatDate(selectedDate)}`
 : "No time logs found. Try selecting a different date or add a new time log."
 }
 onRowClick={handleViewLog}
 actions={timeLogActions}
 rowsPerPage={5}
 defaultSort={{ key: "date", direction: "desc" }}
 countLabel="time logs"
 />

 <div className="flex justify-center sm:justify-end">
 <GlassButton variant="secondary" icon={FaFileInvoice} onClick={() => setIsCreateTimesheetModalOpen(true)}>
 Create Timesheet for this date
 </GlassButton>
 </div>
 </>
 ))}

 {activeTab === 1 && <Timesheet refreshTrigger={refreshTimesheetTrigger} />}
 </motion.div>
 </div>
 </PageContainer>

 <AddTimeLogModal
 isOpen={modalMode === "add" && isAddTimeLogModalOpen}
 onClose={() => setIsAddTimeLogModalOpen(false)}
 onSave={handleSaveLogs}
 onTimeLogAdded={fetchTimeLogs}
 />

 {/* Pass selectedDate so the modal knows for which date to create the timesheet */}
 <CreateTimesheetModal
 open={isCreateTimesheetModalOpen}
 onClose={() => setIsCreateTimesheetModalOpen(false)}
 onTimesheetCreated={handleTimesheetCreated}
 selectedDate={selectedDate}
 />

 <EditTimeLogModal
 isOpen={modalMode === "edit" && isAddTimeLogModalOpen}
 onClose={() => {
 setIsAddTimeLogModalOpen(false);
 setEditingLogId(null);
 }}
 onTimeLogUpdated={fetchTimeLogs}
 timeLogId={editingLogId}
 initialData={timeLogs.find(log => log._id === editingLogId)}
 />

 {viewingLog && (
 <ViewTimeLogModal
 key={viewingLog._id}
 log={viewingLog}
 onClose={() => setViewingLog(null)}
 />
 )}
 </>
 );
};

export default TimeTracker;