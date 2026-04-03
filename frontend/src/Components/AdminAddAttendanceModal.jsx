import React, { useState, useEffect, useRef } from "react";
import api from "../axios";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { X, Save } from "lucide-react";
import ModernSelect from "./ui/ModernSelect";

export default function AdminAddAttendanceModal({ open, onClose, onSuccess, allUsers }) {
  const [formData, setFormData] = useState({
    user: "",
    checkInTime: null,
    checkOutTime: null,
    status: "Present",
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (open) {
      setFormData({
        user: "",
        checkInTime: new Date(),
        checkOutTime: new Date(),
        status: "Present",
        notes: ""
      });
    }
  }, [open]);

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
  };

  const isValid = formData.user && formData.checkInTime;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    try {
      await api.post("/timetrackers", {
        user: formData.user,
        checkInTime: formData.checkInTime,
        checkOutTime: formData.checkOutTime,
        status: formData.status,
        notes: formData.notes,
        date: formData.checkInTime // use checkInTime as the base date
      });
      toast.success("Attendance record created successfully");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create attendance");
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
            ADD ATTENDANCE RECORD
          </h2>
        </div>

        <form className="p-6 sm:p-10 space-y-5 sm:space-y-6 overflow-y-auto custom-scrollbar" onSubmit={handleSubmit}>
          <div className="relative z-50">
            <ModernSelect
              label="Employee"
              name="user"
              value={formData.user}
              onChange={(e) => setFormData({ ...formData, user: e.target.value })}
              required
              placeholder="Select Employee"
              options={[
                { value: "", label: "Select Employee" },
                ...allUsers.map((u) => ({ value: u._id, label: `${u.name} (${u.email})` }))
              ]}
              className="w-full"
            />
          </div>

          <div className="relative z-40">
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              CHECK IN TIME*
            </label>
            <DatePicker
              selected={formData.checkInTime}
              onChange={(date) => setFormData({ ...formData, checkInTime: date })}
              showTimeSelect
              dateFormat="Pp"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 font-medium"
              popperProps={{ strategy: "fixed" }}
              portalId="portal-root"
              required
            />
          </div>

          <div className="relative z-30">
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              CHECK OUT TIME
            </label>
            <DatePicker
              selected={formData.checkOutTime}
              onChange={(date) => setFormData({ ...formData, checkOutTime: date })}
              showTimeSelect
              dateFormat="Pp"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 font-medium"
              popperProps={{ strategy: "fixed" }}
              portalId="portal-root"
            />
          </div>

          <div className="relative z-20">
            <ModernSelect
              label="Status"
              name="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: "Present", label: "Present" },
                { value: "Half Day", label: "Half Day" },
                { value: "Absent", label: "Absent" },
                { value: "Late", label: "Late" }
              ]}
              className="w-full"
            />
          </div>
          
          <div className="relative z-10">
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              NOTES
            </label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Forgot to punch in"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 font-medium"
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
            {loading ? "SAVING..." : "CREATE RECORD"}
          </button>
        </div>
      </div>
    </div>
  );
}
