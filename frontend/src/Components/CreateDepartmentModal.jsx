import React, { useState, useRef } from "react";
import api from "../axios";
// FIX: Correct import path for components at the root of /Components/
import ModernSelect from "./ui/ModernSelect"; 
import { validateText, validateDescription, sanitizeText } from "../utils/validationUtils";

const CreateDepartmentModal = ({ isOpen, onClose, onDepartmentCreated, potentialManagers = [] }) => {
  const [formData, setFormData] = useState({ name: "", description: "", manager: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef(null);

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

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[9999] flex justify-center items-center p-4" onClick={handleBackdropClick}>
      <div ref={modalRef} className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl relative animate-fadeIn">
        <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-red-500 transition-all text-2xl font-light">&times;</button>

        <div className="px-8 py-6 border-b border-slate-50 text-center">
          <h2 className="text-lg font-black text-slate-800 tracking-widest uppercase">Create Department</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              Department Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full bg-white border ${errors.name ? 'border-red-400' : 'border-slate-200'} rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all`}
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
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={`w-full bg-white border ${errors.description ? 'border-red-400' : 'border-slate-200'} rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 resize-none transition-all`}
              placeholder="Brief description"
              rows="3"
            />
            <div className="flex justify-between items-center mt-1">
              {errors.description ? (
                <p className="text-[10px] text-red-500 font-bold">{errors.description}</p>
              ) : <div />}
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">{formData.description.length}/500</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 font-black text-[11px] text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">Cancel</button>
            <button type="submit" disabled={isLoading} className="flex-1 py-3 bg-[#64748b] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50">
              {isLoading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateDepartmentModal;