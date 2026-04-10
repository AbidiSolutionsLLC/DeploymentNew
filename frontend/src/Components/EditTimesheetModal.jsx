import React, { useState, useRef, useEffect } from "react";
import timesheetApi from "../api/timesheetApi";
import { toast } from "react-toastify";
import { moment, TIMEZONE } from "../utils/dateUtils";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { validateDescription, sanitizeText, getApiError } from "../utils/validationUtils";

export default function EditTimesheetModal({ open, onClose, timesheet, onTimesheetUpdated }) {
  const [timesheetName, setTimesheetName] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
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

    const allowedRegex = /^[a-zA-Z0-9\s\-'.,&()]+$/;
    if (!allowedRegex.test(sanitized)) {
      return "Timesheet name contains invalid characters.";
    }

    if (/^\d+$/.test(sanitized)) {
      return "Numbers-only names are not allowed.";
    }

    return null;
  };

  useEffect(() => {
    if (open && timesheet) {
      setTimesheetName(timesheet.name || "");
      setSelectedDate(moment(timesheet.date).tz(TIMEZONE).format('YYYY-MM-DD'));
      setDescription(timesheet.description || "");
      setAttachments([]);
      setDescriptionError(null);
      setAttachmentError(null);
      setNameError(null);
    }
  }, [open, timesheet]);

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const duplicates = [];
    const oversized = [];

    for (const file of files) {
      const isDuplicate = attachments.some(
        existing => existing.name === file.name && existing.size === file.size
      );
      if (isDuplicate) {
        duplicates.push(file.name);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        oversized.push(file.name);
        continue;
      }

      validFiles.push(file);
    }

    if (attachments.length + validFiles.length > MAX_FILES) {
      setAttachmentError(`Maximum ${MAX_FILES} files allowed. You can add ${MAX_FILES - attachments.length} more file(s).`);
      return;
    }

    if (duplicates.length > 0) {
      setAttachmentError(`File(s) already attached: ${duplicates.join(", ")}`);
    } else if (oversized.length > 0) {
      const limitMB = MAX_FILE_SIZE / (1024 * 1024);
      setAttachmentError(`File size exceeds ${limitMB} MB limit: ${oversized.join(", ")}`);
    } else {
      setAttachmentError(null);
    }

    if (validFiles.length > 0) {
      setAttachments(prev => [...prev, ...validFiles]);
    }

    e.target.value = null;
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
    setAttachmentError(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const descValidation = validateDescription(description, { min: 10, max: 500, required: true });
  const nameValidation = validateName(timesheetName);

  const isValid = !nameValidation && !descValidation;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nameErr = validateName(timesheetName);
    const descErr = validateDescription(description, { min: 10, max: 500, required: true });

    if (nameErr) {
      setNameError(nameErr);
      return;
    }
    
    if (descErr) {
      setDescriptionError(descErr);
      return;
    }

    if (!isValid) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', timesheetName);
      formData.append('description', description);
      formData.append('date', selectedDate);

      if (attachments.length > 0) {
        attachments.forEach(file => {
          formData.append('attachments', file);
        });
      }

      await timesheetApi.updateTimesheet(timesheet._id, formData);
      toast.success("Timesheet updated successfully");
      if (onTimesheetUpdated) onTimesheetUpdated();
      onClose();
    } catch (error) {
      toast.error(getApiError(error, "Failed to update timesheet"));
    } finally {
      setLoading(false);
    }
  };

  if (!open || !timesheet) return null;

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
            EDIT TIMESHEET
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
              maxDate={new Date()}
              dateFormat="yyyy-MM-dd"
              wrapperClassName="w-full"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 font-medium"
              placeholderText="Select date"
              required
            />
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
              ATTACHMENTS {attachments.length > 0 && `(${attachments.length}/${MAX_FILES})`}
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
            disabled={!isValid || loading}
            className="flex-[2] py-4 bg-[#64748b] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg disabled:opacity-50"
          >
            {loading ? "UPDATING..." : "UPDATE TIMESHEET"}
          </button>
        </div>
      </div>
    </div>
  );
}
