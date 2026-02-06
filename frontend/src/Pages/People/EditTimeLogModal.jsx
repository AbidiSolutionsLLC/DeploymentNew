import React, { useState, useEffect, useRef } from "react";
import timeLogApi from "../../api/timeLogApi";
import { toast } from "react-toastify";
import { moment, TIMEZONE } from "../../utils/dateUtils";

const EditTimeLogModal = ({ isOpen, onClose, initialData, timeLogId, onTimeLogUpdated }) => {
  const [date, setDate] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [hours, setHours] = useState("");
  const [description, setDescription] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [newAttachment, setNewAttachment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      // FIX: Ensure date is formatted as YYYY-MM-DD string for the input
      const formattedDate = moment(initialData.date).tz(TIMEZONE).format('YYYY-MM-DD');
      setDate(formattedDate || "");
      setJobTitle(initialData.job || initialData.jobTitle || "");
      setHours(initialData.hours || initialData.totalHours || "");
      setDescription(initialData.description || "");
      setAttachmentName(initialData.attachments?.[0]?.originalname || initialData.attachmentName || "");
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
  };

  const isCurrentInputValid = Boolean(date) && Number(hours) > 0 && description.trim().length >= 5;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isCurrentInputValid || !timeLogId) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('job', jobTitle);
      formData.append('date', date); // Send raw string
      formData.append('hours', hours);
      formData.append('description', description);
      if (newAttachment) formData.append('attachments', newAttachment);

      await timeLogApi.updateTimeLog(timeLogId, formData);
      toast.success("Log updated successfully");
      onTimeLogUpdated();
      onClose();
    } catch (error) {
      console.error("Failed to update time log:", error);
      toast.error("Update failed");
    } finally {
      setIsLoading(false);
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
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-red-500 transition-all text-2xl font-light z-10"
        >
          &times;
        </button>

        <div className="px-6 py-6 sm:px-10 sm:py-8 border-b border-slate-50 text-center flex-shrink-0">
          <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-widest uppercase">
            EDIT TIME LOG
          </h2>
        </div>

        <form id="editLogForm" onSubmit={handleSave} className="p-6 sm:p-10 space-y-6 overflow-y-auto custom-scrollbar">
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">JOB TITLE</label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">DATE*</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">HOURS*</label>
              <input
                type="number"
                step="0.1"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">DESCRIPTION*</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100"
              required
            />
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <label className="block text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">ATTACHMENT</label>
            <input
              type="file"
              onChange={(e) => setNewAttachment(e.target.files[0])}
              className="text-[11px] text-slate-400 file:mr-4 file:py-1 file:px-3 file:rounded-full file:bg-slate-200 file:text-slate-600 cursor-pointer"
            />
            {attachmentName && !newAttachment && (
              <p className="text-[10px] font-bold text-slate-400 mt-2 truncate">CURRENT: {attachmentName}</p>
            )}
          </div>
        </form>

        <div className="px-6 py-6 sm:px-10 sm:py-8 border-t border-slate-100 flex gap-4 bg-white flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest">CANCEL</button>
          <button
            type="submit"
            form="editLogForm"
            disabled={isLoading || !isCurrentInputValid}
            className="flex-1 py-4 bg-[#64748b] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg disabled:opacity-50"
          >
            {isLoading ? "SAVING..." : "UPDATE LOG"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTimeLogModal;
