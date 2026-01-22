import React, { useRef } from "react";
import { FaDownload } from 'react-icons/fa';

const ViewTimeLogModal = ({ log, onClose }) => {
  const modalRef = useRef(null);

  if (!log) return null;

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  const getDownloadLink = (fileName) => {
    return `/uploads/${fileName}`;
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
        {/* Close Cross */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-red-500 transition-all text-2xl font-light z-10"
        >
          &times;
        </button>

        {/* Header */}
        <div className="px-6 py-6 sm:px-10 sm:py-8 border-b border-slate-50 text-center flex-shrink-0">
          <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-widest uppercase">
            VIEW TIME LOG
          </h2>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-10 space-y-5 sm:space-y-6 overflow-y-auto custom-scrollbar">
          {/* Job Title */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              JOB TITLE
            </label>
            <p className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium">
              {log.jobTitle || "-"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                DATE
              </label>
              <p className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium">
                {log.date ? new Date(log.date).toLocaleDateString('en-GB') : "-"}
              </p>
            </div>
            {/* Hours */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                HOURS
              </label>
              <p className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium">
                {log.totalHours || "-"}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              DESCRIPTION
            </label>
            <div className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium whitespace-pre-line min-h-[100px]">
              {log.description || "-"}
            </div>
          </div>

          {/* Attachment */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              ATTACHMENT
            </label>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 truncate mr-4">
                {log.attachments?.[0]?.originalname || "No attachment"}
              </span>
              {log.attachments?.[0] && (
                <a
                  href={getDownloadLink(log.attachments[0].originalname)}
                  download
                  className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-slate-400 hover:text-[#64748b] shadow-sm transition-colors"
                >
                  <FaDownload size={14} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-6 sm:px-10 sm:py-8 border-t border-slate-100 flex bg-white flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 sm:py-4 bg-[#64748b] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-100 hover:brightness-110 active:scale-95 transition-all"
          >
            CLOSE VIEW
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewTimeLogModal;