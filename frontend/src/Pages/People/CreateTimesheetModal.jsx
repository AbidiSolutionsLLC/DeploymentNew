import React, { useState, useEffect, useRef } from "react";
import timesheetApi from "../../api/timesheetApi";
import timeLogApi from "../../api/timeLogApi";
import { toast } from "react-toastify";
import { moment, TIMEZONE } from "../../utils/dateUtils"; // Use project's moment util
import DatePicker from "react-datepicker";
import { validateDescription, sanitizeText, getApiError } from "../../utils/validationUtils";

export default function CreateTimesheetModal({ open, onClose, onTimesheetCreated, selectedDate: propSelectedDate }) {
  const [timesheetName, setTimesheetName] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingLogs, setFetchingLogs] = useState(false);
  const [descriptionError, setDescriptionError] = useState(null);
  const [attachmentError, setAttachmentError] = useState(null);
  const [nameError, setNameError] = useState(null);
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);
  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB limit
  const MAX_FILES = 5;

  // Validate timesheet name
  const validateName = (value) => {
    const sanitized = value?.trim() || '';
    
    if (!sanitized) {
      return "Timesheet Name is required.";
    }
    
    if (sanitized.length < 3) {
      return "Timesheet name must be at least 3 characters.";
    }
    
    if (sanitized.length > 150) {
      return "Timesheet name cannot exceed 150 characters.";
    }

    // Check for special characters (only allow letters, numbers, spaces, hyphens, apostrophes, commas, periods, ampersands)
    const allowedRegex = /^[a-zA-Z0-9\s\-'.,&()]+$/;
    if (!allowedRegex.test(sanitized)) {
      return "Timesheet name contains invalid characters.";
    }

    // Check for numbers-only input
    if (/^\d+$/.test(sanitized)) {
      return "Numbers-only names are not allowed.";
    }

    return null;
  };

  // Get today's date in YYYY-MM-DD format based on EST
  const getTodayString = () => {
    return moment().tz(TIMEZONE).format('YYYY-MM-DD');
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    // If it's already a Date object, format it using moment
    if (dateStr instanceof Date) {
      return moment(dateStr).format('MM-DD-YYYY');
    }
    // If it's a string in YYYY-MM-DD format
    if (typeof dateStr === 'string' && dateStr.includes("-")) {
      const [year, month, day] = dateStr.split("-");
      return `${month}-${day}-${year}`;
    }
    return moment(dateStr).format('MM-DD-YYYY');
  };

  useEffect(() => {
    if (open) {
      let initialDate = getTodayString();

      // If a selectedDate was passed from parent (like a Date object or string)
      if (propSelectedDate) {
        // Ensure it's in YYYY-MM-DD format for the input[type=date]
        initialDate = moment(propSelectedDate).format('YYYY-MM-DD');
      }

      setSelectedDate(initialDate);
      setDescription("");
      setAttachments([]);
      setLogs([]);
      setDescriptionError(null);
      setAttachmentError(null);
    }
  }, [open, propSelectedDate]);

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

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const duplicates = [];
    const oversized = [];

    // Check each file
    for (const file of files) {
      // Check for duplicates
      const isDuplicate = attachments.some(
        existing => existing.name === file.name && existing.size === file.size
      );
      if (isDuplicate) {
        duplicates.push(file.name);
        continue;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        oversized.push(file.name);
        continue;
      }

      validFiles.push(file);
    }

    // Check total file count
    if (attachments.length + validFiles.length > MAX_FILES) {
      setAttachmentError(`Maximum ${MAX_FILES} files allowed. You can add ${MAX_FILES - attachments.length} more file(s).`);
      return;
    }

    // Show errors
    if (duplicates.length > 0) {
      setAttachmentError(`File(s) already attached: ${duplicates.join(", ")}`);
    } else if (oversized.length > 0) {
      const limitMB = MAX_FILE_SIZE / (1024 * 1024);
      setAttachmentError(`File size exceeds ${limitMB} MB limit: ${oversized.join(", ")}`);
    } else {
      setAttachmentError(null);
    }

    // Add valid files to attachments
    if (validFiles.length > 0) {
      setAttachments(prev => [...prev, ...validFiles]);
    }

    // Clear the file input
    e.target.value = null;
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
    setAttachmentError(null);
    
    // Clear the file input to allow re-selecting the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const descValidation = validateDescription(description, { min: 10, max: 500, required: true });
  const nameValidation = validateName(timesheetName);

  const isValid = !nameValidation &&
    !descValidation &&
    logs.length > 0 &&
    selectedDate;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nameErr = validateName(timesheetName);
    const descErr = validateDescription(description, { min: 10, max: 500, required: true });

    // Show all validation errors simultaneously
    if (nameErr) setNameError(nameErr);
    if (descErr) setDescriptionError(descErr);
    
    if (!selectedDate) {
      toast.error("Please select a timesheet date");
      return;
    }

    if (logs.length === 0) {
      toast.error("No time logs available for this date. Cannot create timesheet.");
      return;
    }

    // Prevent API call if validation fails
    if (nameErr || descErr) {
      toast.error("Please fix validation errors");
      return;
    }

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

      if (attachments.length > 0) {
        attachments.forEach(file => {
          formData.append('attachments', file);
        });
      }
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
            <DatePicker
  selected={selectedDate ? new Date(selectedDate) : null}
  onChange={(date) => setSelectedDate(date ? moment(date).format('YYYY-MM-DD') : "")}
  maxDate={new Date()} // replaces max={getTodayString()}
  dateFormat="yyyy-MM-dd"
  wrapperClassName="w-full"
  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 font-medium"
  placeholderText="Select date"
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
              onChange={(e) => {
                setTimesheetName(e.target.value);
                setNameError(validateName(e.target.value));
              }}
              onBlur={() => setNameError(validateName(timesheetName))}
              className={`w-full bg-white border ${nameError ? "border-red-400" : "border-slate-200"} rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 font-medium`}
              required
            />
            {nameError && (
              <p className="text-xs text-red-500 mt-1">{nameError}</p>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              SUMMARY DESCRIPTION* <span className="normal-case font-normal text-slate-300">(min 10, max 500 chars)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setDescriptionError(validateDescription(e.target.value, { min: 10, max: 500, required: true }));
              }}
              onBlur={() => setDescriptionError(validateDescription(description, { min: 10, max: 500, required: true }))}
              className={`w-full bg-white border ${descriptionError ? "border-red-400" : "border-slate-200"} rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 min-h-[100px]`}
              placeholder="Describe your work in detail (at least 3 meaningful words)..."
            />
            <div className="flex justify-between items-center mt-1">
              {descriptionError ? (
                <p className="text-xs text-red-500">{descriptionError}</p>
              ) : <span />}
              <p className="text-xs text-slate-400 text-right">{description.length}/500</p>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              ATTACHMENT {attachments.length > 0 && `(${attachments.length}/${MAX_FILES})`}
            </label>
            <div className="relative group">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,image/png,image/jpeg,image/jpg,.bmp,.mp4,.mp3"
                onChange={handleFileChange}
                className="w-full opacity-0 absolute inset-0 cursor-pointer z-10"
                disabled={attachments.length >= MAX_FILES}
              />
              <div className="w-full bg-white border border-slate-200 border-dashed rounded-xl px-4 py-3 text-sm text-slate-400 flex items-center justify-between group-hover:bg-slate-50 transition-all">
                <span className="truncate">
                  {attachments.length > 0 ? `${attachments.length} file(s) selected` : "Choose file(s)..."}
                </span>
                <span className="text-[10px] font-black text-slate-300">UPLOAD</span>
              </div>
            </div>
            {attachmentError && (
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight mt-1">{attachmentError}</p>
            )}
            
            {/* Display attached files with remove buttons */}
            {attachments.length > 0 && (
              <div className="space-y-2 mt-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-slate-700 truncate">{file.name}</span>
                      <span className="text-[9px] text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-slate-400 hover:text-red-500 transition-colors text-sm font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        <div className="px-6 py-6 sm:px-10 sm:py-8 border-t border-slate-100 flex gap-3 sm:gap-4 bg-white flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">
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
