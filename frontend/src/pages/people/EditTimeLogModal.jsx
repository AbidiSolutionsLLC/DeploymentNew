import React, { useState, useEffect, useRef } from "react";
import timeLogApi from "../../api/timeLogApi";
import taskApi from "../../api/taskApi";
import { toast } from "react-toastify";
import { moment, TIMEZONE } from "../../utils/dateUtils";
import { getApiError } from "../../utils/validationUtils";
import GlassModal from "../../components/ui/GlassModal";
import GlassButton from "../../components/ui/GlassButton";

const EditTimeLogModal = ({ isOpen, onClose, initialData, timeLogId, onTimeLogUpdated }) => {
 const [date, setDate] = useState("");
 const [jobTitle, setJobTitle] = useState("");
 const [hours, setHours] = useState("");
 const [description, setDescription] = useState("");
 const [attachmentName, setAttachmentName] = useState("");
 const [newAttachment, setNewAttachment] = useState(null);
 const [isLoading, setIsLoading] = useState(false);
 const [errors, setErrors] = useState({});

 // Task state
 const [availableTasks, setAvailableTasks] = useState([]);
 const [loadingTasks, setLoadingTasks] = useState(false);
 const [selectedTaskId, setSelectedTaskId] = useState("");
 const [markAsDone, setMarkAsDone] = useState(false);

 const modalRef = useRef(null);

 const validateHours = (value) => {
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
 };

 useEffect(() => {
 if (isOpen) {
   loadMyTasks();
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

 useEffect(() => {
 if (initialData) {
 const formattedDate = moment(initialData.date).tz(TIMEZONE).format('YYYY-MM-DD');
 setDate(formattedDate || "");
 setJobTitle(initialData.job || initialData.jobTitle || "");
 setHours(initialData.hours || initialData.totalHours || "");
 setDescription(initialData.description || "");
 setAttachmentName(initialData.attachments?.[0]?.originalname || initialData.attachmentName || "");
 const taskId = initialData.task?._id || initialData.task || "";
 setSelectedTaskId(taskId ? String(taskId) : "");
 setMarkAsDone(false);
 setNewAttachment(null);
 setErrors({});
 }
 }, [initialData]);

 if (!isOpen) return null;

 const handleTaskChange = (e) => {
   const taskId = e.target.value;
   setSelectedTaskId(taskId);
   if (!taskId) {
     setMarkAsDone(false);
     return;
   }
   const task = availableTasks.find((t) => t._id === taskId);
   if (task) {
     if (!jobTitle || jobTitle.includes("[TSK-") || jobTitle.toLowerCase().includes("task")) {
       const prefix = task.taskID ? `[${task.taskID}] ` : "";
       setJobTitle(`${prefix}${task.title}`);
     }
     if (task.status !== "Done") {
       setMarkAsDone(true);
     } else {
       setMarkAsDone(false);
     }
   }
 };

 const isCurrentInputValid = Boolean(date) && 
 description.trim().length >= 5 && 
 !validateHours(hours) && 
 Number(hours) >= 0.5;

 const handleSave = async (e) => {
 e.preventDefault();
 
 const hoursError = validateHours(hours);
 if (hoursError || !isCurrentInputValid || !timeLogId) {
 setErrors({ hours: hoursError });
 return;
 }

 setIsLoading(true);
 try {
 const formData = new FormData();
 formData.append('job', jobTitle);
 formData.append('date', date);
 formData.append('hours', hours);
 formData.append('description', description);
 formData.append('taskId', selectedTaskId || "");
 if (markAsDone) {
   formData.append('markAsDone', 'true');
 }
 if (newAttachment) formData.append('attachments', newAttachment);

 await timeLogApi.updateTimeLog(timeLogId, formData);
 toast.success("Log updated successfully");
 onTimeLogUpdated();
 onClose();
 } catch (error) {
 console.error("Failed to update time log:", error);
 toast.error(getApiError(error, "Update failed"));
 } finally {
 setIsLoading(false);
 }
 };

 const footer = (
 <>
 <GlassButton variant="secondary" type="button" onClick={onClose}>
 Cancel
 </GlassButton>
 <GlassButton
 variant="primary"
 type="submit"
 form="editLogForm"
 isLoading={isLoading}
 disabled={isLoading || !isCurrentInputValid}
 >
 Update Log
 </GlassButton>
 </>
 );

 const selectedTaskObj = availableTasks.find((t) => t._id === selectedTaskId) || (initialData?.task && typeof initialData.task === 'object' ? initialData.task : null);

 return (
 <GlassModal isOpen={isOpen} onClose={onClose} title="Edit Time Log" footer={footer}>
 <form id="editLogForm" onSubmit={handleSave} className="space-y-5">
 
 {/* TASK LINKING SECTION */}
 <div>
   <label className="block text-xs font-bold text-muted mb-2 uppercase flex items-center justify-between">
     <span>Linked Task <span className="text-[10px] lowercase text-muted font-normal">(optional)</span></span>
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
     {selectedTaskObj && !availableTasks.some((t) => t._id === selectedTaskObj._id) && (
       <option value={selectedTaskObj._id}>
         {selectedTaskObj.taskID ? `[${selectedTaskObj.taskID}] ` : ""}{selectedTaskObj.title}
       </option>
     )}
   </select>

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
       {selectedTaskObj.status !== "Done" && (
         <label className="flex items-center gap-2 mt-1 cursor-pointer select-none">
           <input
             type="checkbox"
             checked={markAsDone}
             onChange={(e) => setMarkAsDone(e.target.checked)}
             className="rounded border-border text-brand-primary focus:ring-brand-primary w-4 h-4 cursor-pointer"
           />
           <span className="text-xs font-medium text-main">
             Mark task as <strong>Completed (Done)</strong> on update
           </span>
         </label>
       )}
     </div>
   )}
 </div>

 <div>
 <label className="block text-xs font-bold text-muted mb-2 uppercase">Log Title</label>
 <input
 type="text"
 value={jobTitle}
 onChange={(e) => setJobTitle(e.target.value)}
 className="w-full bg-surface/50 border border-border-subtle rounded-xl px-4 py-3 text-sm text-heading outline-none focus:ring-2 focus:ring-brand-primary/30"
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-bold text-muted mb-2 uppercase">Date*</label>
 <input
 type="date"
 value={date}
 onChange={(e) => setDate(e.target.value)}
 className="w-full bg-surface/50 border border-border-subtle rounded-xl px-4 py-3 text-sm text-heading outline-none focus:ring-2 focus:ring-brand-primary/30"
 required
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-muted mb-2 uppercase">Hours*</label>
 <input
 type="number"
 step="0.1"
 value={hours}
 onChange={(e) => {
 setHours(e.target.value);
 setErrors((prev) => ({ ...prev, hours: validateHours(e.target.value) }));
 }}
 onBlur={() => setErrors((prev) => ({ ...prev, hours: validateHours(hours) }))}
 className={`w-full bg-surface/50 border ${errors.hours ? "border-red-400" : "border-border-subtle"} rounded-xl px-4 py-3 text-sm text-heading outline-none focus:ring-2 focus:ring-brand-primary/30`}
 required
 />
 {errors.hours && (
 <p className="text-xs text-red-500 mt-1">{errors.hours}</p>
 )}
 </div>
 </div>

 <div>
 <label className="block text-xs font-bold text-muted mb-2 uppercase">Description*</label>
 <textarea
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 rows={3}
 className="w-full bg-surface/50 border border-border-subtle rounded-xl px-4 py-3 text-sm text-heading outline-none focus:ring-2 focus:ring-brand-primary/30 resize-none"
 required
 />
 </div>

 <div className="flex flex-col gap-2">
 <label className="block text-xs font-bold text-muted uppercase">Attachment</label>
 <div className="flex items-center justify-center w-full">
 <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-border-subtle border-dashed rounded-xl cursor-pointer bg-surface hover:bg-surface/80 transition-colors">
 <div className="flex flex-col items-center justify-center pt-3 pb-3">
 <p className="text-xs text-muted font-bold uppercase tracking-tight">
 {newAttachment ? newAttachment.name : "click to replace file"}
 </p>
 </div>
 <input
 type="file"
 accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,image/png,image/jpeg,image/jpg,.bmp,.mp4,.mp3"
 onChange={(e) => setNewAttachment(e.target.files[0])}
 className="hidden"
 />
 </label>
 </div>
 {attachmentName && !newAttachment && (
 <p className="text-[10px] font-bold text-muted mt-2 truncate uppercase">CURRENT: {attachmentName}</p>
 )}
 </div>
 </form>
 </GlassModal>
 );
};

export default EditTimeLogModal;
