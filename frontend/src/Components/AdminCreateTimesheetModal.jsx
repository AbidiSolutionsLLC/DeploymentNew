import React, { useState, useEffect, useRef } from "react";
import timesheetApi from "../api/timesheetApi";
import timeLogApi from "../api/timeLogApi";
import { toast } from "react-toastify";
import { moment, TIMEZONE } from "../utils/dateUtils"; 
import { X, Save } from "lucide-react";
import ModernSelect from "./ui/ModernSelect";
import ModernDatePicker from "./ui/ModernDatePicker";
import { validateDescription, sanitizeText, getApiError } from "../utils/validationUtils";

export default function AdminCreateTimesheetModal({ open, onClose, onTimesheetCreated, allUsers }) {
  const [employeeId, setEmployeeId] = useState("");
  const [timesheetName, setTimesheetName] = useState("");
  const [selectedDate, setSelectedDate] = useState(""); 
  const [description, setDescription] = useState("");
  const [descriptionError, setDescriptionError] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingLogs, setFetchingLogs] = useState(false);
  const [nameError, setNameError] = useState(null);
  const [employeeError, setEmployeeError] = useState(null);
  const modalRef = useRef(null);

  const getTodayString = () => moment().tz(TIMEZONE).format('YYYY-MM-DD');

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    if (dateStr instanceof Date) {
      return moment(dateStr).format('MM-DD-YYYY');
    }
    if (typeof dateStr === 'string' && dateStr.includes("-")) {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${month}-${day}-${year}`;
      }
    }
    return moment(dateStr).format('MM-DD-YYYY');
  };

  useEffect(() => {
    if (open) {
      setSelectedDate(getTodayString());
      setDescription("");
      setAttachment(null);
      setLogs([]);
      setEmployeeId("");
      setDescriptionError(null);
      setNameError(null);
      setEmployeeError(null);
    }
  }, [open]);

  useEffect(() => {
    if (selectedDate && employeeId) {
      setTimesheetName(`Timesheet (${formatDisplayDate(selectedDate)})`);
      fetchLogsForEmployeeDate(selectedDate, employeeId);
    } else {
      setLogs([]);
    }
  }, [selectedDate, employeeId, open]);

  const fetchLogsForEmployeeDate = async (dateStr, userId) => {
    try {
      setFetchingLogs(true);
      const response = await timeLogApi.getEmployeeTimeLogs(dateStr, userId);
      const availableLogs = response.filter(log => !log.isAddedToTimesheet);
      setLogs(availableLogs);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load time logs for this employee");
    } finally {
      setFetchingLogs(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) handleCancel();
  };

  const handleCancel = () => {
    const isDirty = employeeId || description || attachment || (timesheetName && !timesheetName.startsWith("Timesheet ("));
    if (isDirty) {
      if (window.confirm("Are you sure? Unsaved data will be lost.")) onClose();
    } else {
      onClose();
    }
  };

  const isValid = employeeId && timesheetName.trim().length >= 3 &&
    !validateDescription(description, { min: 10, max: 500, required: true }) &&
    logs.length > 0 &&
    selectedDate;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const descWords = description.trim().split(/\s+/).filter(word => word.length > 0);
    const descErr = validateDescription(description, { min: 10, max: 500, required: true }) || 
                   (descWords.length < 3 ? "Please enter a meaningful description (at least 3 words)." : null);
                   
    const nameErr = !timesheetName.trim()
      ? "Timesheet name is required."
      : timesheetName.trim().length < 3 
        ? "Timesheet name must be at least 3 characters." 
        : timesheetName.length > 50 
          ? "Maximum 50 characters allowed."
          : !/^[a-zA-Z0-9 \-_]+$/.test(timesheetName)
            ? "Only letters, numbers, spaces, hyphens, and underscores allowed."
            : null;
            
    const empErr = !employeeId ? "Please select an employee." : null;
    
    const dateErr = !selectedDate 
      ? "Please select a date." 
      : (selectedDate > getTodayString() ? "Timesheet date cannot be in the future." : null);

    setDescriptionError(descErr);
    setNameError(nameErr);
    setEmployeeError(empErr);

    if (descErr || nameErr || empErr || dateErr) {
      toast.error(dateErr || "Please fix validation errors");
      return;
    }

    if (logs.length === 0) {
      toast.error("No logs available for this date. Cannot create timesheet.");
      return;
    }

    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    setLoading(true);
    try {
      // 1. Check for existing timesheet
      const weekStartStr = moment.tz(selectedDate, TIMEZONE).startOf('isoWeek').format('YYYY-MM-DD');
      const response = await timesheetApi.getWeeklyTimesheets(weekStartStr, employeeId);

      const existingForDate = response.timesheets.find(ts => {
        const tsDateStr = moment(ts.date).tz(TIMEZONE).format('YYYY-MM-DD');
        return tsDateStr === selectedDate;
      });

      if (existingForDate) {
        toast.error(`A timesheet already exists for ${formatDisplayDate(selectedDate)} for this employee`);
        setLoading(false);
        return;
      }

      // 2. Submit new timesheet
      const formData = new FormData();
      formData.append('employeeId', employeeId);
      formData.append('name', timesheetName);
      formData.append('description', description);
      formData.append('date', selectedDate); 

      if (attachment) formData.append('attachments', attachment);
      logs.forEach(log => formData.append('timeLogs', log._id));

      await timesheetApi.createTimesheet(formData);
      toast.success("Timesheet created successfully");
      if (onTimesheetCreated) onTimesheetCreated();
      onClose();
    } catch (error) {
      toast.error(getApiError(error, "Failed to create timesheet"));
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
          onClick={handleCancel}
          className="absolute top-4 right-4 sm:top-5 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-red-500 transition-all text-2xl font-light z-10"
        >
          &times;
        </button>

        <div className="px-6 py-6 sm:px-10 sm:py-8 border-b border-slate-50 text-center flex-shrink-0">
          <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-widest uppercase">
            CREATE TIMESHEET (ADMIN)
          </h2>
        </div>

        <form className="p-6 sm:p-10 space-y-5 sm:space-y-6 overflow-y-auto custom-scrollbar" onSubmit={handleSubmit}>
          
          <div className="relative z-50">
            <ModernSelect
              label="Employee"
              name="employeeId"
              value={employeeId}
              onChange={(e) => {
                setEmployeeId(e.target.value);
                setEmployeeError(e.target.value ? null : "Please select an employee.");
              }}
              required
              placeholder="Select Employee"
              options={[
                { value: "", label: "Select Employee" },
                ...allUsers.map((u) => ({ value: u._id, label: `${u.name} (${u.email})` }))
              ]}
              className={`w-full ${employeeError ? "border-red-400" : ""}`}
            />
            {employeeError && <p className="text-xs text-red-500 mt-1">{employeeError}</p>}
          </div>

          <div className="relative z-40">
            <ModernDatePicker
              label="TIMESHEET DATE"
              name="selectedDate"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
              maxDate={new Date()}
              error={selectedDate > getTodayString() ? "Timesheet date cannot be in the future." : null}
            />
            {selectedDate > getTodayString() && <p className="text-xs text-red-500 mt-1">Timesheet date cannot be in the future.</p>}
          </div>

          <div className="relative z-30">
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              AVAILABLE LOGS
            </label>
            {fetchingLogs ? (
              <div className="text-center p-4 text-xs font-bold text-slate-400 animate-pulse">
                LOADING LOGS...
              </div>
            ) : !employeeId ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                Please select an employee...
              </div>
            ) : logs.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                No unbound logs available for this date.
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

          <div className="relative z-20">
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              TIMESHEET NAME
            </label>
            <input
              type="text"
              value={timesheetName}
              maxLength={50}
              onChange={(e) => {
                setTimesheetName(e.target.value);
                setNameError(
                  e.target.value.trim().length < 3 
                    ? "Timesheet name must be at least 3 characters." 
                    : e.target.value.length > 50 
                      ? "Maximum 50 characters allowed."
                      : !/^[a-zA-Z0-9 \-_]+$/.test(e.target.value)
                        ? "Only letters, numbers, spaces, hyphens, and underscores allowed."
                        : null
                );
              }}
              className={`w-full bg-white border ${nameError ? "border-red-400" : "border-slate-200"} rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 font-medium`}
              required
            />
            {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
          </div>

          <div className="relative z-10">
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              SUMMARY DESCRIPTION* <span className="normal-case font-normal text-slate-300">(min 10, max 500 chars)</span>
            </label>
            <textarea
              value={description}
              maxLength={500}
              onChange={(e) => {
                setDescription(e.target.value);
                const words = e.target.value.trim().split(/\s+/).filter(word => word.length > 0);
                setDescriptionError(
                  validateDescription(e.target.value, { min: 10, max: 500, required: true }) ||
                  (words.length > 0 && words.length < 3 ? "Please enter a meaningful description (at least 3 words)." : null)
                );
              }}
              onBlur={() => {
                const words = description.trim().split(/\s+/).filter(word => word.length > 0);
                setDescriptionError(
                  validateDescription(description, { min: 10, max: 500, required: true }) ||
                  (description.length > 0 && words.length < 3 ? "Please enter a meaningful description (at least 3 words)." : null)
                );
              }}
              className={`w-full bg-white border ${descriptionError ? "border-red-400" : "border-slate-200"} rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 min-h-[100px]`}
              placeholder="Describe work in detail (at least 3 meaningful words)..."
            />
            <div className="flex justify-between items-center mt-1">
              {descriptionError ? (
                <p className="text-xs text-red-500">{descriptionError}</p>
              ) : <span />}
              <p className="text-xs text-slate-400 text-right">{description.length}/500</p>
            </div>
          </div>
        </form>

        <div className="px-6 py-6 sm:px-10 sm:py-8 border-t border-slate-100 flex gap-3 sm:gap-4 bg-white flex-shrink-0">
          <button onClick={handleCancel} className="flex-1 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">
            CANCEL
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || fetchingLogs}
            className="flex-[2] py-4 bg-[#64748b] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg disabled:opacity-50"
          >
            {loading ? "CREATING..." : "CREATE TIMESHEET"}
          </button>
        </div>
      </div>
    </div>
  );
}
