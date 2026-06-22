import React, { useState } from "react";
import holidayApi from "../api/holidayApi";
import ModernSelect from "./ui/ModernSelect"; 
import ModernDatePicker from "./ui/ModernDatePicker"; 
import { validateText, sanitizeText } from "../utils/validationUtils";
import GlassModal from "./ui/GlassModal";
import GlassButton from "./ui/GlassButton";
import { toast } from "react-toastify";

const AddHolidayModal = ({ isOpen, setIsOpen, onHolidayAdded }) => {
 const initialFormState = {
 holidayName: "",
 holidayType: "",
 date: "",
 isRecurring: false
 };

 const [formData, setFormData] = useState(initialFormState);
 const [errors, setErrors] = useState({});
 const [loading, setLoading] = useState(false);

 if (!isOpen) return null;

 const handleChange = (e) => {
 const { name, value } = e.target;
 setFormData(prev => ({ ...prev, [name]: value }));
 
 // Inline validation for holiday name
 if (name === "holidayName") {
 const error = validateText(value);
 let customError = error;
 if (!error && value.length < 2) customError = "Must be at least 2 characters.";
 if (!error && !/^[a-zA-Z\s'-]+$/.test(value)) customError = "Only letters allowed.";
 setErrors(prev => ({ ...prev, holidayName: customError }));
 }
 };

 const handleSubmit = async (e) => {
 if (e) e.preventDefault();

 // Check errors
 const nameError = validateText(formData.holidayName);
 let finalNameError = nameError;
 if (!nameError && formData.holidayName.length < 2) finalNameError = "Must be at least 2 characters.";
 if (!nameError && !/^[a-zA-Z\s'-]+$/.test(formData.holidayName)) finalNameError = "Only letters allowed.";
 
 const newErrors = {};
 if (finalNameError) newErrors.holidayName = finalNameError;
 if (!formData.holidayType) newErrors.holidayType = "Holiday type is required.";
 if (!formData.date) newErrors.date = "Date is required.";
 
 if (Object.keys(newErrors).length > 0) {
 setErrors(newErrors);
 toast.error("PLEASE FIX VALIDATION ERRORS");
 return;
 }

 setLoading(true);
 try {
 if (!formData.date) return;
 
 const dateObj = new Date(formData.date);
 const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
 
 await holidayApi.createHoliday({ 
 ...formData, 
 holidayName: sanitizeText(formData.holidayName),
 day: dayName 
 });
 
 setFormData(initialFormState);
 setErrors({});
 onHolidayAdded();
 setIsOpen(false);
 } catch (err) {
 console.error(err);
 toast.error("Failed to add holiday.");
 } finally {
 setLoading(false);
 }
 };

 const handleClose = () => {
 setFormData(initialFormState);
 setIsOpen(false);
 };

 return (
 <GlassModal
 isOpen={isOpen}
 onClose={handleClose}
 title="ADD HOLIDAY"
 maxWidth="max-w-md"
 footer={
 <>
 <GlassButton variant="ghost" onClick={handleClose} disabled={loading}>
 CANCEL
 </GlassButton>
 <GlassButton 
 variant="primary" 
 onClick={handleSubmit} 
 isLoading={loading}
 disabled={Object.values(errors).some(Boolean)}
 >
 {loading ? "SUBMITTING..." : "SAVE HOLIDAY"}
 </GlassButton>
 </>
 }
 >
 <form id="holidayForm" onSubmit={handleSubmit} className="space-y-6">
 <div>
 <label className="block text-[10px] font-black text-muted dark:text-muted mb-2 uppercase tracking-widest">
 HOLIDAY NAME*
 </label>
 <input
 list="holidayNames"
 name="holidayName"
 placeholder="Enter holiday name"
 value={formData.holidayName}
 onChange={handleChange}
 className={`glass-input w-full ${errors.holidayName ? 'border-red-400 ring-1 ring-red-400' : ''}`}
 required
 />
 {errors.holidayName && (
 <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.holidayName}</p>
 )}
 <datalist id="holidayNames">
 {["New Year's Day", "Labor Day", "Christmas Day", "Diwali", "Eid al-Fitr", "Independence Day"].map(name => (
 <option key={name} value={name} />
 ))}
 </datalist>
 </div>

 <ModernSelect
 label="Holiday Type"
 name="holidayType"
 value={formData.holidayType}
 onChange={handleChange}
 required
 placeholder="SELECT TYPE"
 error={errors.holidayType}
 options={["National", "Regional", "Religious", "Company-Specific"].map(type => ({
 value: type,
 label: type.toUpperCase()
 }))}
 />

 <ModernDatePicker
 label="Date"
 name="date"
 value={formData.date}
 onChange={handleChange}
 required
 placeholder="Select Date"
 error={errors.date}
 />

 <div className="flex items-center gap-3 p-4 bg-surface/50 dark:bg-slate-800/50 rounded-xl border border-dashed border-border-subtle dark:border-slate-700">
 <input
 type="checkbox"
 id="isRecurring"
 checked={formData.isRecurring}
 onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
 className="w-4 h-4 rounded border-subtle text-brand-primary focus:ring-brand-primary"
 />
 <label htmlFor="isRecurring" className="text-[10px] font-black text-muted dark:text-muted uppercase tracking-widest cursor-pointer select-none">
 RECURRING EVERY YEAR
 </label>
 </div>
 </form>
 </GlassModal>
 );
};

export default AddHolidayModal;