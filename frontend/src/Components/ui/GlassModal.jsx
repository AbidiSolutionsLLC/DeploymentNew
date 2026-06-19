import React, { useEffect } from "react";
import { X } from "lucide-react";

export default function GlassModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = "max-w-lg", // max-w-sm, max-w-md, max-w-lg, max-w-xl, max-w-2xl
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

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Modal Content */}
      <div 
        className={`relative w-full ${maxWidth} bg-surface/90 dark:bg-slate-900/90 backdrop-blur-xl border border-border-primary dark:border-slate-700 shadow-2xl rounded-2xl flex flex-col max-h-[90vh] animate-slideInUp overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle dark:border-slate-800">
          <h2 id="modal-title" className="text-xl font-bold text-heading dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-muted hover:bg-surface/50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar-visible">
          {children}
        </div>

        {/* Footer (Optional) */}
        {footer && (
          <div className="px-6 py-4 border-t border-border-subtle dark:border-slate-800 bg-surface/50 dark:bg-slate-800/50 flex justify-end gap-3 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
