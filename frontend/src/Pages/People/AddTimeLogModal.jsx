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
import GlassModal from "../../components/ui/GlassModal";

const AddTimeLogModal = ({ isOpen, onClose, onTimeLogAdded }) => {
  const [jobTitle, setJobTitle] = useState("");
  const [date, setDate] = useState(null);
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const modalRef = useRef(null);
  const fileInputRef = useRef(null);
  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB limit
  const MAX_FILES = 5;

  const resetForm = () => {
    setJobTitle("");
    setDate(null);
    setHours("");
    setDescription("");
    setAttachments([]);
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
        
        // Check for text/letters input
        const valueStr = String(value).trim();
        if (valueStr && isNaN(valueStr)) {
          return "Please enter a valid number";
        }
        
        const num = parseFloat(valueStr);
        
        // Check for negative numbers
        if (!isNaN(num) && num < 0) {
          return "Hours cannot be negative";
        }
        
        // Check for zero or too small
        if (!isNaN(num) && num < 0.5) {
          return "Hours must be at least 0.5.";
        }
        
        // Check for too large
        if (!isNaN(num) && num > 24) {
          return "Hours cannot exceed 24.";
        }
        
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
      setErrors(prev => ({
        ...prev,
        attachments: `Maximum ${MAX_FILES} files allowed. You can add ${MAX_FILES - attachments.length} more file(s).`
      }));
      return;
    }

    // Show errors
    if (duplicates.length > 0) {
      setErrors(prev => ({
        ...prev,
        attachments: `File(s) already attached: ${duplicates.join(", ")}`
      }));
    } else if (oversized.length > 0) {
      const limitMB = MAX_FILE_SIZE / (1024 * 1024);
      setErrors(prev => ({
        ...prev,
        attachments: `File size exceeds ${limitMB} MB limit: ${oversized.join(", ")}`
      }));
    } else {
      setErrors(prev => ({ ...prev, attachments: null }));
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
    setErrors(prev => ({ ...prev, attachments: null }));
    
    // Clear the file input to allow re-selecting the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const handleAddAnother = () => {
    if (!validateAll()) return;
    const newLog = {
      jobTitle: sanitizeText(jobTitle),
      date: formatDateForApi(date),
      hours: parseFloat(hours),
      description: sanitizeText(description),
      attachmentNames: attachments.map(f => f.name),
      attachmentFiles: attachments,
    };
    setLogs([...logs, newLog]);
    setJobTitle("");
    setDate(null);
    setHours("");
    setDescription("");
    setAttachments([]);
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
                attachmentFiles: attachments,
              },
            ];

      for (const log of logsToSubmit) {
        const formData = new FormData();
        formData.append("job", log.jobTitle);
        formData.append("date", log.date);
        formData.append("hours", log.hours);
        formData.append("description", log.description);
        if (log.attachmentFiles && log.attachmentFiles.length > 0) {
          log.attachmentFiles.forEach(file => {
            formData.append("attachments", file);
          });
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

  const footer = (
    <div className="flex w-full flex-col sm:flex-row gap-3">
      <button
        type="button"
        onClick={handleAddAnother}
        disabled={!isCurrentInputValid}
        className="flex-1 py-3 bg-brand-primary/10 text-brand-primary rounded-xl font-bold text-xs uppercase hover:bg-brand-primary/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        + Add Another
      </button>

      <div className="flex gap-3 flex-[2]">
        <button
          onClick={onClose}
          className="flex-1 py-3 font-bold text-xs text-muted uppercase hover:text-heading transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={(!isCurrentInputValid && logs.length === 0) || isLoading}
          className="flex-[2] py-3 bg-brand-primary text-white rounded-xl font-bold text-xs uppercase hover:bg-brand-primary/90 active:scale-95 transition-all disabled:opacity-50"
        >
          {isLoading
            ? "Saving..."
            : logs.length > 0
            ? `Save All (${logs.length + (isCurrentInputValid ? 1 : 0)})`
            : "Save Log"}
        </button>
      </div>
    </div>
  );

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="Add Time Log" footer={footer}>
      <div className="space-y-6">
        {/* JOB TITLE INPUT */}
        <div>
          <label className="block text-xs font-bold text-muted mb-2 uppercase">Log Title*</label>
          <input
            type="text"
            placeholder="e.g. Frontend Development"
            value={jobTitle}
            onChange={(e) => {
              setJobTitle(e.target.value);
              setErrors((prev) => ({ ...prev, jobTitle: validateField("jobTitle", e.target.value) }));
            }}
            onBlur={() => setErrors((prev) => ({ ...prev, jobTitle: validateField("jobTitle", jobTitle) }))}
            className={`w-full bg-surface/50 border ${errors.jobTitle ? "border-red-400" : "border-border-subtle"} rounded-xl px-4 py-3 text-sm text-heading outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all`}
          />
          {errors.jobTitle && <p className="text-xs text-red-500 mt-1">{errors.jobTitle}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* DATE */}
          <div className="relative">
            <label className="block text-xs font-bold text-muted mb-2 uppercase">Date*</label>
            <DatePicker
              selected={date}
              onChange={(d) => {
                setDate(d);
                setErrors((prev) => ({ ...prev, date: d ? null : "Please select a valid date." }));
              }}
              maxDate={new Date()}
              dateFormat="yyyy-MM-dd"
              placeholderText="Select Date"
              className={`w-full bg-surface/50 border ${errors.date ? "border-red-400" : "border-border-subtle"} rounded-xl px-4 py-3 text-sm text-heading outline-none focus:ring-2 focus:ring-brand-primary/30 cursor-pointer`}
              popperProps={{ strategy: "fixed" }}
            />
            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
          </div>

          {/* HOURS */}
          <div>
            <label className="block text-xs font-bold text-muted mb-2 uppercase">Hours*</label>
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
              className={`w-full bg-surface/50 border ${errors.hours ? "border-red-400" : "border-border-subtle"} rounded-xl px-4 py-3 text-sm text-heading outline-none focus:ring-2 focus:ring-brand-primary/30`}
            />
            {errors.hours && <p className="text-xs text-red-500 mt-1">{errors.hours}</p>}
          </div>
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="block text-xs font-bold text-muted mb-2 uppercase">
            Description* <span className="normal-case font-normal text-muted/70">(min 10, max 300 chars)</span>
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
            className={`w-full bg-surface/50 border ${errors.description ? "border-red-400" : "border-border-subtle"} rounded-xl px-4 py-3 text-sm text-heading outline-none focus:ring-2 focus:ring-brand-primary/30 resize-none`}
            rows={3}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.description ? <p className="text-xs text-red-500">{errors.description}</p> : <span />}
            <p className="text-xs text-muted text-right">{description.length}/300</p>
          </div>
        </div>

        {/* ATTACHMENT */}
        <div className="flex flex-col gap-2">
          <label className="block text-xs font-bold text-muted uppercase">
            Attachment {attachments.length > 0 && `(${attachments.length}/${MAX_FILES})`}
          </label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-border-subtle border-dashed rounded-xl cursor-pointer bg-surface hover:bg-surface/80 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <p className="text-xs text-muted font-bold uppercase tracking-tight">
                  {attachments.length > 0 ? `${attachments.length} file(s) selected` : "click to upload file(s)"}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,image/png,image/jpeg,image/jpg,.bmp,.mp4,.mp3"
                className="hidden"
                onChange={handleFileChange}
                disabled={attachments.length >= MAX_FILES}
              />
            </label>
          </div>
          {errors.attachments && (
            <p className="text-xs font-bold text-red-500 uppercase">{errors.attachments}</p>
          )}
          
          {attachments.length > 0 && (
            <div className="space-y-2 mt-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-surface/50 rounded-lg border border-border-subtle"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs font-bold text-heading truncate">{file.name}</span>
                    <span className="text-[10px] text-muted">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="text-muted hover:text-red-500 transition-colors text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PREVIEW OF QUEUED LOGS */}
        {logs.length > 0 && (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-brand-primary uppercase">
              Queued Logs ({logs.length})
            </label>
            <div className="space-y-2">
              {logs.map((log, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-brand-primary/5 rounded-xl border border-brand-primary/10 text-xs font-medium text-brand-primary flex justify-between items-center"
                >
                  <span>
                    {log.jobTitle} • {log.hours}h
                  </span>
                  <span className="opacity-70">{log.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </GlassModal>
  );
};

export default AddTimeLogModal;