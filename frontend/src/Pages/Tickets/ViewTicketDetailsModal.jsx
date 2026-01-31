import React, { useRef, useState } from "react";
import api from "../../axios";
import { toast } from "react-toastify";
import { FaDownload, FaPaperPlane } from "react-icons/fa";
import { XMarkIcon, PaperClipIcon } from "@heroicons/react/24/solid";
import { format } from "date-fns";

const DetailItem = ({ label, value }) => (
  <div className="space-y-1">
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
    <div className="text-sm sm:text-base text-slate-700 font-bold truncate">{value}</div>
  </div>
);

const ViewTicketDetailsModal = ({ ticket: initialTicket, onClose }) => {
  const [ticket, setTicket] = useState(initialTicket);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const modalRef = useRef(null);

  if (!ticket) return null;

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
  };

  const getDownloadUrl = (ticketId, attachmentId) => 
    `http://localhost:4000/api/web/tickets/${ticketId}/attachment/${attachmentId}`;

  // --- SEND RESPONSE FUNCTION ---
  const handleSendResponse = async () => {
    if (!commentText.trim()) return;
    setSending(true);
    try {
      // Get current user info for optimistic update (optional) or just wait for server
      const { data: updatedTicket } = await api.post(`/tickets/${ticket._id}/response`, {
        content: commentText
      });
      
      setTicket(updatedTicket); // Update local state with new response
      setCommentText("");
      toast.success("Reply sent!");
    } catch (error) {
      toast.error("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const statusStyles = ticket.status?.toLowerCase() === "open"
      ? "bg-emerald-50 text-emerald-600 border-emerald-100"
      : ticket.status?.toLowerCase() === "in progress" 
        ? "bg-purple-50 text-purple-600 border-purple-100"
        : "bg-gray-50 text-gray-600 border-gray-100";

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex justify-center items-center p-4 sm:p-6" onClick={handleBackdropClick}>
      <div ref={modalRef} className="w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl relative flex flex-col max-h-[90vh] animate-fadeIn overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center bg-white z-10">
          <div>
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest">TICKET OVERVIEW</h2>
            <p className="text-[10px] text-slate-400 font-bold mt-1">ID: {ticket.ticketID}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <DetailItem label="Created On" value={new Date(ticket.createdAt).toLocaleDateString()} />
            <div>
              <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest">STATUS</label>
              <span className={`inline-block px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border ${statusStyles}`}>{ticket.status}</span>
            </div>
            <DetailItem label="Subject" value={ticket.subject} />
            <DetailItem label="Requester" value={ticket.emailAddress} />
          </div>

          <div className="mb-6">
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">DESCRIPTION</label>
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm text-slate-600 leading-relaxed font-medium">
              {ticket.description}
            </div>
          </div>

          {/* Attachments */}
          {ticket.attachments?.length > 0 && (
            <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                <PaperClipIcon className="w-3 h-3" /> ATTACHMENTS
              </label>
              <div className="grid gap-2">
                {ticket.attachments.map((file, idx) => (
                  <a key={idx} href={getDownloadUrl(ticket._id, file._id)} target="_blank" rel="noreferrer"
                    className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg hover:border-blue-400 transition-colors group">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded flex items-center justify-center text-[10px] font-bold shrink-0">
                        {file.name.split('.').pop().toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-slate-700 truncate">{file.name}</span>
                    </div>
                    <FaDownload className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* --- TRIANGULAR CHAT SECTION --- */}
          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">DISCUSSION HISTORY</h3>
            
            {/* Message List */}
            <div className="space-y-4 mb-4">
              {ticket.responses?.length > 0 ? (
                ticket.responses.map((res, i) => (
                  <div key={i} className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                          {res.author.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-slate-800">{res.author}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {format(new Date(res.time), "MMM dd, HH:mm")}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 pl-8">{res.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-slate-400 italic py-4">No messages yet.</p>
              )}
            </div>

            {/* Message Input */}
            <div className="relative">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Type your reply..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none h-14"
              />
              <button
                onClick={handleSendResponse}
                disabled={sending || !commentText.trim()}
                className="absolute right-2 top-2 p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-all"
              >
                {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <FaPaperPlane className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewTicketDetailsModal;