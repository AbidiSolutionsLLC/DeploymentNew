import { useEffect } from "react";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";

export const DetailBadge = ({ tone = "border-border-subtle bg-app text-muted", children }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${tone}`}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {children}
  </span>
);

export const DetailSectionHeading = ({ icon, title, count }) => (
  <div className="mb-2.5 flex items-center justify-between gap-3">
    <h3 className="flex items-center gap-2 text-sm font-semibold text-heading">
      {icon}
      {title}
    </h3>
    {count !== undefined && (
      <span className="text-[11px] font-medium text-muted">{count}</span>
    )}
  </div>
);

export const DetailFieldLabel = ({ children }) => (
  <p className="mb-1.5 text-[11px] font-medium text-muted">{children}</p>
);

export const DetailField = ({ label, children, className = "" }) => (
  <div className={`border-b border-border-subtle px-4 py-3.5 ${className}`}>
    <DetailFieldLabel>{label}</DetailFieldLabel>
    {children}
  </div>
);

export const DetailActionButton = ({ children, className = "", ...props }) => (
  <button
    type="button"
    className={`inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-surface px-3.5 py-2 text-[13px] font-medium text-main transition-colors hover:bg-card-hover ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const DetailFooterButton = ({ children, className = "", ...props }) => (
  <button
    type="button"
    className={`inline-flex items-center justify-center rounded-lg border border-border-subtle bg-surface px-3.5 py-2 text-[13px] font-medium text-main transition-colors hover:bg-card-hover disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default function DetailModal({
  isOpen = true,
  onClose,
  title,
  meta,
  subtitle,
  badges,
  actions,
  children,
  footer,
  maxWidth = "max-w-5xl",
  bodyClassName = "",
  ariaLabel = "Details",
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      if (document.querySelectorAll('[role="dialog"]').length > 1) return;
      onClose?.();
    };

    const previousOverflow = document.body.style.overflow;
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--color-overlay)] p-3 backdrop-blur-sm animate-fadeIn sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div
        className={`relative z-[10000] flex max-h-[92vh] w-full ${maxWidth} flex-col overflow-hidden rounded-xl border border-border-subtle bg-app shadow-2xl animate-slideInUp`}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={`flex-1 overflow-y-auto p-4 custom-scrollbar-visible sm:p-5 ${bodyClassName}`}
        >
          {title && (
            <div className="glass-card p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  {meta && (
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-muted">
                      {meta}
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2.5">
                    <h1 className="text-lg font-semibold leading-snug tracking-tight text-heading">
                      {title}
                    </h1>
                    {badges}
                  </div>
                  {subtitle && (
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                      {subtitle}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {actions}
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-surface text-muted transition-colors hover:bg-card-hover hover:text-main"
                    title="Close"
                    aria-label="Close details"
                  >
                    <FaTimes size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {children}
        </div>

        {footer && (
          <div className="flex flex-shrink-0 flex-col-reverse justify-end gap-2 border-t border-border-subtle bg-surface px-4 py-3 sm:flex-row">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
