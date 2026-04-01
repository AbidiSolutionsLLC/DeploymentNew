const { generateBlobSasUrl } = require("../utils/azureDownload");
const catchAsync = require("../utils/catchAsync");
const { BadRequestError } = require("../utils/ExpressError");
const logger = require("../utils/logger");

/**
 * Controller to generate a secure, short-lived download URL for an Azure Blob.
 */
const downloadFile = catchAsync(async (req, res) => {
  let { blobName } = req.query;

  if (!blobName) {
    throw new BadRequestError("Blob name is required");
  }

  // Handle full Azure Blob URLs (e.g., https://<account>.blob.core.windows.net/<container>/<path>)
  if (blobName.startsWith("http")) {
    try {
      const urlObj = new URL(blobName);
      const pathParts = urlObj.pathname.split("/");
      // The first part is empty (starts with /), the second is the container name
      // Everything after that is the blob path, which needs to be decoded for the Azure SDK
      blobName = decodeURIComponent(pathParts.slice(2).join("/"));
    } catch (err) {
      throw new BadRequestError("Invalid blob URL or name");
    }
  }

  // Final decode for direct blob names: ensure it's in its literal form
  blobName = decodeURIComponent(blobName);

  // Sanitize blobName: Prevent path traversal
  if (blobName.includes("..")) {
    throw new BadRequestError("Invalid blob name pattern");
  }

  const sasUrl = await generateBlobSasUrl(blobName);

  logger.info(`Secure download link generated for blob: ${blobName} by user: ${req.user?.upn || "unknown"}`);

  res.status(200).json({
    status: "success",
    url: sasUrl
  });
});

module.exports = {
  downloadFile
};
