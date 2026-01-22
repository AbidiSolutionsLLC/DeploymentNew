// src/components/Role.jsx
import React, { useState, useEffect } from 'react';
import { Spin, Alert } from 'antd';
import FileTable from './FileTable';
import FolderGrid from './FolderGrid';
import OpenFolderScreen from './OpenFolderScreen';
import api from '../../axios';
import { toast } from 'react-toastify';

export default function Role() {
  const [viewMode, setViewMode] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [openedFolder, setOpenedFolder] = useState(null);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const folderId = openedFolder?.id || 'root';
async function downloadFile(url, filename = 'file.docx') {
  console.log(filename,url)
  try {
    const response = await fetch(url, {
      mode: 'cors' // Cloudinary supports CORS on raw files
    });
    
    if (!response.ok) throw new Error('Failed to download file');

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Error downloading file:', error);
  }
}
// async function downloadFileFromServer(fileId) {
//   try {
//     const { data } = await api.get(`/files/files/${fileId}/download`);
//     await downloadFile(data.downloadUrl, data.filename);
//   } catch (e) {
//     console.error('Download failed:', e);
//     toast.error(e.response?.data?.error || 'Download failed');
//   }
// }
  const handleResumeDownload = async (resume) => {
    try {
      console.log("Downloading resume:", resume);
      if (!resume.filePath) {
        toast.error("Resume URL not available");
        return;
      }
 
      const getMimeType = (fileName) => {
        const extension = fileName.split('.').pop().toLowerCase();
        const mimeTypes = {
          'pdf': 'application/pdf',
          'doc': 'application/msword',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'txt': 'text/plain',
          'rtf': 'application/rtf'
        };
        return mimeTypes[extension] || 'application/octet-stream';
      };
 
      const getFileExtension = (fileName, filePath) => {
        if (fileName && fileName.includes('.')) {
          return fileName.split('.').pop().toLowerCase();
        }
 
        if (filePath && filePath.includes('.')) {
          const urlParts = filePath.split('/');
          const lastPart = urlParts[urlParts.length - 1];
          if (lastPart.includes('.')) {
            return lastPart.split('.').pop().toLowerCase();
          }
        }
 
        return 'pdf';
      };
 
      const fileExtension = getFileExtension(resume.fileName, resume.filePath);
      const mimeType = resume.format || getMimeType(resume.fileName || '') || getMimeType(fileExtension);
 
      const response = await fetch(resume.filePath, {
        method: 'GET',
        headers: {
          'Accept': `${mimeType}, application/octet-stream, */*`,
        },
      });
 
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }
 
      const arrayBuffer = await response.arrayBuffer();
 
      const blob = new Blob([arrayBuffer], {
        type: mimeType
      });
 
      const url = URL.createObjectURL(blob);
 
      let fileName = resume.fileName || `resume.${fileExtension}`;
 
      const currentExtension = fileName.split('.').pop().toLowerCase();
      if (currentExtension !== fileExtension) {
        fileName = fileName.replace(/\.[^/.]+$/, '') + `.${fileExtension}`;
      }
 
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
 
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading resume:", error);
 
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error("Network error: Unable to download resume. Please check your connection.");
      } else if (error.message.includes('Failed to fetch file')) {
        toast.error("File not found or access denied. Please try again later.");
      } else {
        toast.error("Failed to download resume. Please try again.");
      }
    }
  };
 
 const handleFileDownload = async (fileId) => {
    console.log("downloading file", fileId)
    const file=files.filter(item=> item._id===fileId)
    console.log(file)
    try {
      // await download(fileId)
        // downloadFile(file[0].url,file[0].name)
          await handleResumeDownload({
      filePath: file[0].url,
      fileName: file[0].name,
      // Optionally add format if you know the file type
      // format: 'application/pdf' etc.
    });
      // reload()
    } catch (err) {
      console.log(err)
      toast.error("File upload failed")
    }
  }
async function downloadFileFromServer(fileId) {
  try {
    const { data } = await api.get(`/files/files/${fileId}/download`);
    
    // Use handleResumeDownload instead of downloadFile
    await handleResumeDownload({
      filePath: data.downloadUrl,
      fileName: data.filename,
      // Optionally add format if you know the file type
      // format: 'application/pdf' etc.
    });
    
  } catch (e) {
    console.error('Download failed:', e);
    toast.error(e.response?.data?.error || 'Download failed');
  }
}

// You can now DELETE the old downloadFile function since handleResumeDownload replaces it
  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`files/files`);
      console.log(data,"getting my role")
      // setFolders(data.folders);
      setFiles(data);
    } catch (e) {
      setError(e);
      console.error(e.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, [folderId]);

  if (error) {
    return <Alert message={error.message} type="error" />;
  }

  if (openedFolder) {
    return (
      <OpenFolderScreen
        folder={openedFolder}
        onClose={() => setOpenedFolder(null)}
      />
    );
  }

  return (
    <div >
      {/* Search and Filter Controls */}
      <div className="flex flex-col space-y-4 mb-5 bg-white rounded-lg px-4 py-4 sm:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between w-full">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-3 lg:mb-0">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <label className="text-sm text-heading whitespace-nowrap">Show</label>
              <select className="text-sm px-2 py-1 text-heading bg-secondary rounded-md shadow-md">
                <option className="text-gray-700">10</option>
                <option className="text-gray-700">25</option>
                <option className="text-gray-700">50</option>
              </select>
              <span className="text-sm text-heading">entries</span>
            </div>

            <div className="w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search..."
                className="border-0 px-3 py-1.5 rounded-md shadow-md w-full sm:w-64 text-sm bg-secondary text-description"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* View Mode Toggle (Optional) */}
          {/* <div>
            <button onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}>
              Switch to {viewMode === 'table' ? 'Grid' : 'Table'} View
            </button>
          </div> */}
        </div>
      </div>

      {/* Folder/File Listing */}
      <Spin spinning={loading}>
        {viewMode === 'grid' ? (
          <FolderGrid
            folders={folders.filter((f) =>
              f.name?.toLowerCase().includes(searchTerm.toLowerCase())
            )}
            onOpenFolder={(f) => setOpenedFolder(f)}
          />
        ) : (
          <FileTable
            files={files.filter((f) =>
              true
              // f.name?.toLowerCase().includes(searchTerm.toLowerCase())
            )}
            onDownload={(id) => {
              downloadFileFromServer(id)
              console.log("Download requested for role-shared file id:", id);
            }}
            loading={false}
          />
        )}
      </Spin>
    </div>
  );
}
