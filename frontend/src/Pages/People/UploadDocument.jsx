"use client"
import { useState } from "react"
import { useSelector } from "react-redux"
import { Drawer, TextField, Menu, MenuItem, IconButton } from "@mui/material"
import { FiUpload, FiFolderPlus } from "react-icons/fi"
import { Spin, Alert } from "antd"
import {
  useFolderContents,
  useFileUploader,
  useFolderCreator,
  useFileDeleter,
  useFolderDeleter,
  useFileDownloader,
} from "../../Hooks/useDrive"
import { toast } from "react-toastify"
import { IoEllipsisVertical } from "react-icons/io5"
import { FaFolder, FaFile, FaDownload, FaShare, FaTrash } from "react-icons/fa"

const UploadDocument = () => {
  const [folderStack, setFolderStack] = useState([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [folderName, setFolderName] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [folderMenuAnchor, setFolderMenuAnchor] = useState(null)
  const [fileMenuAnchor, setFileMenuAnchor] = useState(null)
  const [selectedFolderId, setSelectedFolderId] = useState(null)
  const [selectedFileId, setSelectedFileId] = useState(null)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [currentFile, setCurrentFile] = useState(null)
  const [accessSettings, setAccessSettings] = useState({
    isPublic: false,
    sharedWithRoles: [],
    userEmails: []
  })

  const handleShareFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    setCurrentFile(file)
    setAccessSettings({
      isPublic: false,
      sharedWithRoles: [],
      userEmails: []
    })
    setShareModalOpen(true)
  }

  const handleOpenAccessModal = () => {
    setShareModalOpen(true)
  }

  const data = useSelector((state) => state)
  const { user } = data?.auth || {}
  
  const currentFolder = folderStack.length > 0 
    ? folderStack[folderStack.length - 1] 
    : { id: "root", name: "Root", _id: "root" }
  
  const folderId = currentFolder._id === "root" ? 'root' : currentFolder._id

  const { 
    folders = [], 
    files = [], 
    loading, 
    error, 
    reload 
  } = useFolderContents(folderId)
  
  const { create, loading: creating, error: createErr } = useFolderCreator()
  const { upload, loading: uploading, error: uploadErr, updateFileAccess } = useFileUploader()
  const { softDelete: deleteFile, loading: fileDeleteLoading } = useFileDeleter()
  const { softDelete: deleteFolder, loading: folderDeleteLoading } = useFolderDeleter()
  const { download, loading: downloadLoading } = useFileDownloader()
  
  const toggleDrawer = (open) => () => setDrawerOpen(open)

  const handleNewFolder = async () => {
    if (!folderName.trim()) {
      toast.error("Folder name is required")
      return
    }
    try {
      await create({ 
        name: folderName, 
        parentId: folderId,
        ownerId: user?._id 
      })
      setFolderName("")
      setDrawerOpen(false)
      reload()
      toast.success("Folder created successfully")
    } catch (err) {
      toast.error("Failed to create folder")
      console.error(err)
    }
  }

  const handleFileDownload = async (fileId) => {
    try {
      await download(fileId)
    } catch (err) {
      toast.error("Download failed")
      console.error(err)
    }
  }

  const handleFileChange = async (file) => {
    if (!file) return
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folderId', folderId) 
      
      await upload(formData)
      toast.success('File uploaded successfully')
      reload()
    } catch (err) {
      toast.error("File upload failed")
      console.error(err)
    }
  }

  const handleSaveAccessSettings = async () => {
    try {
      if (currentFile) {
        const formData = new FormData();
        formData.append('file', currentFile);
        formData.append('folderId', folderId); 
        formData.append('isPublic', accessSettings.isPublic);
        formData.append('sharedWithRoles', JSON.stringify(accessSettings.sharedWithRoles));
        formData.append('userEmails', JSON.stringify(accessSettings.userEmails));

        await upload(formData);
        toast.success('File uploaded with access settings!');
      } else if (selectedFileId) {
        await updateFileAccess(selectedFileId, accessSettings);
        toast.success('Access updated successfully');
      }
      
      setShareModalOpen(false);
      setCurrentFile(null);
      reload();
    } catch (err) {
      toast.error('Failed to process file');
      console.error(err);
    }
  };

  const handleOpenFolder = (folder) => {
    setFolderStack([...folderStack, folder])
  }

  const handleDeleteFile = async (fileId) => {
    console.log("Attempting to delete file:", fileId)
    if (!window.confirm("Are you sure you want to delete this file?")) return

    try {
      await deleteFile(fileId)
      toast.success("File deleted")
      reload()
      handleCloseFileMenu()
    } catch (error) {
      console.error("Delete file error:", error)
      toast.error("Failed to delete file")
    }
  }

  const handleDeleteFolder = async (folderId) => {
    console.log("Attempting to delete folder:", folderId)
    if (!window.confirm("Are you sure you want to delete this folder?")) return

    try {
      await deleteFolder(folderId)
      toast.success("Folder deleted")
      reload()
      handleCloseFolderMenu()
    } catch (error) {
      console.error("Delete folder error:", error)
      toast.error("Failed to delete folder")
    }
  }

  const handleGoBack = () => {
    if (folderStack.length === 0) return
    setFolderStack(folderStack.slice(0, -1))
  }

  const handleFolderMenuClick = (event, folderId) => {
    event.stopPropagation()
    setFolderMenuAnchor(event.currentTarget)
    setSelectedFolderId(folderId)
  }

  const handleCloseFolderMenu = () => {
    setFolderMenuAnchor(null)
    setSelectedFolderId(null)
  }

  const handleFileMenuClick = (event, fileId) => {
    event.stopPropagation()
    setFileMenuAnchor(event.currentTarget)
    setSelectedFileId(fileId)
  }

  const handleCloseFileMenu = () => {
    setFileMenuAnchor(null)
    setSelectedFileId(null)
  }

  if (error) return (
    <div className="min-h-screen bg-transparent p-2">
      <Alert message={error.message} type="error" className="bg-red-50 border-red-200" />
    </div>
  )

  return (
    <>
      {/* Share Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-sm rounded-[1.2rem] shadow-lg border border-white/50 p-6 w-full max-w-md">
            <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight mb-4">
              Share {currentFile?.name || files.find(f => f._id === selectedFileId)?.name}
            </h3>
            
            <div className="mb-4">
              <label className="flex items-center text-sm text-slate-700">
                <input 
                  type="checkbox" 
                  checked={accessSettings.isPublic}
                  onChange={(e) => setAccessSettings({
                    ...accessSettings,
                    isPublic: e.target.checked
                  })}
                  className="mr-2 h-4 w-4 text-blue-600"
                />
                Make public (anyone with link can view)
              </label>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">
                Share with roles:
              </label>
              <div className="flex flex-wrap gap-2">
                {['manager', 'employee', 'hr'].map(role => (
                  <label key={role} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={accessSettings.sharedWithRoles.includes(role)}
                      onChange={(e) => {
                        const newRoles = e.target.checked
                          ? [...accessSettings.sharedWithRoles, role]
                          : accessSettings.sharedWithRoles.filter(r => r !== role);
                        setAccessSettings({
                          ...accessSettings,
                          sharedWithRoles: newRoles
                        });
                      }}
                      className="mr-1.5 h-3.5 w-3.5 text-blue-600"
                    />
                    <span className="text-sm text-slate-700 capitalize">{role}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">
                Share with specific people:
              </label>
              <input
                type="email"
                placeholder="Enter email"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value) {
                    setAccessSettings({
                      ...accessSettings,
                      userEmails: [...accessSettings.userEmails, e.target.value]
                    });
                    e.target.value = '';
                  }
                }}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {accessSettings.userEmails.map(email => (
                  <span key={email} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-medium flex items-center">
                    {email}
                    <button
                      onClick={() => setAccessSettings({
                        ...accessSettings,
                        userEmails: accessSettings.userEmails.filter(e => e !== email)
                      })}
                      className="ml-2 text-blue-500 hover:text-blue-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShareModalOpen(false);
                  setCurrentFile(null);
                }}
                className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50/80 transition shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAccessSettings}
                className="px-4 py-2.5 bg-[#64748b] text-white rounded-xl text-sm font-medium hover:brightness-110 transition shadow-sm"
                disabled={uploading}
              >
                {uploading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer(false)}>
        <div className="w-full sm:w-80 md:w-96 h-full bg-white/95 backdrop-blur-sm p-6 flex flex-col gap-4">
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight">Create Folder</h2>
          <TextField
            label="Folder Name"
            variant="outlined"
            fullWidth
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            size="small"
            className="bg-white/80"
          />
          <button
            onClick={handleNewFolder}
            disabled={creating}
            className="mt-2 bg-[#64748b] text-white text-sm font-medium py-2.5 rounded-xl hover:brightness-110 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? "Creating…" : "Create Folder"}
          </button>
          {createErr && <Alert message={createErr.message} type="error" className="mt-2" />}
        </div>
      </Drawer>

      <div className="min-h-screen bg-transparent p-2">
        {/* Header Controls Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 mb-4 p-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-sm text-slate-600 mb-3">
            <button 
              className="hover:text-blue-600 transition"
              onClick={() => setFolderStack([])}
            >
              Root
            </button>
            {folderStack.map((folder, index) => (
              <span key={folder._id}>
                <span className="mx-1">/</span>
                <button 
                  className="hover:text-blue-600 transition"
                  onClick={() => setFolderStack(folderStack.slice(0, index + 1))}
                >
                  {folder.name}
                </button>
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-700 uppercase tracking-wide">Show</label>
                <select className="text-sm px-3 py-1.5 text-slate-700 bg-white/80 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300">
                  <option>10</option>
                  <option>25</option>
                  <option>50</option>
                </select>
                <span className="text-xs font-medium text-slate-700 uppercase tracking-wide">entries</span>
              </div>
              <input
                type="text"
                placeholder="Search files and folders..."
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white/80 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 w-full sm:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input 
                type="file" 
                onChange={(e) => handleFileChange(e.target.files[0])} 
                className="hidden" 
                id="file-upload" 
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer bg-[#64748b] text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:brightness-110 transition shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <FiUpload size={14} />
                Upload Files
              </label>
              <input 
                type="file" 
                onChange={handleShareFile} 
                className="hidden" 
                id="file-upload-with-share" 
              />
              <label
                htmlFor="file-upload-with-share"
                className="cursor-pointer bg-blue-100 text-blue-800 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-blue-200 transition shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <FaShare size={14} />
                Upload & Share
              </label>
              <button
                onClick={toggleDrawer(true)}
                className="flex items-center gap-2 bg-[#64748b] text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:brightness-110 transition shadow-sm hover:shadow-md"
              >
                <FiFolderPlus size={14} />
                New Folder
              </button>
              {folderStack.length > 0 && (
                <button 
                  onClick={handleGoBack} 
                  className="bg-slate-100 text-slate-700 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-slate-200 transition shadow-sm hover:shadow-md"
                >
                  Go Back
                </button>
              )}
            </div>
          </div>
        </div>

        {uploadErr && (
          <div className="mb-4">
            <Alert message={uploadErr.message} type="error" className="bg-red-50 border-red-200" />
          </div>
        )}

        {/* Files and Folders Grid */}
        <Spin spinning={loading || uploading || creating || fileDeleteLoading || folderDeleteLoading || downloadLoading}>
          <div className="bg-white/90 backdrop-blur-sm rounded-[1.2rem] shadow-md border border-white/50 p-4">
            {/* Show empty state if no folders and no files */}
            {folders.length === 0 && files.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="text-slate-300 text-4xl mb-3">📁</div>
                <p className="text-slate-500 text-sm font-medium">
                  {currentFolder.name === 'Root' ? 'No folders or files yet' : 'This folder is empty'}
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Upload files or create folders to get started
                </p>
              </div>
            )}

            {/* Content Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {/* Folders */}
              {folders.map((folder) => (
                <div
                  key={folder._id}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleOpenFolder(folder)
                  }}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200 hover:border-slate-200 cursor-pointer"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center min-w-0">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-800 mr-3">
                        <FaFolder size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{folder.name}</p>
                        <p className="text-xs text-slate-500">Folder</p>
                      </div>
                    </div>
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleFolderMenuClick(e, folder._id)} 
                      className="p-1 hover:bg-slate-100"
                    >
                      <IoEllipsisVertical className="text-slate-600" />
                    </IconButton>
                  </div>
                </div>
              ))}

              {/* Files */}
              {files.map((file) => (
                <div key={file._id} className="bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-200 hover:border-slate-200">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center min-w-0">
                      <div className="p-2 rounded-lg bg-green-100 text-green-800 mr-3">
                        <FaFile size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate" title={file.name}>{file.name}</p>
                        <p className="text-xs text-slate-500">
                          {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'File'}
                        </p>
                      </div>
                    </div>
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleFileMenuClick(e, file._id)} 
                      className="p-1 hover:bg-slate-100"
                    >
                      <IoEllipsisVertical className="text-slate-600" />
                    </IconButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Spin>

        {/* Folder Menu */}
        <Menu
          anchorEl={folderMenuAnchor}
          open={Boolean(folderMenuAnchor)}
          onClose={handleCloseFolderMenu}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          PaperProps={{
            className: "bg-white/95 backdrop-blur-sm border border-white/50 shadow-lg rounded-xl"
          }}
        >
          <MenuItem
            onClick={() => {
              console.log("Delete folder clicked:", selectedFolderId)
              handleDeleteFolder(selectedFolderId)
            }}
            sx={{ 
              color: "rgb(239, 68, 68)",
              fontSize: "14px",
              padding: "8px 16px"
            }}
            className="flex items-center gap-2"
          >
            <FaTrash size={14} />
            Delete
          </MenuItem>
        </Menu>

        {/* File Menu */}
        <Menu
          anchorEl={fileMenuAnchor}
          open={Boolean(fileMenuAnchor)}
          onClose={handleCloseFileMenu}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          PaperProps={{
            className: "bg-white/95 backdrop-blur-sm border border-white/50 shadow-lg rounded-xl"
          }}
        >
          <MenuItem 
            onClick={() => {
              setSelectedFileId(selectedFileId);
              handleCloseFileMenu();
              handleOpenAccessModal();
            }}
            sx={{ 
              fontSize: "14px",
              padding: "8px 16px"
            }}
            className="flex items-center gap-2 text-slate-700"
          >
            <FaShare size={14} />
            Share
          </MenuItem>
          <MenuItem
            onClick={() => {
              console.log("Download file:", selectedFileId)
              handleFileDownload(selectedFileId)
              handleCloseFileMenu()
            }}
            sx={{ 
              fontSize: "14px",
              padding: "8px 16px"
            }}
            className="flex items-center gap-2 text-slate-700"
          >
            <FaDownload size={14} />
            Download
          </MenuItem>
          <MenuItem
            onClick={() => {
              console.log("Delete file clicked:", selectedFileId)
              handleDeleteFile(selectedFileId)
            }}
            sx={{ 
              color: "rgb(239, 68, 68)",
              fontSize: "14px",
              padding: "8px 16px"
            }}
            className="flex items-center gap-2"
          >
            <FaTrash size={14} />
            Delete
          </MenuItem>
        </Menu>
      </div>
    </>
  )
}

export default UploadDocument