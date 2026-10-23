import React, { useState, useEffect } from "react";
import api from "../axios";
import taskApi from "../api/taskApi";
import { toast } from "react-toastify";
import ModernSelect from "./ui/ModernSelect";
import ModernDatePicker from "./ui/ModernDatePicker";
import GlassModal from "./ui/GlassModal";
import GlassButton from "./ui/GlassButton";
import {
 validateDescription,
 validateText,
 sanitizeText,
 getApiError,
} from "../utils/validationUtils";
import { formatDateForAPI } from "../utils/dateUtils";
import { useConfirm } from "../context/ConfirmContext";

export default function AdminAddTimeLogModal({ open, onClose, onSuccess, allUsers }) {
 const confirm = useConfirm();
 const [formData, setFormData] = useState({
 employeeId: "",
 taskId: "",
 job: "",
 date: formatDateForAPI(new Date()),
 description: "",
 hours: "",
 });
 const [errors, setErrors] = useState({});
 const [loading, setLoading] = useState(false);
 const [allCompanyTasks, setAllCompanyTasks] = useState([]);
 const [loadingTasks, setLoadingTasks] = useState(false);

 useEffect(() => {
 if (open) {
 setFormData({
 employeeId: "",
 taskId: "",
 job: "",
 date: formatDateForAPI(new Date()),
 description: "",
 hours: "",
 });
 setErrors({});
 loadTasks();
 }
 }, [open]);

 const loadTasks = async () => {
   try {
     setLoadingTasks(true);
     const res = await taskApi.getMyTasks();
     const list = Array.isArray(res) ? res : res?.data || [];
     setAllCompanyTasks(list);
   } catch (err) {
     console.error("Failed to load company tasks", err);
   } finally {
     setLoadingTasks(false);
   }
 };

 const handleCancel = async () => {
 const isDirty = formData.employeeId || formData.job || formData.description || formData.hours || formData.taskId;
 if (isDirty) {
 const isConfirmed = await confirm({ title: "Unsaved Changes", message: "Are you sure? Unsaved data will be lost." });
 if (isConfirmed) onClose();
 } else {
 onClose();
 }
 };

 const validateField = (name, value) => {
 switch (name) {
 case "employeeId":
 return value ? null : "Please select an employee.";
 case "job":
 if (!value) return "Task/Job name is required.";
 if (value.length > 50) return "Maximum 50 characters allowed.";
 return validateText(value);
 case "date": {
 if (!value) return "Please select a valid date.";
 const selectedDate = new Date(value);
 const today = new Date();
 const todayStr = formatDateForAPI(today);
 
 if (value > todayStr) return "Date cannot be in the future.";
 
 const oneYearAgo = new Date();
 oneYearAgo.setFullYear(today.getFullYear() - 1);
 if (selectedDate < oneYearAgo) return "Cannot set date older than 1 year.";
 
 return null;
 }
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
 employeeId: validateField("employeeId", formData.employeeId),
 job: validateField("job", formData.job),
 date: validateField("date", formData.date),
 hours: validateField("hours", formData.hours),
 description: validateField("description", formData.description),
 };
 setErrors(newErrors);
 return !Object.values(newErrors).some(Boolean);
 };

 const handleChange = (name, value) => {
 const updatedForm = { ...formData, [name]: value };
 setFormData(updatedForm);
 setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
 };

 const handleTaskSelect = (e) => {
   const taskId = e.target.value;
   const selectedTask = allCompanyTasks.find((t) => t._id === taskId);
   let newJob = formData.job;
   if (selectedTask) {
     const prefix = selectedTask.taskID ? `[${selectedTask.taskID}] ` : "";
     newJob = `${prefix}${selectedTask.title}`.slice(0, 50);
   }
   setFormData((prev) => ({
     ...prev,
     taskId,
     job: newJob,
   }));
   setErrors((prev) => ({ ...prev, job: validateField("job", newJob) }));
 };

 const handleSubmit = async (e) => {
 if (e) e.preventDefault();
 if (!validateAll()) {
 toast.error("Please fix validation errors before submitting.");
 return;
 }

 setLoading(true);
 try {
 await api.post("/time-logs", {
 employeeId: formData.employeeId,
 taskId: formData.taskId || undefined,
 job: sanitizeText(formData.job),
 date: formData.date,
 description: sanitizeText(formData.description),
 hours: parseFloat(formData.hours),
 });
 toast.success("Time log created successfully");
 if (onSuccess) onSuccess();
 onClose();
 } catch (error) {
 toast.error(getApiError(error, "Failed to create time log"));
 } finally {
 setLoading(false);
 }
 };

 // Filter tasks for selected employee (if any selected), or show all company tasks
 const employeeTasks = formData.employeeId
   ? allCompanyTasks.filter((t) =>
       t.team?.some((m) => (m?._id || m)?.toString() === formData.employeeId.toString())
     )
   : allCompanyTasks;

 return (
 <GlassModal
 isOpen={open}
 onClose={() => !loading && handleCancel()}
 title="ADD TIME LOG (ADMIN)"
 maxWidth="max-w-lg"
 footer={
 <>
 <GlassButton variant="secondary" onClick={handleCancel} disabled={loading}>
 Cancel
 </GlassButton>
 <GlassButton 
 variant="primary" 
 onClick={handleSubmit} 
 isLoading={loading}
 disabled={Object.values(errors).some(Boolean)}
 >
 {loading ? "SAVING..." : "CREATE LOG"}
 </GlassButton>
 </>
 }
 >
 <form onSubmit={handleSubmit} className="space-y-5">
 {/* Employee Select */}
 <div>
 <ModernSelect
 label="Select Employee"
 name="employeeId"
 value={formData.employeeId}
 onChange={(e) => {
   handleChange("employeeId", e.target.value);
   setFormData((prev) => ({ ...prev, taskId: "" }));
 }}
 required
 placeholder="Select Employee"
 options={[
 { value: "", label: "Select Employee" },
 ...allUsers.map((u) => ({ value: u._id, label: `${u.name} (${u.email})` })),
 ]}
 className="w-full"
 error={errors.employeeId}
 />
 {errors.employeeId && (
 <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.employeeId}</p>
 )}
 </div>

 {/* Link Task (Optional) */}
 <div>
   <label className="block text-[10px] font-black text-muted dark:text-muted mb-2 uppercase tracking-widest flex items-center justify-between">
     <span>LINK ASSIGNED TASK (OPTIONAL)</span>
     {loadingTasks && <span className="text-[10px] text-brand-primary lowercase font-normal">Loading tasks...</span>}
   </label>
   <select
     value={formData.taskId}
     onChange={handleTaskSelect}
     className="w-full bg-surface/50 border border-border-subtle rounded-xl px-4 py-3 text-sm text-heading outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all cursor-pointer"
   >
     <option value="">-- No specific task (General work) --</option>
     {employeeTasks.map((t) => (
       <option key={t._id} value={t._id}>
         {t.taskID ? `[${t.taskID}] ` : ""}{t.title} — {t.project?.title || "Project"} ({t.status || "Todo"})
       </option>
     ))}
     {formData.employeeId && employeeTasks.length === 0 && (
       <option disabled value="none">No tasks assigned to this employee</option>
     )}
   </select>
 </div>

 {/* Job/Task Name */}
 <div>
 <label className="block text-[10px] font-black text-muted dark:text-muted mb-2 uppercase tracking-widest">
 TASK/JOB NAME*
 </label>
 <input
 type="text"
 name="job"
 value={formData.job}
 maxLength={50}
 onChange={(e) => handleChange("job", e.target.value)}
 onBlur={() => setErrors((prev) => ({ ...prev, job: validateField("job", formData.job) }))}
 placeholder="e.g. Website Overhaul"
 className={`glass-input w-full ${errors.job ? "border-red-400 ring-1 ring-red-400" : ""}`}
 />
 {errors.job && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.job}</p>}
 </div>

 {/* Date */}
 <div>
 <ModernDatePicker
 label="DATE"
 name="date"
 value={formData.date}
 onChange={(e) => handleChange("date", e.target.value)}
 required
 maxDate={new Date()}
 error={errors.date}
 />
 </div>

 {/* Hours */}
 <div>
 <label className="block text-[10px] font-black text-muted dark:text-muted mb-2 uppercase tracking-widest">
 HOURS WORKED*
 </label>
 <input
 type="number"
 step="0.5"
 min="0.5"
 max="24"
 value={formData.hours}
 onChange={(e) => handleChange("hours", e.target.value)}
 onBlur={() => setErrors((prev) => ({ ...prev, hours: validateField("hours", formData.hours) }))}
 placeholder="e.g. 4.5"
 className={`glass-input w-full ${errors.hours ? "border-red-400 ring-1 ring-red-400" : ""}`}
 />
 {errors.hours && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.hours}</p>}
 </div>

 {/* Description */}
 <div>
 <label className="block text-[10px] font-black text-muted dark:text-muted mb-2 uppercase tracking-widest">
 DESCRIPTION* <span className="normal-case font-normal text-muted dark:text-muted">(min 10, max 300 chars)</span>
 </label>
 <textarea
 value={formData.description}
 onChange={(e) => handleChange("description", e.target.value)}
 onBlur={() =>
 setErrors((prev) => ({ ...prev, description: validateField("description", formData.description) }))
 }
 placeholder="Describe what this person worked on in detail..."
 className={`glass-input w-full resize-none min-h-[80px] ${errors.description ? "border-red-400 ring-1 ring-red-400" : ""}`}
 />
 <div className="flex justify-between items-center mt-1">
 {errors.description ? (
 <p className="text-[10px] text-red-500 font-bold">{errors.description}</p>
 ) : (
 <span />
 )}
 <p className="text-[10px] text-muted dark:text-muted text-right">{formData.description.length}/300</p>
 </div>
 </div>
 </form>
 </GlassModal>
 );
}
