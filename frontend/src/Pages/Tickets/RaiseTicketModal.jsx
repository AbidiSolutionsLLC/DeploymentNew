import React, { useState, useRef } from "react";
import { useSelector } from "react-redux";
import api from "../../axios";
import { toast } from "react-toastify";

const RaiseTicketModal = ({ onClose, onSubmit }) => {
  const [form, setForm] = useState({ subject: "", description: "", attachment: null });
  const [submitting, setSubmitting] = useState(false);
  const modalRef = useRef(null);
  const user = useSelector((state) => state.auth.user);

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({ ...prev, [name]: files ? files[0] : value }));
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const ticketData = new FormData();
      ticketData.append("emailAddress", user?.user?.email);
      ticketData.append("subject", form.subject);
      ticketData.append("description", form.description);
      if (form.attachment) ticketData.append("attachment", form.attachment);

      // --- FIX IS HERE: Removed headers object ---
      const response = await api.post("/tickets", ticketData); 
      // ------------------------------------------

      onSubmit(response.data);
      onClose();
      toast.success("TICKET SUBMITTED SUCCESSFULLY");
    } catch (error) {
      toast.error(error.response?.data?.message || "FAILED TO SUBMIT");
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
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all placeholder:text-slate-300"
              value={form.subject}
              onChange={handleChange}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Detailed Description*</label>
            <textarea
              name="description"
              placeholder="describe issue details"
              rows={4}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all placeholder:text-slate-300 resize-none"
              value={form.description}
              onChange={handleChange}
              required
            />
          </div>

          {/* File Upload */}
          <div className="flex flex-col gap-2 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Attachments</label>
            <input
              name="attachment"
              type="file"
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