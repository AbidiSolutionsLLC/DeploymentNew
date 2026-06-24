import React, { useState, useRef } from "react";
import { useSelector } from "react-redux";
import api from "../../axios";
import { toast } from "react-toastify";
import { validateText, validateDescription, validateDescriptionAllErrors, sanitizeText, getApiError } from "../../utils/validationUtils";
import GlassModal from "../../components/ui/GlassModal";

const RaiseTicketModal = ({ onClose, onSubmit }) => {
 const [form, setForm] = useState({ subject: "", description: "", attachments: [] });
 const [errors, setErrors] = useState({});
 const [submitting, setSubmitting] = useState(false);
 const [showConfirmDialog, setShowConfirmDialog] = useState(false);
 const modalRef = useRef(null);
 const fileInputRef = useRef(null);
 const user = useSelector((state) => state.auth.user);
 const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB limit
 const MAX_FILES = 5;

 // Check if form has unsaved changes
 const hasUnsavedChanges = () => {
 return form.subject.trim().length > 0 ||
 form.description.trim().length > 0 ||
 form.attachments.length > 0;
 };

 const handleCancelClick = () => {
 if (hasUnsavedChanges()) {
 setShowConfirmDialog(true);
 } else {
 onClose();
 }
 };

 const handleConfirmLeave = () => {
 setShowConfirmDialog(false);
 onClose();
 };

 const handleConfirmStay = () => {
 setShowConfirmDialog(false);
 };

 const handleBackdropClick = (e) => {
 if (showConfirmDialog) return;
 if (modalRef.current && !modalRef.current.contains(e.target)) {
 handleCancelClick();
 }
 };

 const handleChange = (e) => {
 const { name, value, files } = e.target;
 
 // For text inputs
 if (!files) {
 setForm((prev) => ({ ...prev, [name]: value }));
 
 // Inline validation
 if (name === "subject") {
 setErrors(prev => ({ ...prev, subject: validateText(value) }));
 }
 if (name === "description") {
 setErrors(prev => ({ ...prev, description: validateDescription(value, { required: true }) }));
 }
 return;
 }

 // For file inputs
 if (name === "attachment" && files && files.length > 0) {
 const newFiles = Array.from(files);
 const validFiles = [];
 const duplicates = [];
 const oversized = [];

 // Check each file
 for (const file of newFiles) {
 // Check for duplicates
 const isDuplicate = form.attachments.some(
 existing => existing.name === file.name && existing.size === file.size
 );
 if (isDuplicate) {
 duplicates.push(file.name);
 continue;
 }

 // Check file size
 if (file.size > MAX_FILE_SIZE) {
 oversized.push(file.name);
 continue;
 }

 validFiles.push(file);
 }

 // Check total file count
 if (form.attachments.length + validFiles.length > MAX_FILES) {
 setErrors(prev => ({
 ...prev,
 attachment: `Maximum ${MAX_FILES} files allowed. You can add ${MAX_FILES - form.attachments.length} more file(s).`
 }));
 return;
 }

 // Show errors
 if (duplicates.length > 0) {
 setErrors(prev => ({
 ...prev,
 attachment: `File(s) already attached: ${duplicates.join(", ")}`
 }));
 } else if (oversized.length > 0) {
 const limitMB = MAX_FILE_SIZE / (1024 * 1024);
 setErrors(prev => ({
 ...prev,
 attachment: `File size exceeds ${limitMB} MB limit: ${oversized.join(", ")}`
 }));
 } else {
 setErrors(prev => ({ ...prev, attachment: null }));
 }

 // Add valid files to attachments
 if (validFiles.length > 0) {
 setForm(prev => ({
 ...prev,
 attachments: [...prev.attachments, ...validFiles]
 }));
 }

 // Clear the file input
 e.target.value = null;
 }
 };

 const removeAttachment = (index) => {
 setForm(prev => ({
 ...prev,
 attachments: prev.attachments.filter((_, i) => i !== index)
 }));
 setErrors(prev => ({ ...prev, attachment: null }));
 
 // Clear the file input to allow re-selecting the same file
 if (fileInputRef.current) {
 fileInputRef.current.value = null;
 }
 };

const handleSubmit = async (e) => {
 e.preventDefault();

 // Final validation
 const subjectError = validateText(form.subject);
 const descError = validateDescription(form.description, { required: true });

 if (subjectError || descError) {
 setErrors({ 
 subject: subjectError, 
 description: descError 
 });
 toast.error("PLEASE FIX VALIDATION ERRORS");
 return;
 }

 setSubmitting(true);
 try {
 const ticketData = new FormData();
 ticketData.append("emailAddress", user?.user?.email);
 ticketData.append("subject", sanitizeText(form.subject));
 ticketData.append("description", sanitizeText(form.description));
 
 // Append all attachments
 form.attachments.forEach(file => {
 ticketData.append("attachments", file);
 });

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
    <>
      <GlassModal
        isOpen={true}
        onClose={handleCancelClick}
        title={
          <div>
            <div className="text-base sm:text-lg font-black text-heading tracking-widest uppercase">
              RAISE A TICKET
            </div>
            <p className="text-[9px] text-muted font-black tracking-[0.2em] mt-1 uppercase">Customer Support Portal</p>
          </div>
        }
        footer={
          <div className="flex w-full gap-3 sm:gap-4">
            <button
              type="button"
              onClick={handleCancelClick}
              className="btn-ghost flex-1 text-muted"
            >
              CANCEL
            </button>
            <button
              type="submit"
              form="ticketForm"
              disabled={submitting}
              className="flex-1 sm:py-4 text-[10px] sm:text-[11px] shadow-slate-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed btn btn-primary"
            >
              {submitting ? "SUBMITTING..." : "SUBMIT TICKET"}
            </button>
          </div>
        }
        maxWidth="max-w-md"
      >
        <form 
          id="ticketForm" 
          onSubmit={handleSubmit} 
          className="space-y-5 sm:space-y-6"
        >
          {/* Subject */}
          <div>
            <label className="block text-xs font-bold text-muted mb-2 uppercase">Subject*</label>
            <input
              name="subject"
              placeholder="e.g. Cannot access dashboard"
              className={`w-full bg-surface/50 border ${errors.subject ? 'border-red-400' : 'border-border-subtle'} rounded-xl px-4 py-3 text-sm text-heading outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all`}
              value={form.subject}
              onChange={handleChange}
              required
            />
            <div className="flex justify-between items-center mt-1">
              {errors.subject ? (
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight">{errors.subject}</p>
              ) : <div />}
              <p className="text-[10px] text-muted uppercase tracking-widest">{form.subject.length}/100</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-muted mb-2 uppercase">Detailed Description*</label>
            <textarea
              name="description"
              placeholder="describe issue details..."
              rows={4}
              className={`w-full bg-surface/50 border ${errors.description && errors.description.length > 0 ? 'border-red-400' : 'border-border-subtle'} rounded-xl px-4 py-3 text-sm text-heading outline-none focus:ring-2 focus:ring-brand-primary/30 transition-all resize-none`}
              value={form.description}
              onChange={handleChange}
              required
            />
            <div className="flex justify-between items-center mt-1">
              {errors.description ? (
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight">{errors.description}</p>
              ) : <div />}
              <p className="text-[10px] text-muted uppercase tracking-widest">{form.description.length}/1000</p>
            </div>
          </div>

          {/* File Upload */}
          <div className="flex flex-col gap-2">
            <label className="block text-xs font-bold text-muted uppercase">
              Attachments {form.attachments.length > 0 && `(${form.attachments.length}/${MAX_FILES})`}
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-border-subtle border-dashed rounded-xl cursor-pointer bg-surface hover:bg-surface/80 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <p className="text-xs text-muted font-bold uppercase tracking-tight">
                    {form.attachments.length > 0 ? `${form.attachments.length} file(s) selected` : "click to upload file(s)"}
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  name="attachment"
                  type="file"
                  multiple
                  accept=".bmp,.mp4,.mp3,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,image/*,video/mp4,audio/mpeg"
                  className="hidden"
                  onChange={handleChange}
                  disabled={form.attachments.length >= MAX_FILES}
                />
              </label>
            </div>
            {errors.attachment && (
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight">{errors.attachment}</p>
            )}
            
            {/* Display attached files with remove buttons */}
            {form.attachments.length > 0 && (
              <div className="space-y-2 mt-2">
                {form.attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-surface/50 rounded-lg border border-border-subtle"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs font-bold text-heading truncate">{file.name}</span>
                      <span className="text-[10px] text-muted">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-muted hover:text-red-500 transition-colors text-sm font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </GlassModal>

      {/* Unsaved Changes Confirmation Dialog */}
      {showConfirmDialog && (
        <GlassModal
          isOpen={true}
          onClose={handleConfirmStay}
          title="Unsaved Changes"
          maxWidth="max-w-sm"
          footer={
            <div className="flex w-full gap-3">
              <button
                onClick={handleConfirmStay}
                className="btn btn-secondary flex-1"
              >
                Stay
              </button>
              <button
                onClick={handleConfirmLeave}
                className="flex-1 text-[10px] shadow-red-100 btn btn-danger"
              >
                Leave
              </button>
            </div>
          }
        >
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-amber-50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-xs text-muted font-medium mb-2">
              You have unsaved data. Are you sure you want to leave? All progress will be lost.
            </p>
          </div>
        </GlassModal>
      )}
    </>
  );
};

export default RaiseTicketModal;