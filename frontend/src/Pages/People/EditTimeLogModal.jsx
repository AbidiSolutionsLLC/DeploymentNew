import React, { useState, useEffect, useRef } from "react";
import timeLogApi from "../../api/timeLogApi";
import { toast } from "react-toastify";
import { moment, TIMEZONE } from "../../utils/dateUtils";
import { getApiError } from "../../utils/validationUtils";
import GlassModal from "../../components/ui/GlassModal";

const EditTimeLogModal = ({ isOpen, onClose, initialData, timeLogId, onTimeLogUpdated }) => {
 const [date, setDate] = useState("");
 const [jobTitle, setJobTitle] = useState("");
 const [hours, setHours] = useState("");
 const [description, setDescription] = useState("");
 const [attachmentName, setAttachmentName] = useState("");
 const [newAttachment, setNewAttachment] = useState(null);
 const [isLoading, setIsLoading] = useState(false);
 const [errors, setErrors] = useState({});
 const modalRef = useRef(null);

 // Validate hours field
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
 if (initialData) {
 // FIX: Ensure date is formatted as YYYY-MM-DD string for the input
 const formattedDate = moment(initialData.date).tz(TIMEZONE).format('YYYY-MM-DD');
 setDate(formattedDate || "");
 setJobTitle(initialData.job || initialData.jobTitle || "");
 setHours(initialData.hours || initialData.totalHours || "");
 setDescription(initialData.description || "");
 setAttachmentName(initialData.attachments?.[0]?.originalname || initialData.attachmentName || "");
 }
 }, [initialData]);

 if (!isOpen) return null;

 const handleBackdropClick = (e) => {
 if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
 };

 const isCurrentInputValid = Boolean(date) && 
 description.trim().length >= 5 && 
 !validateHours(hours) && 
 Number(hours) >= 0.5;

 const handleSave = async (e) => {
 e.preventDefault();
 
 // Validate before saving
 const hoursError = validateHours(hours);
 if (hoursError || !isCurrentInputValid || !timeLogId) {
 setErrors({ hours: hoursError });
 return;
 }

 setIsLoading(true);
 try {
 const formData = new FormData();
 formData.append('job', jobTitle);
 formData.append('date', date); // Send raw string
 formData.append('hours', hours);
 formData.append('description', description);
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
 <div className="flex w-full gap-3">
 <button onClick={onClose} className="flex-1 py-3 font-bold text-xs text-muted uppercase hover:text-heading transition-colors">
 Cancel
 </button>
 <button
 type="submit"
 form="editLogForm"
 disabled={isLoading || !isCurrentInputValid}
 className="flex-1 py-3 bg-brand-primary text-white rounded-xl font-bold text-xs uppercase hover:bg-brand-primary/90 active:scale-95 transition-all disabled:opacity-50"
 >
 {isLoading ? "Saving..." : "Update Log"}
 </button>
 </div>
 );

 return (
 <GlassModal isOpen={isOpen} onClose={onClose} title="Edit Time Log" footer={footer}>
 <form id="editLogForm" onSubmit={handleSave} className="space-y-6">
 <div>
 <label className="block text-xs font-bold text-muted mb-2 uppercase">Job Title</label>
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
 <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-border-subtle border-dashed rounded-xl cursor-pointer bg-surface hover:bg-surface/80 transition-colors">
 <div className="flex flex-col items-center justify-center pt-5 pb-6">
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
