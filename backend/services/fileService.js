const File = require('../models/file');
const Folder = require('../models/folder');
const { BadRequestError, NotFoundError, UnauthorizedError } = require("../utils/ExpressError");
const { generateBlobSasUrlHelper } = require('../utils/azureDownload');

class FileService {
  async ensureRootFolder(userId) {
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
  }

  async checkPermission(file, user, requiredPermission = 'viewer') {
    if (file.isPublic && requiredPermission === 'viewer') return true;
    if (file.ownerId.equals(user._id || user.id)) return true;

    const hasAccess = file.acl.some(entry => {
      if (entry.userId && entry.userId.equals(user._id || user.id)) {
        return requiredPermission === 'viewer' || 
               (requiredPermission === 'editor' && entry.role !== 'viewer');
      }
      
      if (entry.email && entry.email === user.email) {
        return requiredPermission === 'viewer' || 
               (requiredPermission === 'editor' && entry.role !== 'viewer');
      }
      
      return false;
    });

    if (hasAccess) return true;

    if (file.sharedWithRoles && user.roles) {
      return file.sharedWithRoles.some(role => user.roles.includes(role));
    }

    return false;
  }

  async register(user, fileData, bodyData) {
    const { originalname: name, public_id: cloudinaryId, path: url, size, mimetype: mimeType } = fileData;
    let { folderId, isPublic, sharedWithRoles } = bodyData;

    if (!name || !cloudinaryId || !url || !size || !mimeType) {
      throw new BadRequestError('Missing required file fields');
    }

    if (!folderId || folderId === 'root') {
      const rootFolder = await this.ensureRootFolder(user.id || user._id);
      folderId = rootFolder._id;
    }

    const file = await File.create({
      name,
      folderId,
      cloudinaryId,
      url,
      size,
      mimeType,
      ownerId: user.id || user._id,
      isPublic: !!isPublic,
      sharedWithRoles: Array.isArray(sharedWithRoles) ? sharedWithRoles : [],
      acl: [{ 
        userId: user.id || user._id, 
        role: 'owner', 
        accessType: 'user' 
      }]
    });

    return file;
  }

  async getDownloadUrl(user, fileId) {
    const file = await File.findById(fileId);
    if (!file || file.isDeleted) throw new NotFoundError('File not found');

    const hasAccess = await this.checkPermission(file, user, 'viewer');
    if (!hasAccess) throw new UnauthorizedError('Access denied');

    const blobName = file.cloudinaryId || file.blobName;
    if (!blobName) throw new BadRequestError('Blob identifier not found for this file');

    const sasUrl = await generateBlobSasUrlHelper(blobName);

    return {
      downloadUrl: sasUrl,
      filename: file.name,
      expiresAt: Date.now() + 300000
    };
  }

  async softDeleteFile(user, fileId) {
    const file = await File.findById(fileId);
    if (!file) throw new NotFoundError('File not found');

    const canDelete = await this.checkPermission(file, user, 'editor');
    if (!canDelete) throw new UnauthorizedError('Permission denied');

    return File.findByIdAndUpdate(
      fileId,
      { isDeleted: true, deletedAt: Date.now() },
      { new: true }
    );
  }

  async upload(user, fileData, bodyData) {
    let { folderId, isPublic, sharedWithRoles, userEmails } = bodyData;
    
    try {
      sharedWithRoles = sharedWithRoles ? JSON.parse(sharedWithRoles) : [];
      userEmails = userEmails ? JSON.parse(userEmails) : [];
      if (!Array.isArray(sharedWithRoles)) sharedWithRoles = [];
      if (!Array.isArray(userEmails)) userEmails = [];
    } catch (err) {
      throw new BadRequestError('Invalid sharedWithRoles or userEmails format');
    }

    if (!folderId || folderId === 'root') {
      const rootFolder = await this.ensureRootFolder(user.id || user._id);
      folderId = rootFolder._id;
    }

    try {
      return await File.create({
        name: fileData.originalname,
        folderId,
        cloudinaryId: fileData.public_id,
        url: fileData.path,
        size: fileData.size,
        mimeType: fileData.mimetype,
        ownerId: user.id || user._id,
        isPublic: isPublic === 'true',
        acl: [
          { userId: user.id || user._id, role: 'owner', accessType: 'user' },
          ...userEmails.map(email => ({ email, role: 'viewer', accessType: 'email' }))
        ],
        sharedWithRoles
      });
    } catch (error) {
      try {
        if (fileData && (fileData.blobName || fileData.filename)) {
          const { containerClient } = require('../config/azureConfig');
          const blockBlobClient = containerClient.getBlockBlobClient(fileData.blobName || fileData.filename);
          await blockBlobClient.delete();
        }
      } catch (err) {
        console.error('Failed to cleanup uploaded file:', err);
      }
      throw error;
    }
  }

  async updateAccess(user, fileId, bodyData) {
    const { isPublic, sharedWithRoles = [], userEmails = [] } = bodyData;

    const file = await File.findById(fileId);
    if (!file) throw new NotFoundError('File not found');

    if (!file.ownerId.equals(user._id || user.id)) {
      throw new UnauthorizedError('Only the owner can update access controls');
    }

    file.isPublic = isPublic === 'true' || isPublic === true;
    file.sharedWithRoles = Array.isArray(sharedWithRoles) ? sharedWithRoles : [];
    
    const existingNonEmailAcl = file.acl.filter(entry => !entry.email);
    const newEmailAcl = userEmails
      .filter(email => !file.acl.some(entry => entry.email === email))
      .map(email => ({ email, role: 'viewer', accessType: 'email' }));
    
    file.acl = [...existingNonEmailAcl, ...newEmailAcl];

    return file.save();
  }

  async getAccessibleFiles(user) {
    await this.ensureRootFolder(user.id || user._id);
    return File.findAccessible(user)
      .populate('ownerId', 'name email')
      .populate('folderId', 'name')
      .sort({ createdAt: -1 });
  }

  async getPublicFiles() {
    return File.find({ isPublic: true, isDeleted: false })
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 });
  }

  async getSharedWithMe(user) {
    return File.find({
      isDeleted: false,
      ownerId: { $ne: user.id || user._id },
      $or: [
        { 'acl.email': user.email },
        { 'acl.userId': user.id || user._id },
        { sharedWithRoles: { $in: user.roles || [] } }
      ]
    })
    .populate('ownerId', 'name email')
    .sort({ createdAt: -1 });
  }

  async getMyFiles(user) {
    await this.ensureRootFolder(user.id || user._id);
    return File.find({ ownerId: user.id || user._id, isDeleted: false })
      .populate('folderId', 'name')
      .sort({ createdAt: -1 });
  }
}

module.exports = new FileService();
