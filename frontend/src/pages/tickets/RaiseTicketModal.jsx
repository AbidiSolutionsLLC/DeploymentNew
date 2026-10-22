import React, { useState } from "react";
import { useSelector } from "react-redux";
import { FaFileAlt, FaPaperclip, FaTimes } from "react-icons/fa";
import api from "../../axios";
import { validateText, validateDescription, sanitizeText, getApiError } from "../../utils/validationUtils";
import GlassButton from "../../components/ui/GlassButton";
import DetailModal, {
  DetailFooterButton,
  DetailSectionHeading,
} from "../../components/ui/DetailModal";

const inputClass =
  "block w-full rounded-lg border bg-app px-3 py-2 text-[13px] leading-relaxed text-main outline-none transition-colors placeholder:text-muted/70 focus:ring-2 focus:ring-brand/10";

const RaiseTicketModal = ({ onClose, onSubmit, showToast }) => {
  const [form, setForm] = useState({ subject: "", description: "", attachments: [] });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const fileInputRef = React.useRef(null);
  const user = useSelector((state) => state.auth.user);
  const MAX_FILE_SIZE = 25 * 1024 * 1024;
  const MAX_FILES = 5;

  const notify = (message, type = "success") => {
    if (typeof showToast === "function") showToast(message, type);
  };

  const hasUnsavedChanges = () => {
    return (
      form.subject.trim().length > 0 ||
      form.description.trim().length > 0 ||
      form.attachments.length > 0
    );
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

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (!files) {
      setForm((prev) => ({ ...prev, [name]: value }));

      if (name === "subject") {
        setErrors((prev) => ({ ...prev, subject: validateText(value) }));
      }
      if (name === "description") {
        setErrors((prev) => ({
          ...prev,
          description: validateDescription(value, { required: true }),
        }));
      }
      return;
    }

    if (name === "attachment" && files && files.length > 0) {
      const newFiles = Array.from(files);
      const validFiles = [];
      const duplicates = [];
      const oversized = [];

      for (const file of newFiles) {
        const isDuplicate = form.attachments.some(
          (existing) => existing.name === file.name && existing.size === file.size
        );
        if (isDuplicate) {
          duplicates.push(file.name);
          continue;
        }

        if (file.size > MAX_FILE_SIZE) {
          oversized.push(file.name);
          continue;
        }

        validFiles.push(file);
      }

      if (form.attachments.length + validFiles.length > MAX_FILES) {
        setErrors((prev) => ({
          ...prev,
          attachment: `Maximum ${MAX_FILES} files allowed. You can add ${
            MAX_FILES - form.attachments.length
          } more file(s).`,
        }));
        return;
      }

      if (duplicates.length > 0) {
        setErrors((prev) => ({
          ...prev,
          attachment: `File(s) already attached: ${duplicates.join(", ")}`,
        }));
      } else if (oversized.length > 0) {
        const limitMB = MAX_FILE_SIZE / (1024 * 1024);
        setErrors((prev) => ({
          ...prev,
          attachment: `File size exceeds ${limitMB} MB limit: ${oversized.join(", ")}`,
        }));
      } else {
        setErrors((prev) => ({ ...prev, attachment: null }));
      }

      if (validFiles.length > 0) {
        setForm((prev) => ({
          ...prev,
          attachments: [...prev.attachments, ...validFiles],
        }));
      }

      e.target.value = null;
    }
  };

  const removeAttachment = (index) => {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
    setErrors((prev) => ({ ...prev, attachment: null }));

    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const subjectError = validateText(form.subject);
    const descError = validateDescription(form.description, { required: true });

    if (subjectError || descError) {
      setErrors({
        subject: subjectError,
        description: descError,
      });
      notify("PLEASE FIX VALIDATION ERRORS", "error");
      return;
    }

    setSubmitting(true);
    try {
      const ticketData = new FormData();
      ticketData.append("emailAddress", user?.email);
      ticketData.append("subject", sanitizeText(form.subject));
      ticketData.append("description", sanitizeText(form.description));

      form.attachments.forEach((file) => {
        ticketData.append("attachments", file);
      });

      const response = await api.post("/tickets", ticketData);

      onSubmit(response.data);
      onClose();
      notify("TICKET SUBMITTED SUCCESSFULLY");
    } catch (error) {
      notify(getApiError(error, "FAILED TO SUBMIT"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <DetailModal
        isOpen={true}
        onClose={handleCancelClick}
        ariaLabel="Raise a ticket"
        maxWidth="max-w-2xl"
        meta={<span>Customer support</span>}
        title="Raise a ticket"
        subtitle="Tell us what you need help with and our team will get back to you."
        footer={
          <>
            <DetailFooterButton onClick={handleCancelClick} disabled={submitting}>
              Cancel
            </DetailFooterButton>
            <GlassButton
              type="submit"
              form="ticketForm"
              variant="primary"
              isLoading={submitting}
              disabled={submitting}
            >
              Submit ticket
            </GlassButton>
          </>
        }
      >
        <form id="ticketForm" onSubmit={handleSubmit} className="mt-5 space-y-6">
          <section>
            <DetailSectionHeading
              icon={<FaFileAlt size={13} className="text-muted" />}
              title="Ticket details"
            />
            <div className="space-y-4 rounded-xl border border-border-subtle bg-surface p-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-muted">
                  Subject
                </label>
                <input
                  name="subject"
                  placeholder="e.g. Cannot access dashboard"
                  className={`${inputClass} ${
                    errors.subject
                      ? "border-danger-border"
                      : "border-border-subtle focus:border-brand/40"
                  }`}
                  value={form.subject}
                  onChange={handleChange}
                  required
                />
                <div className="mt-1 flex items-center justify-between gap-2">
                  {errors.subject ? (
                    <p className="text-[11px] font-medium text-danger">{errors.subject}</p>
                  ) : (
                    <div />
                  )}
                  <p className="text-[11px] text-muted">{form.subject.length}/100</p>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-medium text-muted">
                  Detailed description
                </label>
                <textarea
                  name="description"
                  placeholder="Describe the issue in detail..."
                  rows={5}
                  className={`${inputClass} resize-none ${
                    errors.description
                      ? "border-danger-border"
                      : "border-border-subtle focus:border-brand/40"
                  }`}
                  value={form.description}
                  onChange={handleChange}
                  required
                />
                <div className="mt-1 flex items-center justify-between gap-2">
                  {errors.description ? (
                    <p className="text-[11px] font-medium text-danger">{errors.description}</p>
                  ) : (
                    <div />
                  )}
                  <p className="text-[11px] text-muted">
                    {form.description.length}/1000
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <DetailSectionHeading
              icon={<FaPaperclip size={13} className="text-muted" />}
              title="Attachments"
              count={`${form.attachments.length}/${MAX_FILES} files`}
            />
            <div className="rounded-xl border border-border-subtle bg-surface p-4">
              <label
                className={`flex h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-app text-center transition-colors ${
                  form.attachments.length >= MAX_FILES
                    ? "cursor-not-allowed border-border-subtle opacity-60"
                    : "border-border-subtle hover:border-brand/40 hover:bg-card-hover"
                }`}
              >
                <FaPaperclip size={16} className="mb-2 text-muted" />
                <span className="text-[13px] font-medium text-main">
                  {form.attachments.length > 0
                    ? `${form.attachments.length} file(s) selected`
                    : "Click to upload files"}
                </span>
                <span className="mt-0.5 text-[11px] text-muted">
                  Up to {MAX_FILES} files, 25MB each
                </span>
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

              {errors.attachment && (
                <p className="mt-1.5 text-[11px] font-medium text-danger">
                  {errors.attachment}
                </p>
              )}

              {form.attachments.length > 0 && (
                <div className="mt-3 divide-y divide-border-subtle overflow-hidden rounded-lg border border-border-subtle">
                  {form.attachments.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-3 bg-app px-3 py-2"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-surface text-[10px] font-semibold text-muted">
                        {String(file.name).split(".").pop().toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-main">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-muted">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="shrink-0 rounded-md p-1.5 text-muted transition-colors hover:bg-danger-bg hover:text-danger"
                        aria-label={`Remove ${file.name}`}
                      >
                        <FaTimes size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </form>
      </DetailModal>

      {showConfirmDialog && (
        <DetailModal
          isOpen={true}
          onClose={handleConfirmStay}
          ariaLabel="Unsaved changes"
          maxWidth="max-w-md"
          title="Unsaved changes"
          footer={
            <>
              <DetailFooterButton onClick={handleConfirmStay}>Stay</DetailFooterButton>
              <GlassButton variant="danger" onClick={handleConfirmLeave}>
                Leave
              </GlassButton>
            </>
          }
        >
          <div className="mt-5 rounded-xl border border-warning-border bg-warning-bg p-4">
            <p className="text-[13px] leading-relaxed text-warning">
              You have unsaved data. Are you sure you want to leave? All progress will be
              lost.
            </p>
          </div>
        </DetailModal>
      )}
    </>
  );
};

export default RaiseTicketModal;
