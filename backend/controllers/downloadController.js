const downloadService = require("../services/downloadService");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

const downloadFile = catchAsync(async (req, res) => {
  const fileName = req.query.fileName || req.query.filename;

  if (req.query.stream === "true") {
    return downloadService.streamBlob(req.user, req.query.blobName, fileName, res);
  }

  const url = await downloadService.getDownloadUrl(req.user, req.query.blobName, fileName);
  res.status(200).json({
    status: "success",
    url: url
  });
});

module.exports = {
  downloadFile
};
