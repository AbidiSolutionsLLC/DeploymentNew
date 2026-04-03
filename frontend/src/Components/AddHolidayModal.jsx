import React, { useState, useRef } from "react";
import holidayApi from "../api/holidayApi";
// FIX: Changed from "../ui/" to "./ui/"
import ModernSelect from "./ui/ModernSelect"; 
import ModernDatePicker from "./ui/ModernDatePicker"; 
import { validateText, sanitizeText } from "../utils/validationUtils";

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
  const modalRef = useRef(null);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    // If clicking inside the date picker portal, don't close the modal
    if (
      e.target.closest("#portal-root") ||
      e.target.closest(".react-datepicker") ||
      e.target.closest(".react-datepicker-popper")
    ) {
      return;
    }
  
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      handleClose();
    }
  };

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
    e.preventDefault();

    // Check errors
    const nameError = validateText(formData.holidayName);
    let finalNameError = nameError;
    if (!nameError && formData.holidayName.length < 2) finalNameError = "Must be at least 2 characters.";
    if (!nameError && !/^[a-zA-Z\s'-]+$/.test(formData.holidayName)) finalNameError = "Only letters allowed.";
    
    if (finalNameError || !formData.holidayType || !formData.date) {
      setErrors(prev => ({ ...prev, holidayName: finalNameError }));
      return;
    }

    setLoading(true);
    try {
      // Ensure date is valid before processing
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
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData(initialFormState);
    setIsOpen(false);
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex justify-center items-center p-4 sm:p-6" 
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef} 
        className="w-full max-w-md bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative flex flex-col max-h-[90vh] animate-fadeIn overflow-hidden"
      >
        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 sm:top-5 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-red-500 transition-all text-2xl font-light z-10"
        >
          &times;
        </button>

        <div className="px-6 py-6 sm:px-10 sm:py-8 border-b border-slate-50 text-center flex-shrink-0">
          <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-widest uppercase">
            ADD HOLIDAY
          </h2>
        </div>

        <form 
          id="holidayForm" 
          className="p-6 sm:p-10 space-y-5 sm:space-y-6 overflow-y-auto custom-scrollbar" 
          onSubmit={handleSubmit}
        >
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              HOLIDAY NAME*
            </label>
            <input
              list="holidayNames"
              name="holidayName"
              placeholder="Enter holiday name"
              value={formData.holidayName}
              onChange={handleChange}
              className={`w-full bg-white border ${errors.holidayName ? 'border-red-400' : 'border-slate-200'} rounded-xl px-4 py-3 text-sm sm:text-base text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300`}
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
          />

          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <input
              type="checkbox"
              id="isRecurring"
              checked={formData.isRecurring}
              onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-300 text-[#64748b] focus:ring-[#64748b]"
            />
            <label htmlFor="isRecurring" className="text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer select-none">
              RECURRING EVERY YEAR
            </label>
          </div>
        </form>

        <div className="px-6 py-6 sm:px-10 sm:py-8 border-t border-slate-100 flex gap-3 sm:gap-4 bg-white flex-shrink-0">
          <button 
            type="button" 
            onClick={handleClose} 
            className="flex-1 py-3 sm:py-4 font-black text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
          >
            CANCEL
          </button>
          <button 
            type="submit" 
            form="holidayForm"
            disabled={loading}
            className="flex-1 py-3 sm:py-4 bg-[#64748b] text-white rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest shadow-lg shadow-slate-100 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "SUBMITTING..." : "SAVE HOLIDAY"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddHolidayModal;