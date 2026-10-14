import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * GlassModal — the app's dialog (PROJECT_PORTAL_DESIGN.md §7).
 * Theme-exact: token colors only (works in light + dark), gold-hairline chrome,
 * opaque form surface for reliable contrast,
 * enter animation via existing fadeIn/slideInUp keyframes, Escape closes,
 * scroll locked while open. API: { isOpen, onClose, title, description, children, footer, maxWidth }.
 */
export default function GlassModal({
  isOpen,
  onClose,
  title,
  description,
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--color-overlay)] backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Click-away backdrop layer */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Card */}
      <div
        className={`relative z-[10000] w-full ${maxWidth} bg-white dark:bg-[#1e293b] border border-border-subtle dark:border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[90vh] mx-2 sm:mx-4 overflow-hidden animate-slideInUp`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col space-y-1.5 px-6 pt-6 pb-4 border-b border-border-subtle dark:border-slate-800 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              {typeof title === "string" ? (
                <h2
                  id="modal-title"
                  className="text-base font-bold leading-none tracking-tight text-heading uppercase"
                >
                  {title}
                </h2>
              ) : (
                <div id="modal-title">{title}</div>
              )}
              {description && <p className="mt-1.5 text-xs text-muted">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost ml-2 flex-shrink-0 rounded-sm shrink-0 p-2 rounded-lg text-muted hover:text-heading hover:bg-card-hover transition-colors" 
              aria-label="Close modal"
            >
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 custom-scrollbar-visible text-slate-700 dark:text-slate-300">
          {children}
        </div>

        {/* Footer (Optional) */}
        {footer && (
          <div className="flex-shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 px-4 py-3 border-t border-border-subtle dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
