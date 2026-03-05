const mongoose = require('mongoose'); // Added missing import
const Folder = require('../models/folder');
const File = require('../models/file');
const { cloudinary } = require('../storageConfig');
const { uploadFolderThumbnail } = require('../middlewares/uploadMiddleware');
const catchAsync = require('../utils/catchAsync');
const {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} = require("../utils/ExpressError");

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

// Get folder contents
exports.getContents = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    return next(new UnauthorizedError('Authentication required'));
  }

  let parentId;
  
  if (id === 'root') {
    // Ensure root folder exists and get its ID
    const rootFolder = await ensureRootFolder(userId);
    parentId = rootFolder._id;
  } else if (mongoose.isValidObjectId(id)) {
    parentId = id;
  } else {
    return next(new BadRequestError('Invalid folder ID'));
  }

  const [folders, files] = await Promise.all([
    Folder.find({
      parentId,
      isDeleted: false,
      $or: [
        { ownerId: userId },
        { 'acl.userId': userId }
      ]
    })
    .populate('ownerId', 'name email')
    .populate('acl.userId', 'name email')
    .sort({ name: 1 }),
    
    File.find({
      folderId: parentId,
      isDeleted: false,
      $or: [
        { ownerId: userId },
        { 'acl.userId': userId },
        { isPublic: true },
        { 'acl.email': req.user.email },
        { sharedWithRoles: { $in: req.user.roles || [] } }
      ]
    })
    .populate('ownerId', 'name email')
    .populate('acl.userId', 'name email')
    .sort({ name: 1 })
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      folders,
      files
    }
  });
});

// Create folder with optional thumbnail
exports.create = catchAsync(async (req, res, next) => {
  const { name, parentId, description } = req.body;
  
  if (!name) {
    return next(new BadRequestError('Folder name is required'));
  }

  let finalParentId = null;

  // Handle parentId logic
  if (parentId && parentId !== 'root') {
    if (mongoose.isValidObjectId(parentId)) {
      finalParentId = parentId;
    } else {
      return next(new BadRequestError('Invalid parent folder ID'));
    }
  } else {
    // If parentId is null, 'root', or empty, set as child of root folder
    const rootFolder = await ensureRootFolder(req.user.id);
    finalParentId = rootFolder._id;
  }

  const folderData = {
    name,
    parentId: finalParentId,
    ownerId: req.user.id,
    description: description || '',
    acl: [{ 
      userId: req.user.id, 
      role: 'owner', 
      accessType: 'user' 
    }]
  };

  if (req.file) {
    folderData.thumbnail = {
      cloudinaryId: req.file.public_id,
      url: req.file.path
    };
  }

  const folder = await Folder.create(folderData);

  res.status(201).json({
    status: 'success',
    data: {
      folder
    }
  });
});

// Soft delete folder
exports.softDeleteFolder = catchAsync(async (req, res, next) => {
  const { folderId } = req.params;

  const folder = await Folder.findById(folderId);
  if (!folder) {
    return next(new NotFoundError('Folder not found'));
  }

  // Only owner or admin can delete
  if (!folder.ownerId.equals(req.user.id)) {
    return next(new UnauthorizedError('Permission denied'));
  }

  // Prevent deletion of root folder
  if (folder.name === 'Root' && folder.parentId === null) {
    return next(new BadRequestError('Cannot delete root folder'));
  }

  const updatedFolder = await Folder.findByIdAndUpdate(
    folderId,
    { 
      isDeleted: true,
      deletedAt: Date.now() 
    },
    { new: true }
  );

  res.status(200).json({
    status: 'success',
    data: {
      folder: updatedFolder
    }
  });
});

// Get all folders for current user
exports.getAllFolders = catchAsync(async (req, res, next) => {
  // Ensure root folder exists for user
  await ensureRootFolder(req.user.id);
  
  const folders = await Folder.find({
    isDeleted: false,
    $or: [
      { ownerId: req.user.id },
      { 'acl.userId': req.user.id }
    ]
  })
  .populate('ownerId', 'name email')
  .populate('parentId', 'name')
  .sort({ name: 1 });

  res.status(200).json({
    status: 'success',
    results: folders.length,
    data: {
      folders
    }
  });
});