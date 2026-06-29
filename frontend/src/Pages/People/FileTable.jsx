import React from "react";
import { FiEye, FiDownload } from "react-icons/fi";
import { format } from "date-fns";
import TableWithPagination from "../../components/TableWithPagination";

const FileTable = ({ files, onDownload, loading, searchTerm = "" }) => {
 
 const filtered = files.filter((f) => {
 if (!searchTerm) return true;
 
 const s = searchTerm.toLowerCase();
 return (
 f.name?.toLowerCase().includes(s) ||
 (f.ownerId?.name?.toLowerCase().includes(s) || '') ||
 (f.ownerId?.email?.toLowerCase().includes(s) || '') ||
 (f.mimeType?.toLowerCase().includes(s) || '')
 );
 });

 // Format date helper
 const formatDate = (dateString) => {
 try {
 return format(new Date(dateString), 'MMM dd, yyyy');
 } catch {
 return 'Unknown date';
 }
 };

 // Get file category from MIME type
 const getCategory = (mimeType) => {
 if (!mimeType) return 'Unknown';
 
 if (mimeType.startsWith('image/')) return 'Image';
 if (mimeType.startsWith('video/')) return 'Video';
 if (mimeType.startsWith('audio/')) return 'Audio';
 if (mimeType.includes('pdf')) return 'PDF';
 if (mimeType.includes('word') || mimeType.includes('document')) return 'Document';
 if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'Spreadsheet';
 if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'Presentation';
 if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'Archive';
 
 return 'File';
 };

 // Get owner name or email
 const getOwnerName = (file) => {
 if (file.ownerId?.name) return file.ownerId.name;
 if (file.ownerId?.email) return file.ownerId.email;
 if (typeof file.ownerId === 'string') return 'Unknown';
 return 'Unknown';
 };

 // Get file size in readable format
 const getFileSize = (size) => {
 if (!size) return 'Unknown';
 if (size < 1024) return `${size} B`;
 if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
 if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
 return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
 };

 const fileColumns = [
 {
 key: "fileName",
 label: "File Name",
 render: (_, file) => (
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 flex items-center justify-center">
 {file.mimeType?.startsWith('image/') ? (
 <img 
 src={file.url} 
 alt={file.name}
 className="w-6 h-6 object-cover rounded"
 />
 ) : (
 <div className="w-6 h-6 bg-amber-100 dark:bg-amber-900/40 rounded flex items-center justify-center">
 <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">
 {file.name?.split('.').pop()?.charAt(0).toUpperCase() || 'F'}
 </span>
 </div>
 )}
 </div>
 <span className="truncate max-w-[200px]" title={file.name}>
 {file.name}
 </span>
 </div>
 )
 },
 {
 key: "owner",
 label: "Owner",
 render: (_, file) => getOwnerName(file)
 },
 {
 key: "uploaded",
 label: "Uploaded",
 render: (_, file) => formatDate(file.createdAt)
 },
 {
 key: "type",
 label: "Type",
 render: (_, file) => getCategory(file.mimeType)
 },
 {
 key: "size",
 label: "Size",
 render: (_, file) => getFileSize(file.size)
 },
 {
 key: "actions",
 label: "Actions",
 align: "right",
 render: (_, file) => (
 <div className="flex items-center justify-end gap-3">
 <a 
 href={file.url} 
 target="_blank" 
 rel="noopener noreferrer"
 title="View"
 className="hover:brightness-110"
 >
 <FiEye className="text-lg text-purple-600" />
 </a>
 <button 
 onClick={() => onDownload(file._id)} 
 title="Download" 
 className="hover:brightness-110 disabled:opacity-50"
 disabled={loading}
 >
 <FiDownload className="text-lg text-green-600 dark:text-green-400" />
 </button>
 </div>
 )
 }
 ];

 return (
 <div className="bg-surface rounded-2xl border border-white/60 shadow-[inset_0_2px_10px_rgba(255,255,255,0.3)] overflow-hidden w-full">
 <TableWithPagination
 columns={fileColumns}
 data={filtered}
 loading={loading}
 emptyMessage={searchTerm ? `No files found matching "${searchTerm}"` : "No files available"}
 defaultSort={{ key: "uploadedAt", direction: "desc" }}
 />
 </div>
 );
};

export default FileTable;