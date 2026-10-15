import React, { useState } from "react";
import api from "../../axios";
import { downloadFile } from "../../utils/downloadFile";
import { FaPaperPlane } from "react-icons/fa";
import { PaperClipIcon } from "@heroicons/react/24/solid";
import { Paperclip } from "lucide-react";
import { validateDescription, getApiError } from "../../utils/validationUtils";
import GlassModal from "../../components/ui/GlassModal";
import GlassButton from "../../components/ui/GlassButton";
import {
  resolvePriorityPill,
  priorityLabel,
  statusBadgeClass,
} from "../../components/StatusBadge";

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const DetailItem = ({ label, value }) => (
 <div className="space-y-1">
 <label className="block text-[10px] font-black text-muted uppercase tracking-widest">{label}</label>
 <div className="text-sm sm:text-base text-main font-bold truncate">{value}</div>
 </div>
);

const ViewTicketDetailsModal = ({ ticket: initialTicket, onClose, showToast }) => {
 const [ticket, setTicket] = useState(initialTicket);
 const [commentText, setCommentText] = useState("");
 const [errors, setErrors] = useState({});
 const [sending, setSending] = useState(false);

 if (!ticket) return null;

 const notify = (message, type = "success") => {
  if (typeof showToast === "function") showToast(message, type);
 };

 // --- SEND RESPONSE FUNCTION ---
 const handleSendResponse = async () => {
 const error = validateDescription(commentText, { min: 5, max: 500, required: true });
 if (error) {
 setErrors(prev => ({ ...prev, response: error }));
 return;
 }
 setErrors(prev => ({ ...prev, response: null }));

 setSending(true);
 try {
 const { data: updatedTicket } = await api.post(`/tickets/${ticket._id}/response`, {
 content: commentText
 });

 setTicket(updatedTicket);
 setCommentText("");
 notify("Reply sent!");
 } catch (error) {
 notify(getApiError(error, "Failed to send reply"), "error");
 } finally {
 setSending(false);
 }
 };

  const titleContent = (
    <div>
      <h2 className="text-lg font-black text-heading uppercase tracking-widest">Ticket Overview</h2>
      <p className="text-[10px] text-muted font-bold mt-1">ID: {ticket.ticketID}</p>
    </div>
  );

  return (
    <GlassModal
      isOpen={true}
      onClose={onClose}
      title={titleContent}
      maxWidth="max-w-2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <DetailItem label="Created On" value={formatDateTime(ticket.createdAt)} />
        <div>
          <label className="block text-[10px] font-black text-muted mb-1 uppercase tracking-widest">STATUS</label>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide border whitespace-nowrap ${statusBadgeClass(ticket.status)}`}>
            {ticket.status}
          </span>
        </div>
        <DetailItem label="Subject" value={ticket.subject} />
        <div>
          <label className="block text-[10px] font-black text-muted mb-1 uppercase tracking-widest">PRIORITY</label>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide border ${resolvePriorityPill(ticket.priority)}`}>
            {priorityLabel(ticket.priority)}
          </span>
        </div>
        <DetailItem label="Requester" value={ticket.emailAddress} />
      </div>

      <div className="mb-6">
        <label className="block text-[10px] font-black text-muted mb-2 uppercase tracking-widest">DESCRIPTION</label>
        <div className="bg-surface border border-border-subtle p-4 rounded-xl text-sm text-muted leading-relaxed font-medium">
          {ticket.description}
        </div>
      </div>

      {/* Attachments */}
      {ticket.attachments?.length > 0 && (
        <div className="mb-6 p-4 bg-surface rounded-xl border border-dashed border-border-subtle">
          <label className="block text-[10px] font-black text-muted mb-2 uppercase tracking-widest flex items-center gap-2">
            <PaperClipIcon className="w-3 h-3" /> ATTACHMENTS
          </label>
          <div className="grid gap-2">
            {ticket.attachments.map((file, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.preventDefault(); downloadFile(file.blobName || file.url, file.name); }}
                className="w-full flex items-center justify-between p-3 bg-surface rounded-xl border border-border-subtle hover:bg-amber-50 dark:bg-amber-900/30 hover:border-amber-200 dark:border-amber-800/50 transition-all group cursor-pointer text-left"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
                    {file.name.split('.').pop().toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-main truncate">{file.name}</span>
                </div>
                <div className="text-muted group-hover:text-amber-600 dark:text-amber-400">
                  <Paperclip size={16}/>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* --- DISCUSSION --- */}
      <div className="border-t border-border-subtle pt-6">
        <h3 className="text-xs font-black text-muted uppercase tracking-widest mb-4">DISCUSSION HISTORY</h3>

        <div className="space-y-4 mb-4">
          {ticket.responses?.length > 0 ? (
            ticket.responses.map((res, i) => (
              <div key={i} className="bg-surface border border-border-subtle p-4 rounded-2xl shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-bold">
                      {res.author?.charAt(0)}
                    </div>
                    <span className="text-xs font-bold text-heading">{res.author}</span>
                  </div>
                  <span className="text-[10px] text-muted font-medium">
                    {formatDateTime(res.time)}
                  </span>
                </div>
                <p className="text-sm text-muted pl-8">{res.content}</p>
              </div>
            ))
          ) : (
            <p className="text-center text-xs text-muted italic py-4">No messages yet.</p>
          )}
        </div>

        {/* Message Input */}
        <div className="relative">
          <textarea
            value={commentText}
            onChange={(e) => {
              setCommentText(e.target.value);
              if (errors.response) setErrors(prev => ({ ...prev, response: null }));
            }}
            placeholder="Type your reply..."
            className={`w-full bg-surface border ${errors.response ? 'border-red-400' : 'border-border-subtle'} rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-100 resize-none h-14 transition-all`}
          />
          <div className="flex justify-between items-center mt-1 px-1">
            {errors.response ? (
              <p className="text-[10px] text-red-500 font-bold">{errors.response}</p>
            ) : <div />}
            <p className="text-[10px] text-muted uppercase tracking-widest">{commentText.length}/500</p>
          </div>
          <GlassButton
            onClick={handleSendResponse}
            disabled={sending || !commentText.trim()}
            isLoading={sending}
            icon={FaPaperPlane}
            size="sm"
            aria-label="Send reply"
            className="!absolute right-2 top-2 !px-2.5 !py-2.5 rounded-xl"
          />
        </div>
      </div>
    </GlassModal>
  );
};

export default ViewTicketDetailsModal;
