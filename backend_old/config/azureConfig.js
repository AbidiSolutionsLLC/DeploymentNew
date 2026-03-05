// config/azureConfig.js
require('dotenv').config();

const { BlobServiceClient } = require("@azure/storage-blob");


const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING
);

const containerName = process.env.AZURE_CONTAINER_NAME || "abidipro-files";
const containerClient = blobServiceClient.getContainerClient(containerName);

(async () => {
  try {
    await containerClient.createIfNotExists(); 
    console.log(`Connected to Azure Container: ${containerName}`);
  } catch (err) {
    console.error("Error creating container:", err.message);
  }
})();

module.exports = {
  blobServiceClient,
  containerClient,
  containerName
};