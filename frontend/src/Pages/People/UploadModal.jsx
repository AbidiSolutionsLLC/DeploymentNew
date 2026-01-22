import React, { useState, useRef } from "react";
import { FiUpload } from "react-icons/fi";
import { toast } from "react-toastify";

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
          className="flex items-center gap-2 bg-[#64748b] text-white text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl hover:brightness-110 transition-all shadow-lg shadow-slate-100"
        >
          <FiUpload className="text-sm" /> Upload Document
        </button>
      </div>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex justify-center items-center p-4 sm:p-6"
          onClick={handleBackdropClick}
        >
          <div
            ref={modalRef}
            className="w-full max-w-md bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative flex flex-col max-h-[90vh] animate-fadeIn overflow-hidden"
          >
            {/* Close Cross Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 sm:top-5 sm:right-6 w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-red-500 transition-all text-2xl font-light z-10"
            >
              &times;
            </button>

            {/* Header */}
            <div className="px-6 py-6 sm:px-10 sm:py-8 border-b border-slate-50 text-center flex-shrink-0">
              <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-widest uppercase">
                CREATE FOLDER
              </h2>
            </div>

            {/* Form Body */}
            <form
              id="uploadForm"
              className="p-6 sm:p-10 space-y-5 sm:space-y-6 overflow-y-auto custom-scrollbar"
              onSubmit={handleSubmit}
            >
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">
                  FOLDER NAME*
                </label>
                <input
                  type="text"
                  placeholder="enter folder name"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm sm:text-base text-slate-700 font-medium outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all placeholder:text-slate-300"
                  required
                />
              </div>

              {/* Optional: Placeholder for File Upload UI if needed later */}
              <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Drop files here or click to browse
                </p>
              </div>
            </form>

            {/* Footer Actions */}
            <div className="px-6 py-6 sm:px-10 sm:py-8 border-t border-slate-100 flex gap-3 sm:gap-4 bg-white flex-shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-3 sm:py-4 font-black text-[10px] text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
              >
                CANCEL
              </button>
              <button
                type="submit"
                form="uploadForm"
                className="flex-1 py-3 sm:py-4 bg-[#64748b] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-slate-100 hover:brightness-110 active:scale-95 transition-all"
              >
                CREATE FOLDER
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UploadModal;