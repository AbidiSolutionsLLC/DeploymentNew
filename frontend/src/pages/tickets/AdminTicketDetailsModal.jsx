import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AdminTicketDetail } from "./AssignTickets";

export default function AdminTicketDetailsModal({ ticketId, onClose, onChanged }) {
  useEffect(() => {
    if (!ticketId) return undefined;

    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      if (document.querySelectorAll('[role="dialog"]').length > 1) return;
      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [ticketId, onClose]);

  if (!ticketId) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--color-overlay)] p-3 backdrop-blur-sm animate-fadeIn sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Ticket details"
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div
        className="relative z-[10000] flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-border-subtle bg-app shadow-2xl animate-slideInUp"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar-visible sm:p-5">
          <AdminTicketDetail
            key={ticketId}
            ticketId={ticketId}
            embedded
            onClose={onClose}
            onDeleted={onChanged || onClose}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
