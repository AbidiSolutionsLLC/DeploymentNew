const { 
  BlobServiceClient, 
  BlobSASPermissions, 
  generateBlobSasUrl 
} = require("@azure/storage-blob");
const { blobServiceClient, containerName } = require("../config/azureConfig");

/**
 * Generates a short-lived SAS URL for a specific blob in Azure Storage.
 * @param {string} blobName - The name or path of the blob in the container.
 * @returns {Promise<string>} - The SAS URL.
 */
const generateBlobSasUrlHelper = async (blobName) => {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobClient = containerClient.getBlobClient(blobName);

  // Set SAS permissions: Read only
  const permissions = new BlobSASPermissions();
  permissions.read = true;

  // Set SAS expiry: 5 minutes from now
  const expiryTime = new Date();
  expiryTime.setMinutes(expiryTime.getMinutes() + 5);

  const sasUrl = await generateBlobSasUrl({
    containerName,
    blobName,
    permissions,
    expiresOn: expiryTime,
  }, blobServiceClient.credential);

  return sasUrl;
};

module.exports = { generateBlobSasUrl: generateBlobSasUrlHelper };
