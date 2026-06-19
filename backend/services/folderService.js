const mongoose = require('mongoose');
const Folder = require('../models/folder');
const File = require('../models/file');
const { BadRequestError, NotFoundError, UnauthorizedError } = require("../utils/ExpressError");

class FolderService {
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
        acl: [{ userId: userId, role: 'owner', accessType: 'user' }]
      });
    }

    return rootFolder;
  }

  async getContents(user, id) {
    const userId = user.id || user._id;
    if (!userId) throw new UnauthorizedError('Authentication required');

    let parentId;
    if (id === 'root') {
      const rootFolder = await this.ensureRootFolder(userId);
      parentId = rootFolder._id;
    } else if (mongoose.isValidObjectId(id)) {
      parentId = id;
    } else {
      throw new BadRequestError('Invalid folder ID');
    }

    const [folders, files] = await Promise.all([
      Folder.find({
        parentId,
        isDeleted: false,
        $or: [{ ownerId: userId }, { 'acl.userId': userId }]
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
          { 'acl.email': user.email },
          { sharedWithRoles: { $in: user.roles || [] } }
        ]
      })
      .populate('ownerId', 'name email')
      .populate('acl.userId', 'name email')
      .sort({ name: 1 })
    ]);

    return { folders, files };
  }

  async create(user, data, file) {
    const { name, parentId, description } = data;
    if (!name) throw new BadRequestError('Folder name is required');

    let finalParentId = null;

    if (parentId && parentId !== 'root') {
      if (mongoose.isValidObjectId(parentId)) {
        finalParentId = parentId;
      } else {
        throw new BadRequestError('Invalid parent folder ID');
      }
    } else {
      const rootFolder = await this.ensureRootFolder(user.id || user._id);
      finalParentId = rootFolder._id;
    }

    const folderData = {
      name,
      parentId: finalParentId,
      ownerId: user.id || user._id,
      description: description || '',
      acl: [{ userId: user.id || user._id, role: 'owner', accessType: 'user' }]
    };

    if (file) {
      folderData.thumbnail = {
        cloudinaryId: file.public_id,
        url: file.path
      };
    }

    return Folder.create(folderData);
  }

  async softDeleteFolder(user, folderId) {
    const folder = await Folder.findById(folderId);
    if (!folder) throw new NotFoundError('Folder not found');

    if (!folder.ownerId.equals(user.id || user._id)) {
      throw new UnauthorizedError('Permission denied');
    }

    if (folder.name === 'Root' && folder.parentId === null) {
      throw new BadRequestError('Cannot delete root folder');
    }

    return Folder.findByIdAndUpdate(
      folderId,
      { isDeleted: true, deletedAt: Date.now() },
      { new: true }
    );
  }

  async getAllFolders(user) {
    await this.ensureRootFolder(user.id || user._id);
    
    return Folder.find({
      isDeleted: false,
      $or: [
        { ownerId: user.id || user._id },
        { 'acl.userId': user.id || user._id }
      ]
    })
    .populate('ownerId', 'name email')
    .populate('parentId', 'name')
    .sort({ name: 1 });
  }
}

module.exports = new FolderService();
