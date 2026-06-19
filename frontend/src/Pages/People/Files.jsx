import React, { useState, useEffect } from 'react';
import { Spin, Alert } from 'antd';
import FileTable from './FileTable';
import api from '../../axios'; // Import your axios instance
import { useSelector } from 'react-redux';
import PageContainer from "../../components/ui/PageContainer";

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
        
        // Check if file has SharedWithRoles that includes user's role
        if (file.SharedWithRoles && user?.roles && Array.isArray(user.roles)) {
          const hasRoleAccess = file.SharedWithRoles.some(role => 
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
    <PageContainer
      title="Files"
      subtitle="View and manage public and shared files"
      filters={
        <div className="flex flex-col space-y-4 w-full">
          {/* Tab Bar */}
          <div className="inline-flex flex-row flex-wrap items-center justify-start bg-white/30 backdrop-blur-md p-1.5 rounded-[1.2rem] shadow-sm border border-white/50 w-max">
            {tabs.map((item, index) => (
              <div key={item.title} className="flex items-center">
                <button
                  className={`px-5 py-2.5 text-sm font-medium transition-all duration-200 rounded-xl
                    ${activeTab === index
                      ? "text-heading bg-white shadow-sm font-bold"
                      : "text-muted hover:text-heading hover:bg-surface/50"
                    }`}
                  onClick={() => setActiveTab(index)}
                >
                  {item.title}
                </button>
              </div>
            ))}
          </div>

          {/* Search Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search by name, owner, or type..."
                className="w-full bg-white/80 backdrop-blur-sm border border-border-subtle px-4 py-2 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      }
    >
      {/* Tab Content */}
      <div className="bg-white/30 backdrop-blur-md rounded-2xl border border-white/60 shadow-[inset_0_2px_10px_rgba(255,255,255,0.3)] p-6 min-h-[400px]">
        <Spin spinning={activeTab === 0 ? loading.public : loading.role}>
          <FileTable
            files={getFilteredFiles()}
            onDownload={handleDownload}
            loading={loading.download}
            searchTerm={searchTerm}
          />
        </Spin>
      </div>
    </PageContainer>
  );
}