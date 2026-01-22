import React, { useState, useEffect } from 'react';
import { Spin, Alert } from 'antd';
import FileTable from './FileTable';
import api from '../../axios'; // Import your axios instance
import { useSelector } from 'react-redux';

export default function Files() {
  const [viewMode, setViewMode] = useState('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [publicFiles, setPublicFiles] = useState([]);
  const [roleSharedFiles, setRoleSharedFiles] = useState([]);
  const [loading, setLoading] = useState({
    public: false,
    role: false,
    download: false
  });
  const [error, setError] = useState(null);

  const { user } = useSelector((state) => state.auth);

  const tabs = [
    { title: "Public Files" },
    { title: "Shared with my role" }
  ];

  // Fetch public files
  const fetchPublicFiles = async () => {
    setLoading(prev => ({ ...prev, public: true }));
    setError(null);
    try {
      const response = await api.get('/files/files/public');
      setPublicFiles(response.data.data?.files || []);
    } catch (err) {
      console.error('Error fetching public files:', err);
      setError(err.response?.data?.error || 'Failed to load public files');
    } finally {
      setLoading(prev => ({ ...prev, public: false }));
    }
  };

  // Fetch files shared with user's role
  const fetchRoleSharedFiles = async () => {
    setLoading(prev => ({ ...prev, role: true }));
    setError(null);
    try {
      const response = await api.get('/files/files/accessible');
      const allFiles = response.data.data || [];
      
      // Filter only files that are shared with user's role
      const roleFiles = allFiles.filter(file => {
        // Skip user's own files
        if (file.ownerId?._id === user?.id || file.ownerId === user?.id) {
          return false;
        }
        
        // Check if file has sharedWithRoles that includes user's role
        if (file.sharedWithRoles && user?.roles && Array.isArray(user.roles)) {
          const hasRoleAccess = file.sharedWithRoles.some(role => 
            user.roles.includes(role)
          );
          
          if (hasRoleAccess) return true;
        }
        
        // Also include files where user is in ACL (via email or userId)
        if (file.acl) {
          const hasAclAccess = file.acl.some(entry => 
            (entry.userId && entry.userId === user?.id) ||
            (entry.email && entry.email === user?.email)
          );
          
          if (hasAclAccess) return true;
        }
        
        return false;
      });
      
      setRoleSharedFiles(roleFiles);
    } catch (err) {
      console.error('Error fetching role-shared files:', err);
      setError(err.response?.data?.error || 'Failed to load role-shared files');
    } finally {
      setLoading(prev => ({ ...prev, role: false }));
    }
  };

  // Handle file download
  const handleDownload = async (fileId) => {
    setLoading(prev => ({ ...prev, download: true }));
    try {
      const response = await api.get(`/files/files/${fileId}/download`);
      const { downloadUrl, filename } = response.data.data;
      
      // Create download link
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return { success: true, url: downloadUrl };
    } catch (err) {
      console.error('Download failed:', err);
      // Try direct download if signed URL fails
      try {
        const files = activeTab === 0 ? publicFiles : roleSharedFiles;
        const file = files.find(f => f._id === fileId);
        if (file?.url) {
          const link = document.createElement('a');
          link.href = file.url;
          link.download = file.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return { success: true, url: file.url };
        }
      } catch (fallbackErr) {
        console.error('Fallback download failed:', fallbackErr);
      }
      return { success: false, error: 'Download failed' };
    } finally {
      setLoading(prev => ({ ...prev, download: false }));
    }
  };

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 0) {
      fetchPublicFiles();
    } else if (activeTab === 1) {
      fetchRoleSharedFiles();
    }
  }, [activeTab]);

  // Filter files based on search term
  const getFilteredFiles = () => {
    const files = activeTab === 0 ? publicFiles : roleSharedFiles;
    
    if (!searchTerm.trim()) return files;
    
    const term = searchTerm.toLowerCase();
    return files.filter(file =>
      file.name?.toLowerCase().includes(term) ||
      (file.ownerId?.name?.toLowerCase().includes(term) || '') ||
      (file.ownerId?.email?.toLowerCase().includes(term) || '') ||
      (file.mimeType?.toLowerCase().includes(term) || '')
    );
  };

  if (error) return <Alert message={error} type="error" />;

  return (
    <div className="min-h-screen bg-primary p-2 sm:p-4 mx-2 my-4 sm:m-6 rounded-lg shadow-md">
      {/* Tab Bar */}
      <div className="inline-flex flex-row flex-wrap items-center justify-center bg-white p-1 rounded-lg shadow-sm border border-gray-200 mb-4">
        {tabs.map((item, index) => (
          <div key={item.title} className="flex items-center">
            <button
              className={`px-4 py-2 text-sm font-medium transition-colors duration-200
                ${activeTab === index
                  ? "text-heading rounded-md bg-gray-100"
                  : "text-primary hover:text-primary hover:bg-gray-100 rounded-md"
                }`}
              onClick={() => setActiveTab(index)}
            >
              {item.title}
            </button>
            {index !== tabs.length - 1 && (
              <span className="w-px h-4 bg-gray-300 mx-1"></span>
            )}
          </div>
        ))}
      </div>

      {/* Search and View Controls */}
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
                placeholder="Search by name, owner, or type..."
                className="border-0 px-3 py-1.5 rounded-md shadow-md w-full sm:w-64 text-sm bg-secondary text-description"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <Spin spinning={activeTab === 0 ? loading.public : loading.role}>
        <FileTable
          files={getFilteredFiles()}
          onDownload={handleDownload}
          loading={loading.download}
          searchTerm={searchTerm}
        />
      </Spin>
    </div>
  );
}