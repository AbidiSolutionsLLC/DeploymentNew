import React, { useState, useEffect, useRef } from "react";
import timesheetApi from "../../api/timesheetApi";
import timeLogApi from "../../api/timeLogApi";
import { toast } from "react-toastify";
import { moment, TIMEZONE } from "../../utils/dateUtils"; // Use project's moment util

export default function CreateTimesheetModal({ open, onClose, onTimesheetCreated }) {
  const [timesheetName, setTimesheetName] = useState("");
  const [selectedDate, setSelectedDate] = useState(""); 
  const [description, setDescription] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingLogs, setFetchingLogs] = useState(false);
  const modalRef = useRef(null);

  // Get today's date in YYYY-MM-DD format based on EST
  const getTodayString = () => {
    return moment().tz(TIMEZONE).format('YYYY-MM-DD');
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${month}-${day}-${year}`;
  };

  useEffect(() => {
    if (open) {
      const todayStr = getTodayString();
      setSelectedDate(todayStr);
      setDescription("");
      setAttachment(null);
      setLogs([]);
    }
  }, [open]);

  useEffect(() => {
    if (selectedDate) {
      setTimesheetName(`Timesheet (${formatDisplayDate(selectedDate)})`);
      fetchLogsForDate(selectedDate);
    }
  }, [selectedDate, open]);

  const fetchLogsForDate = async (dateStr) => {
    try {
      setFetchingLogs(true);
      const response = await timeLogApi.getEmployeeTimeLogs(dateStr);
      // Filter logs not already in a timesheet
      const availableLogs = response.filter(log => !log.isAddedToTimesheet);
      setLogs(availableLogs);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load time logs");
    } finally {
      setFetchingLogs(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
  };

  const isValid = timesheetName.trim().length >= 3 &&
    description.trim().length >= 5 &&
    logs.length > 0 &&
    selectedDate;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    try {
      // 1. Check for existing timesheet for this EST date
      const weekStartStr = moment.tz(selectedDate, TIMEZONE).startOf('isoWeek').format('YYYY-MM-DD');
      const response = await timesheetApi.getWeeklyTimesheets(weekStartStr);

      const existingForDate = response.timesheets.find(ts => {
        const tsDateStr = moment(ts.date).tz(TIMEZONE).format('YYYY-MM-DD');
        return tsDateStr === selectedDate;
      });

      if (existingForDate) {
        toast.error(`A timesheet already exists for ${formatDisplayDate(selectedDate)}`);
        setLoading(false);
        return;
      }

      // 2. Submit new timesheet
      const formData = new FormData();
      formData.append('name', timesheetName);
      formData.append('description', description);
      formData.append('date', selectedDate); // Send raw string 'YYYY-MM-DD'

      if (attachment) formData.append('attachments', attachment);
      logs.forEach(log => formData.append('timeLogs', log._id));

      await timesheetApi.createTimesheet(formData);
      toast.success("Timesheet created successfully");
      if (onTimesheetCreated) onTimesheetCreated();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create timesheet");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex justify-center items-center p-4 sm:p-6"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative flex flex-col max-h-[90vh] animate-fadeIn overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-red-500 transition-all text-2xl font-light z-10"
        >
          &times;
        </button>

        <div className="px-6 py-6 sm:px-10 sm:py-8 border-b border-slate-50 text-center flex-shrink-0">
          <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-widest uppercase">
            CREATE TIMESHEET
          </h2>
        </div>

        <form
          className="p-6 sm:p-10 space-y-5 sm:space-y-6 overflow-y-auto custom-scrollbar"
          onSubmit={handleSubmit}
        >
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              TIMESHEET DATE*
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={getTodayString()}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">
              AVAILABLE LOGS FOR {selectedDate ? formatDisplayDate(selectedDate) : '...'}
            </label>
            {fetchingLogs ? (
              <div className="text-center p-4 text-xs font-bold text-slate-400 animate-pulse">
                LOADING LOGS...
              </div>
            ) : logs.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                No logs available for this date.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {logs.map((log) => (
                  <div key={log._id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-black text-slate-700 uppercase tracking-tighter">
                        {log.job || log.jobTitle}
                      </span>
                      <span className="font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                        {log.hours} HRS
                      </span>
                    </div>
                    <p className="text-slate-400 line-clamp-1">{log.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              TIMESHEET NAME
            </label>
            <input
              type="text"
              value={timesheetName}
              onChange={(e) => setTimesheetName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              SUMMARY DESCRIPTION*
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 min-h-[100px]"
              placeholder="Describe your work..."
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              ATTACHMENT
            </label>
            <div className="relative group">
              <input
                type="file"
                onChange={(e) => setAttachment(e.target.files[0])}
                className="w-full opacity-0 absolute inset-0 cursor-pointer z-10"
              />
              <div className="w-full bg-white border border-slate-200 border-dashed rounded-xl px-4 py-3 text-sm text-slate-400 flex items-center justify-between group-hover:bg-slate-50 transition-all">
                <span className="truncate">{attachment ? attachment.name : "Choose a file..."}</span>
                <span className="text-[10px] font-black text-slate-300">UPLOAD</span>
              </div>
            </div>
          </div>
        </form>

        <div className="px-6 py-6 sm:px-10 sm:py-8 border-t border-slate-100 flex gap-3 sm:gap-4 bg-white flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">
            CANCEL
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || loading || fetchingLogs}
            className="flex-[2] py-4 bg-[#64748b] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg disabled:opacity-50"
          >
            {loading ? "CREATING..." : "CREATE TIMESHEET"}
          </button>
        </div>
      </div>
    </div>
  );
}
