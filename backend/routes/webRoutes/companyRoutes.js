const express = require("express");
const router = express.Router();
const companyController = require("../../controllers/registerCompany");
const catchAsync = require("../../utils/catchAsync");

router
  .route("/")
  .post(catchAsync(companyController.createCompany))
  .get(catchAsync(companyController.getAllCompanies));

router
  .route("/:id")
  .get(catchAsync(companyController.getCompanyById))
  .put(catchAsync(companyController.updateCompany))
  .delete(catchAsync(companyController.deleteCompany));

module.exports = router;
