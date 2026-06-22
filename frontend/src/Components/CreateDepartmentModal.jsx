import React, { useState } from "react";
import api from "../axios";
import ModernSelect from "./ui/ModernSelect"; 
import { validateText, validateDescription, sanitizeText } from "../utils/validationUtils";
import GlassModal from "./ui/GlassModal";
import GlassButton from "./ui/GlassButton";

const CreateDepartmentModal = ({ isOpen, onClose, onDepartmentCreated, potentialManagers = [] }) => {
 const [formData, setFormData] = useState({ name: "", description: "", manager: "" });
 const [errors, setErrors] = useState({});
 const [isLoading, setIsLoading] = useState(false);

 const handleSubmit = async (e) => {
 e.preventDefault();
 
 // Validate
 const nameError = validateText(formData.name);
 let customNameError = nameError;
 if (!nameError && formData.name.length < 2) customNameError = "Must be at least 2 characters.";
 if (!nameError && !/^[a-zA-Z\s'-]+$/.test(formData.name)) customNameError = "Only letters allowed.";
 
 const descError = validateDescription(formData.description, { max: 500, required: false });
 
 if (customNameError || descError) {
 setErrors({ name: customNameError, description: descError });
 return;
 }

 setIsLoading(true);
 try {
 await api.post("/departments", {
 ...formData,
 name: sanitizeText(formData.name),
 description: sanitizeText(formData.description)
 });
 onDepartmentCreated();
 onClose();
 setFormData({ name: "", description: "", manager: "" });
 setErrors({});
 } catch (error) {
 console.error("Failed to create department:", error);
 } finally {
 setIsLoading(false);
 }
 };

 const handleChange = (e) => {
 const { name, value } = e.target;
 setFormData(prev => ({ ...prev, [name]: value }));
 
 // Inline validation
 if (name === "name") {
 const error = validateText(value);
 let customError = error;
 if (!error && value.length < 2) customError = "Must be at least 2 characters.";
 if (!error && !/^[a-zA-Z\s'-]+$/.test(value)) customError = "Only letters allowed.";
 setErrors(prev => ({ ...prev, name: customError }));
 }
 if (name === "description") {
 const error = validateDescription(value, { max: 500, required: false });
 setErrors(prev => ({ ...prev, description: error }));
 }
 };

 return (
 <GlassModal
 isOpen={isOpen}
 onClose={onClose}
 title="Create Department"
 maxWidth="max-w-md"
 footer={
 <>
 <GlassButton variant="ghost" onClick={onClose}>
 Cancel
 </GlassButton>
 <GlassButton variant="primary" onClick={handleSubmit} isLoading={isLoading}>
 {isLoading ? "Creating..." : "Create"}
 </GlassButton>
 </>
 }
 >
 <form onSubmit={handleSubmit} className="space-y-4">
 <div>
 <label className="block text-[10px] font-black text-muted dark:text-muted mb-2 uppercase tracking-widest">
 Department Name <span className="text-red-500">*</span>
 </label>
 <input
 type="text"
 name="name"
 value={formData.name}
 onChange={handleChange}
 className={`glass-input w-full ${errors.name ? 'border-red-400 ring-1 ring-red-400' : ''}`}
 placeholder="e.g. Engineering"
 required
 />
 {errors.name && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.name}</p>}
 </div>

 <ModernSelect
 label="Department Manager"
 name="manager"
 value={formData.manager}
 onChange={handleChange}
 placeholder="NO MANAGER"
 options={potentialManagers.map(mgr => ({
 value: mgr._id,
 label: `${mgr.name.toUpperCase()} (${mgr.designation || "NO TITLE"})`
 }))}
 error={errors.manager}
 />

 <div>
 <label className="block text-[10px] font-black text-muted dark:text-muted mb-2 uppercase tracking-widest">
 Description
 </label>
 <textarea
 name="description"
 value={formData.description}
 onChange={handleChange}
 className={`glass-input w-full resize-none ${errors.description ? 'border-red-400 ring-1 ring-red-400' : ''}`}
 placeholder="Brief description"
 rows="3"
 />
 <div className="flex justify-between items-center mt-1">
 {errors.description ? (
 <p className="text-[10px] text-red-500 font-bold">{errors.description}</p>
 ) : <div />}
 <p className="text-[10px] text-muted uppercase tracking-widest">{formData.description.length}/500</p>
 </div>
 </div>
 </form>
 </GlassModal>
 );
};

export default CreateDepartmentModal;