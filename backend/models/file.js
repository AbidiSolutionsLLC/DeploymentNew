const mongoose = require('mongoose');
const aclSchema = require('./aclSchema');

const fileSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'File name is required'],
    trim: true
  },
  folderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Folder',
    default: null // null means root folder
  }, 
  cloudinaryId: { 
    type: String, 
  },
  url: { 
    type: String, 
    required: [true, 'File URL is required']
  },
  size: { 
    type: Number, 
    required: [true, 'File size is required'],
    min: 0
  },
  mimeType: { 
    type: String, 
    required: [true, 'MIME type is required']
  },
  ownerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Owner ID is required']
  },
  acl: {
    type: [aclSchema],
    default: []
  },
  isDeleted: { 
    type: Boolean, 
    default: false 
  },
  isPublic: { 
    type: Boolean, 
    default: false 
  },
  sharedWithRoles: {
    type: [String],
    default: []
  },
  // Optional metadata
  description: {
    type: String,
    default: ''
  },
  tags: {
    type: [String],
    default: []
  }
}, { 
  timestamps: true,
  // Add virtual for file extension
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for file extension
fileSchema.virtual('extension').get(function() {
  return this.name.split('.').pop().toLowerCase();
});

// Virtual for human readable file size
fileSchema.virtual('formattedSize').get(function() {
  const bytes = this.size;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Indexes for better query performance
fileSchema.index({ 'acl.userId': 1 });
fileSchema.index({ 'acl.email': 1 });
fileSchema.index({ ownerId: 1 });
fileSchema.index({ folderId: 1 });
fileSchema.index({ isDeleted: 1 });
fileSchema.index({ isPublic: 1 });
fileSchema.index({ createdAt: -1 });
fileSchema.index({ name: 'text' }); // For text search

// Compound indexes
fileSchema.index({ ownerId: 1, isDeleted: 1 });
fileSchema.index({ folderId: 1, isDeleted: 1 });

// Pre-save middleware to ensure owner is in ACL
fileSchema.pre('save', function(next) {
  if (this.isNew) {
    // Ensure owner is always in ACL with owner role
    const ownerAcl = this.acl.find(entry => 
      entry.userId && entry.userId.equals(this.ownerId)
    );
    
    if (!ownerAcl) {
      this.acl.push({
        userId: this.ownerId,
        role: 'owner',
        accessType: 'user'
      });
    }
  }
  next();
});

// Instance method to check if user has permission
fileSchema.methods.hasPermission = function(user, requiredPermission = 'viewer') {
  // Public files are viewable by everyone
  if (this.isPublic && requiredPermission === 'viewer') return true;
  
  // Owner has all permissions
  if (this.ownerId.equals(user._id || user.id)) return true;

  // Check ACL for user ID
  const userAcl = this.acl.find(entry => 
    entry.userId && entry.userId.equals(user._id || user.id)
  );
  if (userAcl) {
    if (requiredPermission === 'viewer') return true;
    if (requiredPermission === 'editor' && userAcl.role !== 'viewer') return true;
  }

  // Check ACL for email
  if (user.email) {
    const emailAcl = this.acl.find(entry => entry.email === user.email);
    if (emailAcl) {
      if (requiredPermission === 'viewer') return true;
      if (requiredPermission === 'editor' && emailAcl.role !== 'viewer') return true;
    }
  }

  // Check role-based permissions
  if (this.sharedWithRoles?.some(role => user.roles?.includes(role))) {
    return true;
  }

  return false;
};

// Static method to find accessible files for a user
fileSchema.statics.findAccessible = function(user, options = {}) {
  const query = {
    isDeleted: false,
    $or: [
      { ownerId: user._id || user.id },
      { isPublic: true },
      { 'acl.userId': user._id || user.id },
      { 'acl.email': user.email }
    ]
  };

  if (user.roles && user.roles.length > 0) {
    query.$or.push({ sharedWithRoles: { $in: user.roles } });
  }

  if (options.folderId !== undefined) {
    query.folderId = options.folderId;
  }

  return this.find(query);
};

// Add to the schema definition:
fileSchema.virtual('isImage').get(function() {
  return this.mimeType.startsWith('image/');
});

// Add this method to generate different types of URLs
fileSchema.methods.getUrl = function(options = {}) {
  const defaultOptions = {
    secure: true,
    sign_url: options.download ? false : !this.isPublic,
    resource_type: this.isImage ? 'image' : 'raw',
    ...options
  };

  if (options.download) {
    defaultOptions.attachment = true;
    defaultOptions.filename = this.name;
  }

  return cloudinary.url(this.cloudinaryId, defaultOptions);
};

module.exports = mongoose.model('File', fileSchema);