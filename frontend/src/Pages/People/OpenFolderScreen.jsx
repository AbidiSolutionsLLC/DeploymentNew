import React, { useState } from "react";
import { FiUpload, FiArrowLeft } from "react-icons/fi";
import TableWithPagination from "../../components/TableWithPagination";

const OpenFolderScreen = ({ folder, onClose }) => {
 const [searchTerm, setSearchTerm] = useState("");
 const [uploadedFiles, setUploadedFiles] = useState([]);

 const handleFileChange = (e) => {
 const file = e.target.files[0];
 if (file) {
 setUploadedFiles((prev) => [...prev, file]);
 }
 };

 const filteredFiles = uploadedFiles.filter((f) =>
 f.name.toLowerCase().includes(searchTerm.toLowerCase())
 );

 const capitalize = (str) =>
 str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

 const fileColumns = [
 {
 key: "fileName",
 label: "File Name",
 render: (_, file) => file.name
 },
 {
 key: "size",
 label: "Size (KB)",
 render: (_, file) => (file.size / 1024).toFixed(2)
 },
 {
 key: "type",
 label: "Type",
 render: (_, file) => file.type || "Unknown"
 }
 ];

 return (
 <div className="min-h-screen bg-primary p-2 sm:p-4 mx-2 my-4 sm:m-6 rounded-lg shadow-md">
 {/* Back button and folder title */}
 <div className="flex items-center justify-between mb-4">
 <button
 onClick={onClose}
 className="flex items-center text-sm text-muted hover:text-main"
 >
 <FiArrowLeft className="mr-1" />
 </button>
 <h2 className="text-lg font-medium text-white">
 {folder?.name ? capitalize(folder.name) : "Folder"}
 </h2>
 </div>

 {/* Top bar: show entries / search / upload */}
 <div className="flex flex-col mb-5 bg-surface rounded-lg px-3 py-3 sm:px-6 md:px-8 md:py-4">
 {/* Controls layout - stacks on mobile, flex on larger screens */}
 <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between w-full space-y-4 lg:space-y-0">
 <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full lg:w-auto">
 <div className="flex-grow sm:w-64">
 <input
 type="text"
 placeholder="Search files..."
 className="border-0 px-3 py-2 rounded-md shadow-sm w-full text-xs sm:text-sm bg-secondary text-description"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </div>

 <div>
 <label
 htmlFor="fileInput"
 className="flex items-center justify-center gap-2 bg-[#86B2AA] hover:bg-[#99c7be] text-white px-3 sm:px-4 py-2 rounded-md cursor-pointer text-xs sm:text-sm whitespace-nowrap"
 >
 <FiUpload size={16} /> Upload File
 </label>
 <input
 id="fileInput"
 type="file"
 onChange={handleFileChange}
 className="hidden"
 accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,image/png,image/jpeg,image/jpg"
 />
 </div>
 </div>
 </div>
 </div>

 {/* Files table */}
 <div className="bg-surface rounded-xl shadow p-2 sm:p-4 w-full">
 {filteredFiles.length > 0 ? (
 <div className="bg-surface rounded-2xl border border-white/60 shadow-[inset_0_2px_10px_rgba(255,255,255,0.3)] overflow-hidden">
 <TableWithPagination
 columns={fileColumns}
 data={filteredFiles}
 emptyMessage="No files match your search."
 />
 </div>
 ) : (
 <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
 <div className="mb-4 p-4 rounded-full bg-app">
 <FiUpload size={24} className="text-muted" />
 </div>
 <h3 className="text-lg font-medium text-main mb-2">
 No files uploaded
 </h3>
 <p className="text-sm text-muted mb-4 max-w-md">
 Upload files to this folder to see them here
 </p>

 <input
 id="emptyStateFileInput"
 type="file"
 onChange={handleFileChange}
 className="hidden"
 accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,image/png,image/jpeg,image/jpg"
 />
 </div>
 )}
 </div>
 </div>
 );
};

export default OpenFolderScreen;
