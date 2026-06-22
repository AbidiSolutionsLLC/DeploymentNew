import React, { useRef } from 'react';
import { Paperclip } from 'lucide-react';
import { downloadFile } from "../../utils/downloadFile";

import GlassModal from "../../components/ui/GlassModal";

const ViewTimeLogModal = ({ log, onClose }) => {
 const modalRef = useRef(null);

 if (!log) return null;

 const handleBackdropClick = (e) => {
 if (modalRef.current && !modalRef.current.contains(e.target)) {
 onClose();
 }
 };

 const footer = (
 <div className="flex w-full">
 <button
 onClick={onClose}
 className="w-full py-3 bg-brand-primary text-white rounded-xl font-bold text-xs uppercase hover:bg-brand-primary/90 active:scale-95 transition-all"
 >
 Close View
 </button>
 </div>
 );

 return (
 <GlassModal isOpen={!!log} onClose={onClose} title="View Time Log" footer={footer}>
 <div className="space-y-6">
 {/* Job Title */}
 <div>
 <label className="block text-xs font-bold text-muted mb-2 uppercase">Job Title</label>
 <p className="w-full bg-surface/50 border border-border-subtle rounded-xl px-4 py-3 text-sm text-heading font-medium">
 {log.jobTitle || "-"}
 </p>
 </div>

 <div className="grid grid-cols-2 gap-4">
 {/* Date */}
 <div>
 <label className="block text-xs font-bold text-muted mb-2 uppercase">Date</label>
 <p className="w-full bg-surface/50 border border-border-subtle rounded-xl px-4 py-3 text-sm text-heading font-medium">
 {log.date ? new Date(log.date).toLocaleDateString('en-GB') : "-"}
 </p>
 </div>
 {/* Hours */}
 <div>
 <label className="block text-xs font-bold text-muted mb-2 uppercase">Hours</label>
 <p className="w-full bg-surface/50 border border-border-subtle rounded-xl px-4 py-3 text-sm text-heading font-medium">
 {log.totalHours || "-"}
 </p>
 </div>
 </div>

 {/* Description */}
 <div>
 <label className="block text-xs font-bold text-muted mb-2 uppercase">Description</label>
 <div className="w-full bg-surface/50 border border-border-subtle rounded-xl px-4 py-3 text-sm text-heading font-medium whitespace-pre-line min-h-[100px]">
 {log.description || "-"}
 </div>
 </div>

 <div>
 <label className="block text-xs font-bold text-muted mb-2 uppercase">Attachment</label>
 {log.attachments?.[0] ? (
 <button
 onClick={() => downloadFile(log.attachments[0].blobName || log.attachments[0].url || log.attachments[0].path, log.attachments[0].originalname)}
 className="w-full flex items-center justify-between p-3 bg-surface/50 rounded-xl border border-border-subtle hover:bg-brand-primary/10 hover:border-brand-primary/30 transition-all group text-left"
 >
 <div className="flex items-center gap-2 overflow-hidden">
 <div className="w-8 h-8 bg-brand-primary/20 text-brand-primary rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
 {log.attachments[0].originalname?.split('.').pop().toUpperCase() || "FILE"}
 </div>
 <span className="text-xs font-bold text-heading truncate">
 {log.attachments[0].originalname || "Attachment"}
 </span>
 </div>
 <div className="text-muted group-hover:text-brand-primary">
 <Paperclip size={16} />
 </div>
 </button>
 ) : (
 <div className="p-4 bg-surface/50 rounded-xl border border-dashed border-border-subtle text-center">
 <span className="text-xs font-bold text-muted uppercase tracking-tight">
 No attachment found
 </span>
 </div>
 )}
 </div>
 </div>
 </GlassModal>
 );
};

export default ViewTimeLogModal;