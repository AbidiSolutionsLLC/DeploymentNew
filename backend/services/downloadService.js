const { generateBlobSasUrl } = require("../utils/azureDownload");
const { BadRequestError } = require("../utils/ExpressError");
const logger = require("../utils/logger");

class DownloadService {
  async getDownloadUrl(user, blobNameInput) {
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

    const sasUrl = await generateBlobSasUrl(blobName);

    logger.info(`Secure download link generated for blob: ${blobName} by user: ${user?.upn || "unknown"}`);

    return sasUrl;
  }
}

module.exports = new DownloadService();
