import React, { useState, useRef, useEffect } from "react";
import timeLogApi from "../../api/timeLogApi";
import taskApi from "../../api/taskApi";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
 validateDescription,
 validateText,
 sanitizeText,
 getApiError,
} from "../../utils/validationUtils";
import GlassModal from "../../components/ui/GlassModal";
import GlassButton from "../../components/ui/GlassButton";
import { formatDateForAPI } from "../../utils/dateUtils";

const AddTimeLogModal = ({ isOpen, onClose, onTimeLogAdded }) => {
 const [jobTitle, setJobTitle] = useState("");
 const [date, setDate] = useState(null);
 const [hours, setHours] = useState("");
 const [description, setDescription] = useState("");
 const [attachments, setAttachments] = useState([]);
 const [logs, setLogs] = useState([]);
 const [isLoading, setIsLoading] = useState(false);
 const [errors, setErrors] = useState({});

 // Task integration state
 const [availableTasks, setAvailableTasks] = useState([]);
 const [loadingTasks, setLoadingTasks] = useState(false);
 const [selectedTaskId, setSelectedTaskId] = useState("");
 const [markAsDone, setMarkAsDone] = useState(false);

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
 setSelectedTaskId("");
 setMarkAsDone(false);
 };

 useEffect(() => {
 if (isOpen) {
   loadMyTasks();
 } else {
   resetForm();
 }
 }, [isOpen]);

 const loadMyTasks = async () => {
   try {
     setLoadingTasks(true);
     const res = await taskApi.getMyTasks();
     const tasksList = Array.isArray(res) ? res : res?.data || [];
     setAvailableTasks(tasksList);
   } catch (err) {
     console.error("Failed to load user tasks", err);
   } finally {
     setLoadingTasks(false);
   }
 };

 if (!isOpen) return null;

 const formatDateForApi = (d) => {
 return formatDateForAPI(d);
 };

 const validateField = (name, value) => {
 switch (name) {
 case "jobTitle":
 return validateText(value);
 case "date":
 return value ? null : "Please select a valid date.";
 case "hours": {
 if (!value && value !== 0) return "Hours worked is required.";
 const valueStr = String(value).trim();
 if (valueStr && isNaN(valueStr)) {
 return "Please enter a valid number";
 }
 const num = parseFloat(valueStr);
 if (!isNaN(num) && num < 0) {
 return "Hours cannot be negative";
 }
 if (!isNaN(num) && num < 0.5) {
 return "Hours must be at least 0.5.";
 }
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

 const handleTaskChange = (e) => {
   const taskId = e.target.value;
   setSelectedTaskId(taskId);
   if (!taskId) {
     setMarkAsDone(false);
     return;
   }
   const task = availableTasks.find((t) => t._id === taskId);
   if (task) {
     // Auto-populate job title with task ID and Title
     const prefix = task.taskID ? `[${task.taskID}] ` : "";
     setJobTitle(`${prefix}${task.title}`);
     setErrors((prev) => ({ ...prev, jobTitle: null }));
     // If task is not already done, default check to mark as done
     if (task.status !== "Done") {
       setMarkAsDone(true);
     } else {
       setMarkAsDone(false);
     }
   }
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
 setErrors(prev => ({
 ...prev,
 attachments: `Maximum ${MAX_FILES} files allowed. You can add ${MAX_FILES - attachments.length} more file(s).`
 }));
 return;
 }

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

 if (validFiles.length > 0) {
 setAttachments(prev => [...prev, ...validFiles]);
 }
 e.target.value = null;
 };

 const removeAttachment = (index) => {
 setAttachments(prev => prev.filter((_, i) => i !== index));
 setErrors(prev => ({ ...prev, attachments: null }));
 if (fileInputRef.current) {
 fileInputRef.current.value = null;
 }
 };

 const handleAddAnother = () => {
 if (!validateAll()) return;
 const selectedTask = availableTasks.find((t) => t._id === selectedTaskId);
 const newLog = {
 jobTitle: sanitizeText(jobTitle),
 date: formatDateForApi(date),
 hours: parseFloat(hours),
 description: sanitizeText(description),
 attachmentNames: attachments.map(f => f.name),
 attachmentFiles: attachments,
 taskId: selectedTaskId || null,
 taskTitle: selectedTask?.title || null,
 taskID: selectedTask?.taskID || null,
 markAsDone: markAsDone,
 };
 setLogs([...logs, newLog]);
 setJobTitle("");
 setDate(null);
 setHours("");
 setDescription("");
 setAttachments([]);
 setErrors({});
 setSelectedTaskId("");
 setMarkAsDone(false);
 };

 const handleSave = async () => {
 const isFormPartiallyFilled = jobTitle || date || hours || description || attachments.length > 0;
 
 if (logs.length === 0) {
 if (!validateAll()) return;
 } else if (isFormPartiallyFilled) {
 if (!validateAll()) return;
 }

 setIsLoading(true);
 try {
 const logsToSubmit = [...logs];
 if (isCurrentInputValid || (logs.length === 0 && validateAll())) {
 const selectedTask = availableTasks.find((t) => t._id === selectedTaskId);
 logsToSubmit.push({
 jobTitle: sanitizeText(jobTitle),
 date: formatDateForApi(date),
 hours: parseFloat(hours),
 description: sanitizeText(description),
 attachmentFiles: attachments,
 taskId: selectedTaskId || null,
 markAsDone: markAsDone,
 });
 }

 for (const log of logsToSubmit) {
 const formData = new FormData();
 formData.append("job", log.jobTitle);
 formData.append("date", log.date);
 formData.append("hours", log.hours);
 formData.append("description", log.description);
 if (log.taskId) {
   formData.append("taskId", log.taskId);
 }
 if (log.markAsDone) {
   formData.append("markAsDone", "true");
 }
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
 <>
 <GlassButton variant="secondary" type="button" onClick={handleAddAnother}>
 Add Another
 </GlassButton>
 <GlassButton variant="secondary" type="button" onClick={onClose}>
 Cancel
 </GlassButton>
 <GlassButton
 variant="primary"
 onClick={handleSave}
 isLoading={isLoading}
 disabled={isLoading}
 >
 {logs.length > 0
 ? `Save All (${logs.length + (isCurrentInputValid ? 1 : 0)})`
 : "Save Log"}
 </GlassButton>
 </>
 );

 const selectedTaskObj = availableTasks.find((t) => t._id === selectedTaskId);

 return (
 <GlassModal isOpen={isOpen} onClose={onClose} title="Add Time Log" footer={footer}>
 <div className="space-y-5">
 
 {/* LINK ASSIGNED TASK SECTION */}
 <div>
   <label className="block text-xs font-bold text-muted mb-2 uppercase flex items-center justify-between">
     <span>Link Assigned / Completed Task <span className="text-[10px] lowercase text-muted font-normal">(optional)</span></span>
     {loadingTasks && <span className="text-[10px] text-brand-primary lowercase">Loading tasks...</span>}
   </label>
   <select
     value={selectedTaskId}
     onChange={handleTaskChange}
     className="w-full bg-surface/50 border border-border-subtle rounded-xl px-4 py-3 text-sm text-heading outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all cursor-pointer"
   >
     <option value="">-- No specific task (General Time Log) --</option>
     {availableTasks.map((t) => (
       <option key={t._id} value={t._id}>
         {t.taskID ? `[${t.taskID}] ` : ""}{t.title} — {t.project?.title || "Project"} ({t.status || "Todo"})
       </option>
     ))}
   </select>

   {/* Linked Task Details Pill */}
   {selectedTaskObj && (
     <div className="mt-2.5 p-3 rounded-xl bg-app border border-border-subtle flex flex-col gap-2">
       <div className="flex items-center justify-between gap-2">
         <span className="text-xs font-bold text-heading truncate">
           {selectedTaskObj.taskID && (
             <span className="font-mono text-brand-primary mr-1.5">{selectedTaskObj.taskID}:</span>
           )}
           {selectedTaskObj.title}
         </span>
         <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
           selectedTaskObj.status === "Done"
             ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
             : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
         }`}>
           {selectedTaskObj.status || "Todo"}
         </span>
       </div>
       {selectedTaskObj.project?.title && (
         <div className="text-[11px] text-muted flex items-center gap-1.5">
           <span>Project:</span>
           <span className="font-medium text-main">{selectedTaskObj.project.title}</span>
         </div>
       )}
       {selectedTaskObj.status !== "Done" && (
         <label className="flex items-center gap-2 mt-1 cursor-pointer select-none">
           <input
             type="checkbox"
             checked={markAsDone}
             onChange={(e) => setMarkAsDone(e.target.checked)}
             className="rounded border-border text-brand-primary focus:ring-brand-primary w-4 h-4 cursor-pointer"
           />
           <span className="text-xs font-medium text-main">
             Mark task as <strong>Completed (Done)</strong> on log creation
           </span>
         </label>
       )}
     </div>
   )}
 </div>

 {/* LOG TITLE INPUT */}
 <div>
 <label className="block text-xs font-bold text-muted mb-2 uppercase">Log Title*</label>
 <input
 type="text"
 placeholder="e.g. Frontend Development or Task Summary"
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
 dateFormat="M/d/yyyy"
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
 <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-border-subtle border-dashed rounded-xl cursor-pointer bg-surface hover:bg-surface/80 transition-colors">
 <div className="flex flex-col items-center justify-center pt-3 pb-3">
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
 <div>
   <div className="font-semibold text-heading">
     {log.jobTitle}
   </div>
   {log.taskTitle && (
     <div className="text-[10px] text-muted font-normal mt-0.5">
       Task: {log.taskID ? `[${log.taskID}] ` : ""}{log.taskTitle}
     </div>
   )}
 </div>
 <div className="text-right">
   <div className="font-bold">{log.hours}h</div>
   <div className="text-[10px] opacity-70">{log.date}</div>
 </div>
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
