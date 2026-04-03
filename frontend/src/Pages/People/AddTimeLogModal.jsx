import React, { useState, useRef, useEffect } from "react";
import timeLogApi from "../../api/timeLogApi";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  validateDescription,
  validateText,
  validateNumeric,
  sanitizeText,
  getApiError,
} from "../../utils/validationUtils";

const AddTimeLogModal = ({ isOpen, onClose, onTimeLogAdded }) => {
  const [jobTitle, setJobTitle] = useState("");
  const [date, setDate] = useState(null);
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const modalRef = useRef(null);

  const resetForm = () => {
    setJobTitle("");
    setDate(null);
    setHours("");
    setDescription("");
    setAttachment(null);
    setLogs([]);
    setErrors({});
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Helper: Format Date to YYYY-MM-DD for API
  const formatDateForApi = (d) => {
    if (!d) return "";
    const offset = d.getTimezoneOffset();
    const adjustedDate = new Date(d.getTime() - offset * 60 * 1000);
    return adjustedDate.toISOString().split("T")[0];
  };

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  // Validate a single field, returns error string or null
  const validateField = (name, value) => {
    switch (name) {
      case "jobTitle":
        return validateText(value);
      case "date":
        return value ? null : "Please select a valid date.";
      case "hours": {
        if (!value && value !== 0) return "Hours worked is required.";
        const num = parseFloat(value);
        if (isNaN(num) || num < 0.5) return "Hours must be at least 0.5.";
        if (num > 24) return "Hours cannot exceed 24.";
        return null;
      }
      case "description":
        return validateDescription(value, { min: 10, max: 300, required: true });
      default:
        return null;
    }
  };

  const validateAll = () => {
    const newErrors = {
      jobTitle: validateField("jobTitle", jobTitle),
      date: validateField("date", date),
      hours: validateField("hours", hours),
      description: validateField("description", description),
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const isCurrentInputValid =
    !validateField("jobTitle", jobTitle) &&
    !validateField("date", date) &&
    !validateField("hours", hours) &&
    !validateField("description", description);

  const handleAddAnother = () => {
    if (!validateAll()) return;
    const newLog = {
      jobTitle: sanitizeText(jobTitle),
      date: formatDateForApi(date),
      hours: parseFloat(hours),
      description: sanitizeText(description),
      attachmentName: attachment ? attachment.name : null,
      attachmentFile: attachment,
    };
    setLogs([...logs, newLog]);
    setJobTitle("");
    setDate(null);
    setHours("");
    setDescription("");
    setAttachment(null);
    setErrors({});
  };

  const handleSave = async () => {
    if (!validateAll() && logs.length === 0) return;

    setIsLoading(true);
    try {
      const logsToSubmit =
        logs.length > 0
          ? logs
          : [
              {
                jobTitle: sanitizeText(jobTitle),
                date: formatDateForApi(date),
                hours: parseFloat(hours),
                description: sanitizeText(description),
                attachmentFile: attachment,
              },
            ];

      for (const log of logsToSubmit) {
        const formData = new FormData();
        formData.append("job", log.jobTitle);
        formData.append("date", log.date);
        formData.append("hours", log.hours);
        formData.append("description", log.description);
        if (log.attachmentFile) {
          formData.append("attachments", log.attachmentFile);
        }
        await timeLogApi.createTimeLog(formData);
      }

      setLogs([]);
      toast.success("TIME LOG(S) SAVED");
      onTimeLogAdded();
      onClose();
    } catch (error) {
      toast.error(getApiError(error, "FAILED TO SAVE"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex justify-center items-center p-4 sm:p-6"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative flex flex-col max-h-[90vh] animate-fadeIn overflow-hidden"
      >
        {/* CLOSE CROSS */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-red-500 transition-all text-2xl font-light z-10"
        >
          &times;
        </button>

        {/* HEADER */}
        <div className="px-6 py-6 sm:px-10 sm:py-8 border-b border-slate-50 text-center flex-shrink-0">
          <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-widest uppercase">
            ADD TIME LOG
          </h2>
        </div>

        {/* FORM BODY */}
        <div className="p-6 sm:p-10 space-y-5 sm:space-y-6 overflow-y-auto custom-scrollbar">

          {/* JOB TITLE INPUT */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              LOG TITLE*
            </label>
            <input
              type="text"
              placeholder="e.g. Frontend Development"
              value={jobTitle}
              onChange={(e) => {
                setJobTitle(e.target.value);
                setErrors((prev) => ({ ...prev, jobTitle: validateField("jobTitle", e.target.value) }));
              }}
              onBlur={() => setErrors((prev) => ({ ...prev, jobTitle: validateField("jobTitle", jobTitle) }))}
              className={`w-full bg-white border ${errors.jobTitle ? "border-red-400" : "border-slate-200"} rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300 transition-all`}
            />
            {errors.jobTitle && (
              <p className="text-xs text-red-500 mt-1">{errors.jobTitle}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* DATE */}
            <div className="relative">
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                DATE*
              </label>
              <DatePicker
                selected={date}
                onChange={(d) => {
                  setDate(d);
                  setErrors((prev) => ({ ...prev, date: d ? null : "Please select a valid date." }));
                }}
                maxDate={new Date()}
                dateFormat="yyyy-MM-dd"
                placeholderText="Select Date"
                className={`w-full bg-white border ${errors.date ? "border-red-400" : "border-slate-200"} rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer`}
                popperProps={{ strategy: "fixed" }}
              />
              {errors.date && (
                <p className="text-xs text-red-500 mt-1">{errors.date}</p>
              )}
            </div>

            {/* HOURS */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                HOURS*
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                placeholder="0.0"
                value={hours}
                onChange={(e) => {
                  setHours(e.target.value);
                  setErrors((prev) => ({ ...prev, hours: validateField("hours", e.target.value) }));
                }}
                onBlur={() => setErrors((prev) => ({ ...prev, hours: validateField("hours", hours) }))}
                className={`w-full bg-white border ${errors.hours ? "border-red-400" : "border-slate-200"} rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300`}
              />
              {errors.hours && (
                <p className="text-xs text-red-500 mt-1">{errors.hours}</p>
              )}
            </div>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              DESCRIPTION* <span className="normal-case font-normal text-slate-300">(min 10, max 300 chars)</span>
            </label>
            <textarea
              placeholder="describe your work in detail..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setErrors((prev) => ({
                  ...prev,
                  description: validateDescription(e.target.value, { min: 10, max: 300, required: true }),
                }));
              }}
              onBlur={() =>
                setErrors((prev) => ({
                  ...prev,
                  description: validateDescription(description, { min: 10, max: 300, required: true }),
                }))
              }
              className={`w-full bg-white border ${errors.description ? "border-red-400" : "border-slate-200"} rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-300 resize-none`}
              rows={3}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.description ? (
                <p className="text-xs text-red-500">{errors.description}</p>
              ) : (
                <span />
              )}
              <p className="text-xs text-slate-400 text-right">{description.length}/300</p>
            </div>
          </div>

          {/* ATTACHMENT */}
          <div className="flex flex-col gap-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
              ATTACHMENT
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                    {attachment ? attachment.name : "click to upload file"}
                  </p>
                </div>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,image/png,image/jpeg,image/jpg"
                  className="hidden"
                  onChange={(e) => setAttachment(e.target.files[0])}
                />
              </label>
            </div>
          </div>

          {/* PREVIEW OF QUEUED LOGS */}
          {logs.length > 0 && (
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-blue-500 uppercase tracking-widest">
                QUEUED LOGS ({logs.length})
              </label>
              <div className="space-y-2">
                {logs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-[11px] font-medium text-blue-700 flex justify-between items-center"
                  >
                    <span>
                      {log.jobTitle} • {log.hours}h
                    </span>
                    <span className="text-blue-300 uppercase">{log.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-6 sm:px-10 sm:py-8 border-t border-slate-100 flex flex-col sm:flex-row gap-3 bg-white flex-shrink-0">
          <button
            type="button"
            onClick={handleAddAnother}
            disabled={!isCurrentInputValid}
            className="flex-1 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            + Add Another
          </button>

          <div className="flex gap-3 flex-[2]">
            <button
              onClick={onClose}
              className="flex-1 py-3 font-black text-[10px] text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
            >
              CANCEL
            </button>
            <button
              onClick={handleSave}
              disabled={(!isCurrentInputValid && logs.length === 0) || isLoading}
              className="flex-[2] py-3 bg-[#64748b] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-100 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
            >
              {isLoading
                ? "SAVING..."
                : logs.length > 0
                ? `SAVE ALL (${logs.length + (isCurrentInputValid ? 1 : 0)})`
                : "SAVE LOG"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTimeLogModal;