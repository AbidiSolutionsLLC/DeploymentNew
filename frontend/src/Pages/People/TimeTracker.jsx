import React, { useState, useEffect, useRef } from "react";
import SubNavbar from "../../Components/PeopleSubNavbar";
import AddTimeLogModal from "../People/AddTimeLogModal";
import {
  IoCalendarNumberOutline,
  IoEye,
  IoPencil,
  IoTrash,
} from "react-icons/io5";
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa';
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
import TableWithPagination from "../../Components/TableWithPagination";
import { IoDownloadOutline } from "react-icons/io5";

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
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({ show: false, logId: null });

  const tabs = [
    { title: "Time Logs" },
    { title: "Timesheets" },
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

  const handleTimesheetCreated = async () => {
    if (activeTab === 1) {
      setRefreshTimesheetTrigger(prev => prev + 1);
    }
    setIsCreateTimesheetModalOpen(false);
  };


  // Helper to safely parse backend date without timezone shift
  const getBackendDateParts = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return {
      day: date.getUTCDate(),
      month: date.getUTCMonth(),
      year: date.getUTCFullYear()
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

  const totalHours = filteredData.reduce((sum, log) => sum + (log.hours || 0), 0);

  useEffect(() => {
    // Current page is managed internally by TableWithPagination
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
    setDeleteConfirmDialog({ show: true, logId: id });
  };

  const handleConfirmDelete = async () => {
    const id = deleteConfirmDialog.logId;
    if (!id) return;

    try {
      await timeLogApi.deleteTimeLog(id);
      fetchTimeLogs();
      toast.success("Time log deleted successfully");
    } catch (error) {
      console.error("Failed to delete time log:", error);
      toast.error(error.response?.data?.message || "Failed to delete time log");
    } finally {
      setDeleteConfirmDialog({ show: false, logId: null });
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmDialog({ show: false, logId: null });
  };

  const handleViewLog = (log) => {
    setViewingLog({
      ...log,
      jobTitle: log.job,
      totalHours: log.hours,
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

  // Display backend date correctly (using UTC)
  const formatBackendDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      timeZone: 'UTC',
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
      key: "job",
      label: "Job Title",
      sortable: true,
      render: (row) => (
        <span className="font-medium text-slate-700">{row.job || "-"}</span>
      )
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (row) => (
        <span className="text-slate-600">{formatBackendDate(row.date)}</span>
      )
    },
    {
      key: "description",
      label: "Description",
      sortable: false,
      render: (row) => (
        <div className="max-w-xs truncate text-slate-600">{row.description}</div>
      )
    },
    {
      key: "hours",
      label: "Hours",
      sortable: true,
      render: (row) => (
        <span className="font-medium text-slate-700">{row.hours}</span>
      )
    }
  ];

  // Define actions for Time Logs
  const timeLogActions = [
    {
      icon: <IoEye size={16} />,
      title: "View",
      className: "bg-blue-50 text-blue-600 hover:bg-blue-100",
      onClick: (row) => handleViewLog(row)
    },
    {
      icon: <IoPencil size={16} />,
      title: "Edit",
      className: "bg-green-50 text-green-600 hover:bg-green-100",
      onClick: (row) => {
        setEditingLogId(row._id);
        setModalMode("edit");
        setIsAddTimeLogModalOpen(true);
      }
    },
    {
      icon: <IoTrash size={16} />,
      title: "Delete",
      className: "bg-red-50 text-red-600 hover:bg-red-100",
      onClick: (row) => handleDeleteClick(row._id)
    }
  ];

  // Table rendering is handled below in the return

  return (
    <>
      <div className="min-h-screen bg-transparent p-2">
        {/* Tab Bar & Action Button Container */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
          <div className="inline-flex flex-row flex-wrap items-center justify-center bg-white/90 backdrop-blur-sm p-1.5 rounded-[1.2rem] shadow-sm border border-white/50">
            {tabs.map((item, index) => (
              <div key={item.title} className="flex items-center">
                <button
                  className={`px-5 py-2.5 text-sm font-medium transition-all duration-200 rounded-xl
                  ${activeTab === index
                      ? "text-slate-800 bg-white shadow-sm font-bold"
                      : "text-slate-600 hover:text-slate-800 hover:bg-slate-50/80"
                    }`}
                  onClick={() => setActiveTab(index)}
                >
                  {item.title}
                </button>
                {index !== tabs.length - 1 && (
                  <span className="w-px h-5 bg-slate-200 mx-1.5"></span>
                )}
              </div>
            ))}
          </div>

          {/* Dynamic Action Button */}
          <button
            onClick={() => {
              if (activeTab === 0) {
                setModalMode("add");
                setIsAddTimeLogModalOpen(true);
              } else {
                setIsCreateTimesheetModalOpen(true);
              }
            }}
            className="w-full sm:w-auto px-6 py-3 bg-[#64748b] text-white rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest shadow-lg shadow-slate-100 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {activeTab === 0 ? "Add Time Log" : "Create Timesheet"}
          </button>
        </div>

        {activeTab === 0 && (
          <>
            {/* Header Card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 mb-4 p-2 relative z-20">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">Time Logs</h2>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={navigateToPreviousDay}
                    className="p-2.5 rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200 transition shadow-sm"
                  >
                    <FaAngleLeft size={18} />
                  </button>

                  <div className="relative" ref={calendarRef}>
                    <button
                      className="px-3 py-2 text-blue-800 bg-blue-100 rounded-lg flex items-center gap-2 hover:bg-blue-200 transition shadow-sm text-sm font-medium"
                      onClick={() => setShowCalendar(!showCalendar)}
                    >
                      <IoCalendarNumberOutline size={18} />
                      {selectedDate && (
                        <span className="text-sm font-medium">{formatDate(selectedDate)}</span>
                      )}
                    </button>

                    <AnimatePresence>
                      {showCalendar && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-50 mt-2    rounded-xl"
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
                    className={`p-2.5 rounded-lg transition shadow-sm ${selectedDate >= new Date().setHours(0, 0, 0, 0) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
                  >
                    <FaAngleRight size={18} />
                  </button>
                </div>
                <div className="bg-blue-50 px-3 py-2 rounded-lg shadow-sm">
                  <span className="text-xs font-medium text-slate-800 uppercase tracking-wide">
                    Submitted Hours: <span className="font-bold text-slate-800">{totalHours.toFixed(2)}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center p-6 bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
                <p className="mt-3 text-slate-600 text-xs font-medium uppercase tracking-wide">Loading time logs...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-[1.2rem] p-4 text-center text-red-700 text-sm mb-4">
                {error}
              </div>
            )}

            {!loading && !error && (
              <div className="space-y-6">
                <TableWithPagination
                  columns={timeLogColumns}
                  data={filteredData}
                  loading={loading}
                  error={error}
                  emptyMessage={selectedDate
                    ? `No time logs found for ${formatDate(selectedDate)}`
                    : "No time logs found. Try selecting a different date or add a new time log."}
                  onRowClick={handleViewLog}
                  actions={timeLogActions}
                  rowsPerPage={5}
                />
                
                <div className="flex justify-center sm:justify-end pb-8">
                  <button
                    onClick={() => setIsCreateTimesheetModalOpen(true)}
                    className="group relative flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-[1.5rem] font-bold text-xs uppercase tracking-[0.15em] shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-300/60 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <svg className="w-5 h-5 text-blue-300 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Create Timesheet for this date</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        {activeTab === 1 && <Timesheet refreshTrigger={refreshTimesheetTrigger} />}
      </div>

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

      {/* Delete Confirmation Dialog */}
      {deleteConfirmDialog.show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 animate-fadeIn">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-wider mb-2">
                Delete Time Log
              </h3>
              <p className="text-xs text-slate-500 font-medium mb-6">
                Are you sure you want to delete this time log? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelDelete}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-100"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TimeTracker;