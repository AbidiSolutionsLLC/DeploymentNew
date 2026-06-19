const downloadService = require("../services/downloadService");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

const downloadFile = catchAsync(async (req, res) => {
  const url = await downloadService.getDownloadUrl(req.user, req.query.blobName);
  res.status(200).json({
    status: "success",
    url: url
  });
});

module.exports = {
  downloadFile
};
