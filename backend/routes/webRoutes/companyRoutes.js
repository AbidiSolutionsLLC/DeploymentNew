const express = require("express");
const router = express.Router();
const companyController = require("../../controllers/registerCompany");
const validate = require("../../middlewares/validationMiddleware");
const { companySchema } = require("../../JoiSchema/CompanyJoiSchema");
const { isLoggedIn } = require("../../middlewares/authMiddleware");
const { requirePermission } = require("../../middlewares/permissionMiddleware");

router.use(isLoggedIn);
router.use(requirePermission("tenant:manage"));
router
  .route("/")
  .post(validate(companySchema), companyController.createCompany)
  .get(companyController.getAllCompanies);

router
  .route("/:id")
  .get(companyController.getCompanyById)
  .put(validate(companySchema), companyController.updateCompany)
  .delete(companyController.deleteCompany);

module.exports = router;
