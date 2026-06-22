import React, { useEffect } from "react";
import { createPortal } from "react-dom";
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

 const modalContent = (
 /* ── Full-viewport backdrop — rendered directly on document.body via Portal ──
 fixed + inset-0 + w-screen + h-screen ensures it covers sidebar & navbar.
 z-[9999] places it above all app chrome (sidebar z ~30, navbar z ~30). */
 <div
 className="fixed inset-0 w-screen h-screen z-[9999] bg-slate-900/40 flex items-center justify-center p-4"
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

 {/* ── Modal Card ──
 Pure white (#fff), not translucent — pops cleanly on the beige app bg.
 max-h-[90vh] + flex flex-col lets the body scroll independently. */}
 <div
 className={`relative w-full ${maxWidth} bg-surface rounded-xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-slideInUp overflow-hidden`}
 onClick={(e) => e.stopPropagation()}
 >
 {/* ── Header ── */}
 <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
 <div>
 {typeof title === "string" ? (
 <h2
 id="modal-title"
 className="text-lg font-bold text-main leading-tight"
 >
 {title}
 </h2>
 ) : (
 /* Allow passing a React node (e.g. ExportSelectionModal passes a <div>) */
 <div id="modal-title" className="text-lg font-bold text-main leading-tight">
 {title}
 </div>
 )}
 </div>
 <button
 onClick={onClose}
 className="ml-4 flex-shrink-0 p-1.5 rounded-lg text-muted hover:text-main hover:bg-app transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
 aria-label="Close modal"
 >
 <X className="h-5 w-5" />
 </button>
 </div>

 {/* ── Scrollable Body ── */}
 <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 custom-scrollbar-visible">
 {children}
 </div>

 {/* ── Footer (Optional) ── */}
 {footer && (
 <div className="flex-shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-surface rounded-b-xl">
 {footer}
 </div>
 )}
 </div>
 </div>
 );

 // Mount directly on document.body — escapes any overflow:hidden parent
 return createPortal(modalContent, document.body);
}
