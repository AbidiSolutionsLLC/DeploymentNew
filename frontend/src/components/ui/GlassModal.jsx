import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * GlassModal — the app's dialog (PROJECT_PORTAL_DESIGN.md §7).
 * Theme-exact: token colors only (works in light + dark), gold-hairline chrome,
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
        className={`relative z-[10000] w-full ${maxWidth} bg-card backdrop-blur-xl border border-border-subtle rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-slideInUp`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border-subtle flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
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
              aria-label="Close modal"
              className="ml-2 shrink-0 p-2 rounded-lg text-muted hover:text-heading hover:bg-card-hover transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar-visible text-main">{children}</div>

        {/* Footer (Optional) */}
        {footer && (
          <div className="flex-shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2 px-6 py-4 border-t border-border-subtle bg-card">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
