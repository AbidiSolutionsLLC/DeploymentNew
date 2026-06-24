import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function GlassModal({
  isOpen,
  onClose,
  title,
  description, // Added description for the new design
  children,
  footer,
  maxWidth = "max-w-lg",
}) {
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent scrolling on body when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Click-away backdrop layer */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        className={`relative z-[10000] w-full ${maxWidth} bg-white rounded-xl shadow-xl border border-slate-200 flex flex-col max-h-[90vh] mx-4 animate-in fade-in zoom-in-95 duration-200 overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col space-y-1.5 px-6 pt-6 pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              {typeof title === "string" ? (
                <h2
                  id="modal-title"
                  className="text-lg font-semibold leading-none tracking-tight text-slate-900"
                >
                  {title}
                </h2>
              ) : (
                <div id="modal-title">{title}</div>
              )}
              {description && (
                <p className="mt-1.5 text-sm text-slate-500">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="btn-ghost ml-4 flex-shrink-0 rounded-sm"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar-visible text-slate-700">
          {children}
        </div>

        {/* Footer (Optional) */}
        {footer && (
          <div className="flex-shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
