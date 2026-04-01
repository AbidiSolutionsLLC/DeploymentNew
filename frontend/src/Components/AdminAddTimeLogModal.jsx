import React, { useState, useEffect, useRef } from "react";
import api from "../axios";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { X } from "lucide-react";

export default function AdminAddTimeLogModal({ open, onClose, onSuccess, allUsers }) {
  const [formData, setFormData] = useState({
    employeeId: "",
    job: "",
    date: new Date(),
    description: "",
    hours: ""
  });
  const [loading, setLoading] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (open) {
      setFormData({
        employeeId: "",
        job: "",
        date: new Date(),
        description: "",
        hours: ""
      });
    }
  }, [open]);

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
  };

  const isValid = formData.employeeId && formData.job && formData.date && formData.description && formData.hours > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    try {
      await api.post("/time-logs", {
        employeeId: formData.employeeId,
        job: formData.job,
        date: formData.date.toISOString().split('T')[0],
        description: formData.description,
        hours: parseFloat(formData.hours)
      });
      toast.success("Time log created successfully");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create time log");
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
            ADD TASK TIME LOG
          </h2>
        </div>

        <form className="p-6 sm:p-10 space-y-5 sm:space-y-6 overflow-y-auto custom-scrollbar" onSubmit={handleSubmit}>
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              EMPLOYEE*
            </label>
            <select
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 font-medium"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              required
            >
              <option value="">Select Employee</option>
              {allUsers.map(u => (
                <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              JOB / TASK TITLE*
            </label>
            <input
              type="text"
              value={formData.job}
              onChange={(e) => setFormData({ ...formData, job: e.target.value })}
              placeholder="e.g. Website Overhaul"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              DATE*
            </label>
            <DatePicker
              selected={formData.date}
              onChange={(date) => setFormData({ ...formData, date: date })}
              dateFormat="yyyy-MM-dd"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 font-medium"
              popperProps={{ strategy: "fixed" }}
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              HOURS WORKED*
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
              placeholder="e.g. 4.5"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 font-medium"
              required
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              DESCRIPTION*
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What did this person work on?"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 min-h-[80px]"
              required
            />
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
            disabled={!isValid || loading}
            className="flex-[2] py-4 bg-[#64748b] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg disabled:opacity-50"
          >
            {loading ? "SAVING..." : "CREATE LOG"}
          </button>
        </div>
      </div>
    </div>
  );
}
