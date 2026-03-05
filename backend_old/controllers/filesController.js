const File = require('../models/file');
const User = require('../models/userSchema');
const Folder = require('../models/folder');
const { cloudinary } = require('../storageConfig');
const { uploadFile, uploadFolderThumbnail, ALLOWED_FILE_TYPES } = require('../middlewares/uploadMiddleware');
const {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} = require("../utils/ExpressError");
const catchAsync = require('../utils/catchAsync');

// Helper function to ensure root folder exists
const ensureRootFolder = async (userId) => {
  let rootFolder = await Folder.findOne({
    name: 'Root',
    ownerId: userId,
    parentId: null,
    isDeleted: false
  });

  if (!rootFolder) {
    rootFolder = await Folder.create({
      name: 'Root',
      ownerId: userId,
      parentId: null,
      acl: [{ 
        userId: userId, 
        role: 'owner', 
        accessType: 'user' 
      }]
    });
  }

  return rootFolder;
};

// Helper function to check permissions
const checkPermission = async (file, user, requiredPermission = 'viewer') => {
  // Public files are viewable by everyone for viewer permission
  if (file.isPublic && requiredPermission === 'viewer') return true;
  
  // Owner has all permissions
  if (file.ownerId.equals(user._id || user.id)) return true;

  // Check ACL entries
  const hasAccess = file.acl.some(entry => {
    // Check by user ID
    if (entry.userId && entry.userId.equals(user._id || user.id)) {
      return requiredPermission === 'viewer' || 
             (requiredPermission === 'editor' && entry.role !== 'viewer');
    }
    
    // Check by email
    if (entry.email && entry.email === user.email) {
      return requiredPermission === 'viewer' || 
             (requiredPermission === 'editor' && entry.role !== 'viewer');
    }
    
    return false;
  });

  if (hasAccess) return true;

  // Check role-based permissions
  if (file.sharedWithRoles && user.roles) {
    return file.sharedWithRoles.some(role => user.roles.includes(role));
  }

  return false;
};

// Register a file (for direct creation without upload)
exports.register = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new BadRequestError('No file uploaded'));
  }

  const {
    originalname: name,
    public_id: cloudinaryId,
    path: url,
    size,
    mimetype: mimeType
  } = req.file;
  

  let { folderId, isPublic, sharedWithRoles } = req.body;

  if (!name || !cloudinaryId || !url || !size || !mimeType) {
    return next(new BadRequestError('Missing required file fields'));
  }

  // If no folderId provided or it's 'root', ensure root folder exists
  if (!folderId || folderId === 'root') {
    const rootFolder = await ensureRootFolder(req.user.id);
    folderId = rootFolder._id;
  }

  const file = await File.create({
    name,
    folderId,
    cloudinaryId,
    url,
    size,
    mimeType,
    ownerId: req.user.id,
    isPublic: !!isPublic,
    sharedWithRoles: Array.isArray(sharedWithRoles) ? sharedWithRoles : [],
    acl: [{ 
      userId: req.user.id, 
      role: 'owner', 
      accessType: 'user' 
    }]
  });

  res.status(201).json({
    status: 'success',
    data: {
      file
    }
  });
});

// Generate secure download URL
exports.downloadUrl = catchAsync(async (req, res, next) => {
  const file = await File.findById(req.params.fileId);
  if (!file || file.isDeleted) {
    return next(new NotFoundError('File not found'));
  }

  const hasAccess = await checkPermission(file, req.user, 'viewer');
  if (!hasAccess) {
    return next(new UnauthorizedError('Access denied'));
  }

  // Generate signed URL that expires in 5 minutes
  const downloadUrl = cloudinary.url(file.cloudinaryId, {
    resource_type: file.mimeType.startsWith('image/') ? "image" : "raw",
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 300, // 5 minutes
    attachment: true,
    filename: file.name
  });

  res.json({
    status: 'success',
    data: {
      downloadUrl,
      filename: file.name,
      expiresAt: Date.now() + 300000 // 5 minutes in milliseconds
    }
  });
});

// Soft delete a file
exports.softDeleteFile = catchAsync(async (req, res, next) => {
  const { fileId } = req.params;

  const file = await File.findById(fileId);
  if (!file) return next(new NotFoundError('File not found'));

  const canDelete = await checkPermission(file, req.user, 'editor');
  if (!canDelete) return next(new UnauthorizedError('Permission denied'));

  const updatedFile = await File.findByIdAndUpdate(
    fileId,
    { isDeleted: true, deletedAt: Date.now() },
    { new: true }
  );

  res.json({
    status: 'success',
    data: {
      file: updatedFile
    }
  });
});

// Upload a file
exports.upload = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new BadRequestError('No file uploaded'));
  }

  // Parse and validate input
  let { folderId, isPublic } = req.body;
  
  let sharedWithRoles = [];
  let userEmails = [];
  
  try {
    sharedWithRoles = req.body.sharedWithRoles 
      ? JSON.parse(req.body.sharedWithRoles) 
      : [];
    
    userEmails = req.body.userEmails 
      ? JSON.parse(req.body.userEmails) 
      : [];
    
    if (!Array.isArray(sharedWithRoles)) sharedWithRoles = [];
    if (!Array.isArray(userEmails)) userEmails = [];
  } catch (err) {
    return next(new BadRequestError('Invalid sharedWithRoles or userEmails format'));
  }

  if (!folderId || folderId === 'root') {
    const rootFolder = await ensureRootFolder(req.user.id);
    folderId = rootFolder._id;
  }

  try {
    const file = await File.create({
      name: req.file.originalname,
      folderId,
      cloudinaryId: req.file.public_id,
      url: req.file.path,
      size: req.file.size,
      mimeType: req.file.mimetype,
      ownerId: req.user.id,
      isPublic: isPublic === 'true',
      acl: [
        { 
          userId: req.user.id, 
          role: 'owner', 
          accessType: 'user' 
        },
        ...userEmails.map(email => ({
          email,
          role: 'viewer',
          accessType: 'email'
        }))
      ],
      sharedWithRoles
    });

    res.status(201).json({
      status: 'success',
      data: {
        file
      }
    });
  } catch (error) {
    try {
      await cloudinary.uploader.destroy(req.file.public_id);
    } catch (err) {
      console.error('Failed to cleanup uploaded file:', err);
    }
    next(error);
  }
});

// Update file access controls
exports.updateAccess = catchAsync(async (req, res, next) => {
  const { fileId } = req.params;
  const { isPublic, sharedWithRoles = [], userEmails = [] } = req.body;

  const file = await File.findById(fileId);
  if (!file) {
    return next(new NotFoundError('File not found'));
  }

  if (!file.ownerId.equals(req.user._id || req.user.id)) {
    return next(new UnauthorizedError('Only the owner can update access controls'));
  }

  file.isPublic = isPublic === 'true';
  file.sharedWithRoles = Array.isArray(sharedWithRoles) ? sharedWithRoles : [];
  
  const existingNonEmailAcl = file.acl.filter(entry => !entry.email);
  const newEmailAcl = userEmails
    .filter(email => !file.acl.some(entry => entry.email === email))
    .map(email => ({
      email,
      role: 'viewer',
      accessType: 'email'
    }));
  
  file.acl = [
    ...existingNonEmailAcl,
    ...newEmailAcl
  ];

  await file.save();

  res.status(200).json({
    status: 'success',
    data: {
      file
    }
  });
});

// Get all files accessible to the current user
exports.getAccessibleFiles = catchAsync(async (req, res, next) => {

  await ensureRootFolder(req.user.id);
  
  const files = await File.findAccessible(req.user)
    .populate('ownerId', 'name email')
    .populate('folderId', 'name')
    .sort({ createdAt: -1 });
  
  res.status(200).json({
    status: 'success',
    results: files.length,
    data: files 
  });
});

// Get public files
exports.getPublicFiles = catchAsync(async (req, res, next) => {
  const files = await File.find({ 
    isPublic: true,
    isDeleted: false 
  })
  .populate('ownerId', 'name email')
  .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: files.length,
    data: {
      files
    }
  });
});

// Get files shared with current user (excluding owned files)
exports.getSharedWithMe = catchAsync(async (req, res, next) => {
  const files = await File.find({
    isDeleted: false,
    ownerId: { $ne: req.user.id },
    $or: [
      { 'acl.email': req.user.email },
      { 'acl.userId': req.user.id },
      { sharedWithRoles: { $in: req.user.roles || [] } }
    ]
  })
  .populate('ownerId', 'name email')
  .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: files.length,
    data: {
      files
    }
  });
});

// Get files owned by current user
exports.getMyFiles = catchAsync(async (req, res, next) => {

  await ensureRootFolder(req.user.id);
  
  const files = await File.find({ 
    ownerId: req.user.id, 
    isDeleted: false 
  })
  .populate('folderId', 'name')
  .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: files.length,
    data: {
      files
    }
  });
});