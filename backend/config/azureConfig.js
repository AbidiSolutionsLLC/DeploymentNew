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

    // Ensure CORS rules allow web clients
    await blobServiceClient.setProperties({
      cors: [
        {
          allowedOrigins: "*",
          allowedMethods: "GET,HEAD,OPTIONS",
          allowedHeaders: "*",
          exposedHeaders: "*",
          maxAgeInSeconds: 86400,
        },
      ],
    }).catch(() => {});
  } catch (err) {
    console.error("Error creating container:", err.message);
  }
})();

module.exports = {
  blobServiceClient,
  containerClient,
  containerName
};
