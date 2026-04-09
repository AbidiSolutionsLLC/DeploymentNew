import React, { useState, useRef } from "react";
import { validateText, validateDescription, validateEmail, sanitizeText } from "../../utils/validationUtils";
import { toast } from "react-toastify";

const AdminRaiseTicketModal = ({ onClose, onSubmit }) => {
  const [form, setForm] = useState({
    id: "",
    email: "",
    subject: "",
    comment: "",
    attachments: [],
  });
  const [errors, setErrors] = useState({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);
  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB limit
  const MAX_FILES = 5;

  // Check if form has unsaved changes
  const hasUnsavedChanges = () => {
    return form.id.trim().length > 0 ||
           form.email.trim().length > 0 ||
           form.subject.trim().length > 0 ||
           form.comment.trim().length > 0 ||
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
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    const val = files ? files[0] : value;
    setForm((prev) => ({
      ...prev,
      [name]: val,
    }));

    // Inline validation
    if (name === "email") {
      setErrors(prev => ({ ...prev, email: validateEmail(val) }));
    }
    if (name === "subject") {
      const error = validateText(val);
      let customError = error;
      if (!error && val.length < 5) customError = "Subject must be at least 5 characters.";
      setErrors(prev => ({ ...prev, subject: customError }));
    }
    if (name === "comment") {
      const error = validateDescription(val, { min: 10, max: 1000, required: true });
      setErrors(prev => ({ ...prev, comment: error }));
    }
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

  const handleSubmit = (e) => {
    e.preventDefault();

    // Final validation
    const emailErr = validateEmail(form.email);
    const subjectErr = validateText(form.subject) || (form.subject.length < 5 ? "Subject must be at least 5 characters." : null);
    const commentErr = validateDescription(form.comment, { min: 10, max: 1000, required: true });

    if (emailErr || subjectErr || commentErr) {
      setErrors({ email: emailErr, subject: subjectErr, comment: commentErr });
      toast.error("PLEASE FIX VALIDATION ERRORS");
      return;
    }

    const newTicket = {
      ...form,
      subject: sanitizeText(form.subject),
      comment: sanitizeText(form.comment),
      date: new Date().toISOString().slice(0, 10),
      status: "opened",
    };
    onSubmit(newTicket);
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
        </div>

        {/* Form Body */}
        <form
          id="ticketForm"
          className="p-6 sm:p-10 space-y-5 sm:space-y-6 overflow-y-auto custom-scrollbar"
          onSubmit={handleSubmit}
        >
          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              TICKET ID*
            </label>
            <input
              name="id"
              placeholder="ticket id"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all placeholder:text-slate-300"
              value={form.id}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              EMAIL*
            </label>
            <input
              name="email"
              type="email"
              placeholder="user@example.com"
              className={`w-full bg-white border ${errors.email ? 'border-red-400' : 'border-slate-200'} rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all placeholder:text-slate-300`}
              value={form.email}
              onChange={handleChange}
              required
            />
            {errors.email && (
              <p className="mt-1 text-[10px] font-bold text-red-500 uppercase tracking-tight">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              SUBJECT*
            </label>
            <input
              name="subject"
              placeholder="issue subject"
              className={`w-full bg-white border ${errors.subject ? 'border-red-400' : 'border-slate-200'} rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all placeholder:text-slate-300`}
              value={form.subject}
              onChange={handleChange}
              required
            />
            <div className="flex justify-between items-center mt-1">
              {errors.subject ? (
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight">{errors.subject}</p>
              ) : <div />}
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">{form.subject.length}/100</p>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
              DESCRIPTION*
            </label>
            <textarea
              name="comment"
              placeholder="describe the issue"
              className={`w-full bg-white border ${errors.comment ? 'border-red-400' : 'border-slate-200'} rounded-xl px-4 py-3 text-sm text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all placeholder:text-slate-300 min-h-[100px] resize-none`}
              value={form.comment}
              onChange={handleChange}
              rows={3}
              required
            />
            <div className="flex justify-between items-center mt-1">
              {errors.comment ? (
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight">{errors.comment}</p>
              ) : <div />}
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">{form.comment.length}/1000</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer select-none">
              ATTACHMENT {form.attachments.length > 0 && `(${form.attachments.length}/${MAX_FILES})`}
            </label>
            <input
              ref={fileInputRef}
              name="attachment"
              type="file"
              multiple
              accept=".bmp,.mp4,.mp3,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,image/png,image/jpeg,image/jpg,image/bmp,video/mp4,audio/mpeg,audio/mpeg3,audio/x-mpeg,audio/x-mpeg-3"
              className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-slate-200 file:text-slate-600 hover:file:bg-slate-300 cursor-pointer"
              onChange={handleChange}
              disabled={form.attachments.length >= MAX_FILES}
            />
            {errors.attachment && (
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight">{errors.attachment}</p>
            )}
            
            {/* Display attached files with remove buttons */}
            {form.attachments.length > 0 && (
              <div className="space-y-2 mt-2">
                {form.attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-slate-700 truncate">{file.name}</span>
                      <span className="text-[9px] text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="text-slate-400 hover:text-red-500 transition-colors text-sm font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-6 sm:px-10 sm:py-8 border-t border-slate-100 flex gap-3 sm:gap-4 bg-white flex-shrink-0">
          <button
            type="button"
            onClick={handleCancelClick}
            className="flex-1 py-3 sm:py-4 font-black text-[10px] sm:text-[11px] text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
          >
            CANCEL
          </button>
          <button
            type="submit"
            form="ticketForm"
            className="flex-1 py-3 sm:py-4 bg-[#64748b] text-white rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-widest shadow-lg shadow-slate-100 hover:brightness-110 active:scale-95 transition-all"
          >
            SUBMIT TICKET
          </button>
        </div>
      </div>

      {/* Unsaved Changes Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex justify-center items-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 animate-fadeIn">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-amber-50 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-wider mb-2">
                Unsaved Changes
              </h3>
              <p className="text-xs text-slate-500 font-medium mb-6">
                You have unsaved data. Are you sure you want to leave? All progress will be lost.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmStay}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Stay
                </button>
                <button
                  onClick={handleConfirmLeave}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-100"
                >
                  Leave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRaiseTicketModal;