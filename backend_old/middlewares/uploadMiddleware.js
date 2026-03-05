const multer = require('multer');
const { fileStorage, folderStorage } = require('../storageConfig');
const {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} = require("../utils/ExpressError");

// Allowed file types with extensions
const ALLOWED_FILE_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/jpg': 'jpg',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'text/plain': 'txt'
};

// File upload middleware
const uploadFile = multer({
  storage: fileStorage,
  limits: { 
    fileSize: 25 * 1024 * 1024, // 25MB limit (Cloudinary's max for unsigned uploads)
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_FILE_TYPES[file.mimetype]) {
      return cb(new BadRequestError(400, `File type ${file.mimetype} not allowed`), false);
    }
    cb(null, true);
  }
}).single('file');

// Folder thumbnail upload middleware
const uploadFolderThumbnail = multer({
  storage: folderStorage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new BadRequestError(400, 'Only images are allowed for folder thumbnails'), false);
    }
    cb(null, true);
  }
}).single('thumbnail');

// Error handling wrapper
const handleUpload = (uploadFunction) => {
  return (req, res, next) => {
    uploadFunction(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new BadRequestError(400, 'File too large'));
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return next(new BadRequestError(400, 'Only one file allowed per upload'));
          }
          return next(new BadRequestError(400, `Upload error: ${err.message}`));
        }
        return next(err);
      }
      
      // Additional validation for successful upload
      if (req.fileValidationError) {
        return next(new BadRequestError(400, req.fileValidationError));
      }
      
      next();
    });
  };
};

module.exports = {
  uploadFile: handleUpload(uploadFile),
  uploadFolderThumbnail: handleUpload(uploadFolderThumbnail),
  ALLOWED_FILE_TYPES
};