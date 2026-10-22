const { generateBlobSasUrl } = require("../utils/azureDownload");
const { blobServiceClient, containerName } = require("../config/azureConfig");
const { BadRequestError } = require("../utils/ExpressError");
const logger = require("../utils/logger");

class DownloadService {
  normalizeBlobName(blobNameInput) {
    let blobName = blobNameInput;

    if (!blobName) {
      throw new BadRequestError("Blob name is required");
    }

    if (blobName.startsWith("http")) {
      try {
        const urlObj = new URL(blobName);
        const pathParts = urlObj.pathname.split("/");
        blobName = decodeURIComponent(pathParts.slice(2).join("/"));
      } catch (err) {
        throw new BadRequestError("Invalid blob URL or name");
      }
    }

    blobName = decodeURIComponent(blobName);

    if (blobName.includes("..")) {
      throw new BadRequestError("Invalid blob name pattern");
    }

    return blobName;
  }

  async getDownloadUrl(user, blobNameInput, fileName) {
    const blobName = this.normalizeBlobName(blobNameInput);
    const sasUrl = await generateBlobSasUrl(blobName, fileName);

    logger.info(`Secure download link generated for blob: ${blobName} by user: ${user?.upn || user?.name || "unknown"}`);

    return sasUrl;
  }

  async streamBlob(user, blobNameInput, fileName, res) {
    const blobName = this.normalizeBlobName(blobNameInput);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobClient = containerClient.getBlobClient(blobName);

    const exists = await blobClient.exists();
    if (!exists) {
      throw new BadRequestError("File does not exist in storage");
    }

    const downloadResponse = await blobClient.download(0);
    const cleanFileName = fileName || blobName.split("/").pop() || "downloaded_file";
    const safeName = cleanFileName.replace(/[^\w\.\-\s]/gi, '_');

    res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
    res.setHeader("Content-Type", downloadResponse.contentType || "application/octet-stream");
    if (downloadResponse.contentLength) {
      res.setHeader("Content-Length", downloadResponse.contentLength);
    }

    logger.info(`Streaming blob: ${blobName} for user: ${user?.upn || user?.name || "unknown"}`);
    downloadResponse.readableStreamBody.pipe(res);
  }
}

module.exports = new DownloadService();
