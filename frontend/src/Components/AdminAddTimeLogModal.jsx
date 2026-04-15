import React, { useState, useEffect, useRef } from "react";
import api from "../axios";
import { toast } from "react-toastify";
import { X } from "lucide-react";
import ModernSelect from "./ui/ModernSelect";
import ModernDatePicker from "./ui/ModernDatePicker";
import {
  validateDescription,
  validateText,
  validateNumeric,
  sanitizeText,
  getApiError,
} from "../utils/validationUtils";

export default function AdminAddTimeLogModal({ open, onClose, onSuccess, allUsers }) {
  const [formData, setFormData] = useState({
    employeeId: "",
    job: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    hours: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (open) {
      setFormData({
        employeeId: "",
        job: "",
        date: new Date().toISOString().split("T")[0],
        description: "",
        hours: "",
      });
      setErrors({});
    }
  }, [open]);

  const handleBackdropClick = (e) => {
    if (e.target.closest("#portal-root") || e.target.closest(".react-datepicker")) return;
    if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
  };

  const validateField = (name, value) => {
    switch (name) {
      case "employeeId":
        return value ? null : "Please select an employee.";
      case "job":
        return validateText(value);
      case "date":
        return value ? null : "Please select a valid date.";
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

  const isValid = !Object.values({
    employeeId: validateField("employeeId", formData.employeeId),
    job: validateField("job", formData.job),
    date: validateField("date", formData.date),
    hours: validateField("hours", formData.hours),
    description: validateField("description", formData.description),
  }).some(Boolean);

  const handleChange = (name, value) => {
    const updatedForm = { ...formData, [name]: value };
    setFormData(updatedForm);
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) {
      toast.error("Please fix validation errors before submitting.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/time-logs", {
        employeeId: formData.employeeId,
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

  if (!open) return null;

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
            ADD TIME LOG (ADMIN)
          </h2>
        </div>

        <form className="p-6 sm:p-10 space-y-5 sm:space-y-6 overflow-y-auto custom-scrollbar" onSubmit={handleSubmit}>
          {/* Employee Select */}
          <div className="relative z-50">
            <ModernSelect
              label="Select Employee"
              name="employeeId"
              value={formData.employeeId}
              onChange={(e) => handleChange("employeeId", e.target.value)}
              required
              placeholder="Select Employee"
              options={[
                { value: "", label: "Select Employee" },
                ...allUsers.map((u) => ({ value: u._id, label: `${u.name} (${u.email})` })),
              ]}
              className="w-full"
            />
            {errors.employeeId && (
              <p className="text-xs text-red-500 mt-1">{errors.employeeId}</p>
            )}
          </div>

          {/* Job/Task Name */}
          <div className="relative z-40">
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              TASK/JOB NAME*
            </label>
            <input
              type="text"
              name="job"
              value={formData.job}
              onChange={(e) => handleChange("job", e.target.value)}
              onBlur={() => setErrors((prev) => ({ ...prev, job: validateField("job", formData.job) }))}
              placeholder="e.g. Website Overhaul"
              className={`w-full bg-white border ${errors.job ? "border-red-400" : "border-slate-200"} rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 font-medium`}
            />
            {errors.job && <p className="text-xs text-red-500 mt-1">{errors.job}</p>}
          </div>

          {/* Date */}
          <div className="relative z-30">
            <ModernDatePicker
              label="DATE"
              name="date"
              value={formData.date}
              onChange={(e) => handleChange("date", e.target.value)}
              required
            />
            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
          </div>

          {/* Hours */}
          <div className="relative z-20">
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
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
              className={`w-full bg-white border ${errors.hours ? "border-red-400" : "border-slate-200"} rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 font-medium`}
            />
            {errors.hours && <p className="text-xs text-red-500 mt-1">{errors.hours}</p>}
          </div>

          {/* Description */}
          <div className="relative z-10">
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              DESCRIPTION* <span className="normal-case font-normal text-slate-300">(min 10, max 300 chars)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              onBlur={() =>
                setErrors((prev) => ({ ...prev, description: validateField("description", formData.description) }))
              }
              placeholder="Describe what this person worked on in detail..."
              className={`w-full bg-white border ${errors.description ? "border-red-400" : "border-slate-200"} rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 min-h-[80px]`}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.description ? (
                <p className="text-xs text-red-500">{errors.description}</p>
              ) : (
                <span />
              )}
              <p className="text-xs text-slate-400 text-right">{formData.description.length}/300</p>
            </div>
          </div>
        </form>

        <div className="px-6 py-6 sm:px-10 sm:py-8 border-t border-slate-100 flex gap-3 sm:gap-4 bg-white flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest"
          >
            CANCEL
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-[2] py-4 bg-[#64748b] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg disabled:opacity-50"
          >
            {loading ? "SAVING..." : "CREATE LOG"}
          </button>
        </div>
      </div>
    </div>
  );
}
