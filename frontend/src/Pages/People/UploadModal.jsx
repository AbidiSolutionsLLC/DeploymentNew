import React, { useState, useRef } from "react";
import { FiUpload } from "react-icons/fi";
import { toast } from "react-toastify";
import GlassModal from "../../components/ui/GlassModal";

const UploadModal = ({ onCreate }) => {
 const [isOpen, setIsOpen] = useState(false);
 const [folderName, setFolderName] = useState("");
 const modalRef = useRef(null);

 const handleBackdropClick = (e) => {
 if (modalRef.current && !modalRef.current.contains(e.target)) {
 handleClose();
 }
 };

 const handleClose = () => {
 setFolderName("");
 setIsOpen(false);
 };

 const handleSubmit = (e) => {
 e.preventDefault();
 if (!folderName.trim()) {
 toast.error("Folder name is required");
 return;
 }
 onCreate({
 name: folderName,
 file: "",
 createdAt: new Date().toISOString(),
 });
 handleClose();
 };

 return (
 <>
 {/* Trigger Button */}
 <div className="flex justify-end">
 <button
 onClick={() => setIsOpen(true)}
import GlassModal from "../../components/ui/GlassModal";

const UploadModal = ({ onCreate }) => {
 const [isOpen, setIsOpen] = useState(false);
 const [folderName, setFolderName] = useState("");

 const handleClose = () => {
 setFolderName("");
 setIsOpen(false);
 };

 const handleSubmit = (e) => {
 e.preventDefault();
 if (!folderName.trim()) {
 toast.error("Folder name is required");
 return;
 }
 onCreate({
 name: folderName,
 file: "",
 createdAt: new Date().toISOString(),
 });
 handleClose();
 };

 return (
 <>
 {/* Trigger Button */}
 <div className="flex justify-end">
 <button
 onClick={() => setIsOpen(true)}
 className="flex items-center gap-2 bg-[#64748b] text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl hover:brightness-110 transition-all shadow-lg shadow-slate-100"
 >
 <FiUpload className="text-sm" /> Upload Document
 </button>
 </div>

  {/* Modal Overlay */}
  {isOpen && (
    <GlassModal
      isOpen={true}
      onClose={handleClose}
      maxWidth="max-w-md"
      title={
        <h2 className="text-base sm:text-lg font-black text-heading tracking-widest uppercase">
          CREATE FOLDER
        </h2>
      }
      footer={
        <div className="flex gap-3 sm:gap-4 w-full">
          <button
            type="button"
            onClick={handleClose}
            className="btn-ghost flex-1 text-muted"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 sm:py-4 text-[10px] shadow-slate-100 active:scale-95 btn btn-primary"
          >
            CREATE FOLDER
          </button>
        </div>
      }
    >
      {/* Form Body */}
      <form
        id="uploadForm"
        className="space-y-5 sm:space-y-6"
        onSubmit={handleSubmit}
      >
        <div>
          <label className="block text-[10px] font-black text-muted mb-2 uppercase tracking-widest">
            FOLDER NAME*
          </label>
          <input
            type="text"
            placeholder="enter folder name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            className="w-full bg-surface border border-border-subtle rounded-xl px-4 py-3 text-sm sm:text-base text-main font-medium outline-none focus:ring-2 focus:ring-amber-100 focus:border-amber-300 transition-all placeholder:text-slate-300"
            required
          />
        </div>

        {/* Optional: Placeholder for File Upload UI if needed later */}
        <div className="p-4 bg-surface rounded-xl border border-dashed border-border-subtle flex flex-col items-center justify-center gap-2">
          <p className="text-[9px] font-black text-muted uppercase tracking-widest">
            Drop files here or click to browse
          </p>
        </div>
      </form>
    </GlassModal>
  )}
 </>
 );
};

export default UploadModal;