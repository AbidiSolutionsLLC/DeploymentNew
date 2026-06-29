import React, { useState, useRef, useEffect } from "react";
import timesheetApi from "../api/timesheetApi";
import { toast } from "react-toastify";
import { moment, TIMEZONE } from "../utils/dateUtils";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import GlassModal from "./ui/GlassModal";
import GlassButton from "./ui/GlassButton";
import { validateDescription, getApiError } from "../utils/validationUtils";

export default function EditTimesheetModal({ open, onClose, timesheet, onTimesheetUpdated }) {
 const [timesheetName, setTimesheetName] = useState("");
 const [selectedDate, setSelectedDate] = useState("");
 const [description, setDescription] = useState("");
 const [attachments, setAttachments] = useState([]);
 const [loading, setLoading] = useState(false);
 const [descriptionError, setDescriptionError] = useState(null);
 const [attachmentError, setAttachmentError] = useState(null);
 const [nameError, setNameError] = useState(null);
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

 const handleSubmit = async (e) => {
 if (e) e.preventDefault();
 const nameErr = validateName(timesheetName);
 const descErr = validateDescription(description, { min: 10, max: 500, required: true });

 setNameError(nameErr);
 setDescriptionError(descErr);

 if (nameErr || descErr) {
 toast.error("Please fix validation errors");
 return;
 }

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

 return (
 <GlassModal
 isOpen={open}
 onClose={() => !loading && onClose()}
 title="EDIT TIMESHEET"
 maxWidth="max-w-lg"
 footer={
 <>
 <GlassButton variant="ghost" onClick={onClose} disabled={loading}>
 CANCEL
 </GlassButton>
 <GlassButton 
 variant="primary" 
 onClick={handleSubmit} 
 isLoading={loading}
 disabled={Object.values({ nameError, descriptionError }).some(Boolean)}
 >
 {loading ? "UPDATING..." : "UPDATE TIMESHEET"}
 </GlassButton>
 </>
 }
 >
 <form onSubmit={handleSubmit} className="space-y-6">
 <div>
 <label className="block text-[10px] font-black text-muted dark:text-muted mb-2 uppercase tracking-widest">
 TIMESHEET DATE*
 </label>
 <DatePicker
 selected={selectedDate ? new Date(selectedDate) : null}
 onChange={(date) => setSelectedDate(date ? moment(date).format('YYYY-MM-DD') : "")}
 maxDate={new Date()}
 dateFormat="M/d/yyyy"
 wrapperClassName="w-full"
 className="glass-input w-full cursor-pointer"
 placeholderText="Select date"
 required
 />
 </div>

 <div>
 <label className="block text-[10px] font-black text-muted dark:text-muted mb-2 uppercase tracking-widest">
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
 className={`glass-input w-full ${nameError ? "border-red-400 ring-1 ring-red-400" : ""}`}
 required
 />
 {nameError && (
 <p className="text-[10px] text-red-500 mt-1 font-bold">{nameError}</p>
 )}
 </div>

 <div>
 <label className="block text-[10px] font-black text-muted dark:text-muted mb-2 uppercase tracking-widest">
 SUMMARY DESCRIPTION* <span className="normal-case font-normal text-muted dark:text-muted">(min 10, max 500 chars)</span>
 </label>
 <textarea
 value={description}
 onChange={(e) => {
 setDescription(e.target.value);
 setDescriptionError(validateDescription(e.target.value, { min: 10, max: 500, required: true }));
 }}
 onBlur={() => setDescriptionError(validateDescription(description, { min: 10, max: 500, required: true }))}
 className={`glass-input w-full min-h-[100px] resize-none ${descriptionError ? "border-red-400 ring-1 ring-red-400" : ""}`}
 placeholder="Describe your work in detail (at least 3 meaningful words)..."
 />
 <div className="flex justify-between items-center mt-1">
 {descriptionError ? (
 <p className="text-[10px] text-red-500 font-bold">{descriptionError}</p>
 ) : <span />}
 <p className="text-[10px] text-muted dark:text-muted text-right">{description.length}/500</p>
 </div>
 </div>

 <div>
 <label className="block text-[10px] font-black text-muted dark:text-muted mb-2 uppercase tracking-widest">
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
 <div className="w-full bg-surface/50 dark:bg-slate-800/50 border border-border-subtle dark:border-slate-700 border-dashed rounded-xl px-4 py-3 text-sm text-muted dark:text-muted flex items-center justify-between group-hover:bg-surface dark:group-hover:bg-slate-800 transition-all">
 <span className="truncate">
 {attachments.length > 0 ? `${attachments.length} file(s) selected` : "Choose file(s)..."}
 </span>
 <span className="text-[10px] font-black text-muted dark:text-muted uppercase">UPLOAD</span>
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
 className="flex items-center justify-between p-2 bg-surface dark:bg-slate-800 rounded-lg border border-border-subtle dark:border-slate-700"
 >
 <div className="flex items-center gap-2 flex-1 min-w-0">
 <span className="text-[10px] font-bold text-heading dark:text-white truncate">{file.name}</span>
 <span className="text-[9px] text-muted dark:text-muted">({(file.size / 1024).toFixed(1)} KB)</span>
 </div>
 <button
 type="button"
 onClick={() => removeAttachment(index)}
 className="text-muted dark:text-muted hover:text-red-500 transition-colors text-sm font-bold"
 >
 ✕
 </button>
 </div>
 ))}
 </div>
 )}
 </div>
 </form>
 </GlassModal>
 );
}
