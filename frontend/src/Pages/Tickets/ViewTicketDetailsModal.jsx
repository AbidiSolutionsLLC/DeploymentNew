import React, { useRef } from "react";
import { FiPaperclip } from "react-icons/fi";
import api from "../../axios";
import { toast } from "react-toastify";
import { FaDownload } from "react-icons/fa";


const ViewTicketDetailsModal = ({ ticket, onClose }) => {
  const modalRef = useRef(null);

  if (!ticket) return null;

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

    const downloadAttachment = async (ticketId, attachmentId, filename) => {
    try {
      // Use the direct download endpoint
      const response = await api.get(`/tickets/${ticketId}/attachments/${attachmentId}/download`, {
        responseType: 'blob'
      });
      
      // Create blob and download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success(`Downloading ${filename}`);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download file");
    }
  };


    // Handle ticket download
  const handleDownloadAttachment = (ticket) => {
    if (ticket.attachments?.[0]) {
      const attachment = ticket.attachments[0];
      downloadAttachment(ticket._id, attachment._id, attachment.name || attachment.originalname);
    }
  };

  const statusStyles =
    ticket.status === "opened"
      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
      : "bg-rose-50 text-rose-600 border-rose-100";

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex justify-center items-center p-4 sm:p-6"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative flex flex-col max-h-[90vh] animate-fadeIn overflow-hidden"
      >
        {/* Close Cross Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-red-500 transition-all text-2xl font-light z-10"
        >
          &times;
        </button>

        {/* Header */}
        <div className="px-6 py-6 sm:px-10 sm:py-8 border-b border-slate-50 text-center flex-shrink-0">
          <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-widest uppercase">
            TICKET OVERVIEW
          </h2>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 sm:p-10 space-y-6 overflow-y-auto custom-scrollbar">
          <DetailItem label="TICKET ID" value={ticket.ticketID} />
          
          <div className="grid grid-cols-2 gap-4">
            <DetailItem 
              label="CREATED ON" 
              value={new Date(ticket.createdAt).toLocaleDateString()} 
            />
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">
                STATUS
              </label>
              <span className={`inline-block px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border ${statusStyles}`}>
                {ticket.status}
              </span>
            </div>
          </div>

          <DetailItem 
            label="REQUESTER EMAIL" 
            value={ticket.emailAddress || "Not provided"} 
          />
          
          <DetailItem label="SUBJECT" value={ticket.subject} />

          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              DESCRIPTION
            </label>
            <p className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm text-slate-600 font-medium leading-relaxed">
              {ticket.description}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              ATTACHMENT
            </label>
            {ticket.attachments && ticket.attachments.length > 0 ? (
              <button
                onClick={() => handleDownloadAttachment(ticket)}
                className="flex items-center gap-2 text-blue-500 hover:text-blue-600 font-bold text-xs transition-colors"
              >
                <FaDownload className="w-3 h-3" />
                <span className="truncate">{ticket.attachments[0].name?.split('.').pop().toUpperCase() || "FILE"}</span>
              </button>
            ) : (
              <span className="text-[10px] text-slate-300 font-bold uppercase">No file attached</span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-6 sm:px-10 sm:py-8 border-t border-slate-100 bg-white flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 sm:py-4 bg-[#64748b] text-white rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest shadow-lg shadow-slate-100 hover:brightness-110 active:scale-95 transition-all"
          >
            CLOSE OVERVIEW
          </button>
        </div>
      </div>
    </div>
  );
};

// Internal Helper for Detail Items
const DetailItem = ({ label, value }) => (
  <div className="space-y-1">
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
      {label}
    </label>
    <div className="text-sm sm:text-base text-slate-700 font-bold truncate">
      {value}
    </div>
  </div>
);

export default ViewTicketDetailsModal;  