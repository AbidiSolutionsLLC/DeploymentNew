import React, { useState, useEffect, useRef } from "react";
import timesheetApi from "../../api/timesheetApi";
import timeLogApi from "../../api/timeLogApi";
import { toast } from "react-toastify";

export default function CreateTimesheetModal({ open, onClose, onTimesheetCreated }) {
  const [timesheetName, setTimesheetName] = useState("");
  const [selectedDate, setSelectedDate] = useState(""); // Date for the timesheet
  const [description, setDescription] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingLogs, setFetchingLogs] = useState(false);
  const modalRef = useRef(null);

  // Get today's date for default
  const getTodayString = () => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  };

  // Format date for display
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
      // Timesheet name will be updated in the other useEffect
    }
  }, [open]);

  // Update timesheet name when date changes
  useEffect(() => {
    if (selectedDate) {
      setTimesheetName(`Timesheet (${formatDisplayDate(selectedDate)})`);
      fetchLogsForDate(selectedDate);
    }
  }, [selectedDate, open]);

  const fetchLogsForDate = async (dateStr) => {
    try {
      setFetchingLogs(true);
      // Pass the selected specific date to the API
      const response = await timeLogApi.getEmployeeTimeLogs(dateStr);
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
      const formData = new FormData();
      formData.append('name', timesheetName);
      formData.append('description', description);
      
      // FIX: Send the date string exactly as YYYY-MM-DD 
      // Do not convert it to a Date object here
      formData.append('date', selectedDate); 

      if (attachment) formData.append('attachments', attachment);
      logs.forEach(log => formData.append('timeLogs', log._id));

      await timesheetApi.createTimesheet(formData);
      if (onTimesheetCreated) onTimesheetCreated();
      onClose();
    } catch (error) {
      // The toast will now show the correct error from the backend
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
        {/* Close Cross */}
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
          {/* Date Selection for Timesheet */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              TIMESHEET DATE*
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={getTodayString()} // Can't create timesheets for future dates
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 font-medium"
              required
            />
            <p className="text-xs text-slate-400 mt-1">
              Select the date this timesheet is for (you can submit for past dates)
            </p>
          </div>

          {/* Logs Section */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-3 uppercase tracking-widest">
              AVAILABLE TIME LOGS FOR {selectedDate ? formatDisplayDate(selectedDate) : '...'}
            </label>
            {fetchingLogs ? (
              <div className="text-center p-4 text-xs font-bold text-slate-400 animate-pulse">
                LOADING LOGS...
              </div>
            ) : logs.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                No time logs available for this date. Create time logs first.
              </div>
            ) : (
              <>
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
                <p className="text-xs text-slate-500 mt-2">
                  Total: {logs.reduce((sum, log) => sum + log.hours, 0).toFixed(1)} hours
                </p>
              </>
            )}
          </div>

          {/* Timesheet Name (Auto-generated) */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              TIMESHEET NAME
            </label>
            <input
              type="text"
              value={timesheetName}
              onChange={(e) => setTimesheetName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 font-medium"
              placeholder="Timesheet name"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              SUMMARY DESCRIPTION*
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all placeholder:text-slate-300 min-h-[100px]"
              placeholder="Describe your work for this day..."
              required
            />
          </div>

          {/* Attachment */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              ATTACHMENT (Optional)
            </label>
            <div className="relative group">
              <input
                type="file"
                onChange={(e) => setAttachment(e.target.files[0])}
                className="w-full opacity-0 absolute inset-0 cursor-pointer z-10"
              />
              <div className="w-full bg-white border border-slate-200 border-dashed rounded-xl px-4 py-3 text-sm text-slate-400 flex items-center justify-between group-hover:bg-slate-50 transition-all">
                <span className="truncate">
                  {attachment ? attachment.name : "Choose a file..."}
                </span>
                <span className="text-[10px] font-black text-slate-300">UPLOAD</span>
              </div>
            </div>
          </div>
        </form>

        <div className="px-6 py-6 sm:px-10 sm:py-8 border-t border-slate-100 flex gap-3 sm:gap-4 bg-white flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 sm:py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || loading || fetchingLogs}
            className="flex-[2] py-3 sm:py-4 bg-[#64748b] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-100 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "CREATING..." : "CREATE TIMESHEET"}
          </button>
        </div>
      </div>
    </div>
  );
}
