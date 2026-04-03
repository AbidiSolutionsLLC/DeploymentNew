import React, { useState, useRef } from "react";
import { useSelector } from "react-redux";
import api from "../../axios";
import { toast } from "react-toastify";
import { validateText, validateDescription, sanitizeText, getApiError } from "../../utils/validationUtils";

const RaiseTicketModal = ({ onClose, onSubmit }) => {
  const [form, setForm] = useState({ subject: "", description: "", attachment: null });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const modalRef = useRef(null);
  const user = useSelector((state) => state.auth.user);

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    const val = files ? files[0] : value;
    setForm((prev) => ({ ...prev, [name]: val }));

    // Inline validation
    if (name === "subject") {
      const error = validateText(val);
      let customError = error;
      if (!error && val.length < 5) customError = "Subject must be at least 5 characters.";
      setErrors(prev => ({ ...prev, subject: customError }));
    }
    if (name === "description") {
      const error = validateDescription(val, { min: 10, max: 1000, required: true });
      setErrors(prev => ({ ...prev, description: error }));
    }
  };

const handleSubmit = async (e) => {
    e.preventDefault();

    // Final validation
    const subjectError = validateText(form.subject);
    let customSubjectError = subjectError;
    if (!subjectError && form.subject.length < 5) customSubjectError = "Subject must be at least 5 characters.";
    
    const descError = validateDescription(form.description, { min: 10, max: 1000, required: true });
    
    if (customSubjectError || descError) {
      setErrors({ subject: customSubjectError, description: descError });
      toast.error("PLEASE FIX VALIDATION ERRORS");
      return;
    }

    setSubmitting(true);
    try {
      const ticketData = new FormData();
      ticketData.append("emailAddress", user?.user?.email);
      ticketData.append("subject", sanitizeText(form.subject));
      ticketData.append("description", sanitizeText(form.description));
      if (form.attachment) ticketData.append("attachment", form.attachment);

      const response = await api.post("/tickets", ticketData); 

      onSubmit(response.data);
      onClose();
      toast.success("TICKET SUBMITTED SUCCESSFULLY");
    } catch (error) {
      toast.error(getApiError(error, "FAILED TO SUBMIT"));
    } finally {
      setSubmitting(false);
    }
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
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 sm:top-5 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-red-500 transition-all text-2xl font-light z-10"
        >
          &times;
        </button>

        {/* Header */}
        <div className="px-6 py-6 sm:px-10 sm:py-8 border-b border-slate-50 text-center flex-shrink-0">
          <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-widest uppercase">
            RAISE A TICKET
          </h2>
          <p className="text-[9px] text-slate-400 font-black tracking-[0.2em] mt-1 uppercase">Customer Support Portal</p>
        </div>

        {/* Form Body */}
        <form 
          id="ticketForm" 
          onSubmit={handleSubmit} 
          className="p-6 sm:p-10 space-y-5 sm:space-y-6 overflow-y-auto custom-scrollbar"
        >
          {/* Subject */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Subject*</label>
            <input
              name="subject"
              placeholder="brief issue summary"
              className={`w-full bg-white border ${errors.subject ? 'border-red-400' : 'border-slate-200'} rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all placeholder:text-slate-300`}
              value={form.subject}
              onChange={handleChange}
              required
            />
            <div className="flex justify-between items-center mt-1">
              {errors.subject ? (
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight">{errors.subject}</p>
              ) : <div />}
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">{form.subject.length}/100</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Detailed Description*</label>
            <textarea
              name="description"
              placeholder="describe issue details"
              rows={4}
              className={`w-full bg-white border ${errors.description ? 'border-red-400' : 'border-slate-200'} rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all placeholder:text-slate-300 resize-none`}
              value={form.description}
              onChange={handleChange}
              required
            />
            <div className="flex justify-between items-center mt-1">
              {errors.description ? (
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight">{errors.description}</p>
              ) : <div />}
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">{form.description.length}/1000</p>
            </div>
          </div>

          {/* File Upload */}
          <div className="flex flex-col gap-2 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Attachments</label>
            <input
              name="attachment"
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,image/png,image/jpeg,image/jpg"
              className="text-[10px] text-slate-400 font-bold file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-slate-200 file:text-slate-600 hover:file:bg-slate-300 cursor-pointer"
              onChange={handleChange}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-6 sm:px-10 sm:py-8 border-t border-slate-100 flex gap-3 sm:gap-4 bg-white flex-shrink-0">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 py-3 sm:py-4 font-black text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
          >
            CANCEL
          </button>
          <button 
            type="submit" 
            form="ticketForm"
            disabled={submitting} 
            className="flex-1 py-3 sm:py-4 bg-[#64748b] text-white rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest shadow-lg shadow-slate-100 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "SUBMITTING..." : "SUBMIT TICKET"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RaiseTicketModal;