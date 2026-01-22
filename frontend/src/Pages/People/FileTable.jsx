import { FiEye, FiDownload } from "react-icons/fi";
import { format } from "date-fns";

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

  return (
    <div className="bg-white rounded-xl shadow p-4 w-full">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left border-separate border-spacing-0">
          <thead className="bg-gray-100">
            <tr>
              {["File Name", "Owner", "Uploaded", "Type", "Size", "Actions"].map(
                (h) => (
                  <th
                    key={h}
                    className="p-3 font-medium text-gray-700 border-r last:border-none border-gray-300"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((file, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 flex items-center justify-center">
                        {file.mimeType?.startsWith('image/') ? (
                          <img 
                            src={file.url} 
                            alt={file.name}
                            className="w-6 h-6 object-cover rounded"
                          />
                        ) : (
                          <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                            <span className="text-xs text-blue-600 font-bold">
                              {file.name?.split('.').pop()?.charAt(0).toUpperCase() || 'F'}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="truncate max-w-[200px]" title={file.name}>
                        {file.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    {getOwnerName(file)}
                  </td>
                  <td className="p-3">
                    {formatDate(file.createdAt)}
                  </td>
                  <td className="p-3">
                    {getCategory(file.mimeType)}
                  </td>
                  <td className="p-3">
                    {getFileSize(file.size)}
                  </td>
                  <td className="p-3 flex items-center gap-3">
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
                      <FiDownload className="text-lg text-green-600" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  {searchTerm
                    ? `No files found matching "${searchTerm}"`
                    : "No files available"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FileTable;