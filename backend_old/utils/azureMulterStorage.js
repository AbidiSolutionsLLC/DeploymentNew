// utils/azureMulterStorage.js
const { v4: uuidv4 } = require('uuid');
const path = require('path');

class AzureBlobStorage {
  constructor(options) {
    this.containerClient = options.containerClient;
    this.params = options.params || {};
  }

  _handleFile(req, file, cb) {
    (async () => {
      try {
        // Determine folder
        let folder = this.params.folder || '';
        if (typeof this.params.folder === 'function') {
          folder = await this.params.folder(req, file);
        }

        // Determine filename
        const fileExtension = path.extname(file.originalname);
        const filename = `${path.basename(file.originalname, fileExtension)}_${Date.now()}${fileExtension}`;
        const blobName = folder ? `${folder}/${filename}` : filename;

        const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

        // Upload
        await blockBlobClient.uploadStream(file.stream, undefined, undefined, {
          blobHTTPHeaders: { blobContentType: file.mimetype }
        });

        // Set file properties for Multer
        cb(null, {
          path: blockBlobClient.url,
          url: blockBlobClient.url,
          filename: blobName, // This replaces public_id
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size, // Note: stream upload might not return exact size immediately without extra calls, but multer handles this usually
          blobName: blobName
        });
      } catch (err) {
        cb(err);
      }
    })();
  }

  _removeFile(req, file, cb) {
    (async () => {
      try {
        const blockBlobClient = this.containerClient.getBlockBlobClient(file.blobName || file.filename);
        await blockBlobClient.delete();
        cb(null);
      } catch (err) {
        cb(err);
      }
    })();
  }
}

module.exports = (options) => new AzureBlobStorage(options);