const express = require("express");
const payrollController = require("../../controllers/payrollController");
const { isLoggedIn } = require("../../middlewares/authMiddleware");
const { requirePermission } = require("../../middlewares/permissionMiddleware");

const router = express.Router();

router.use(isLoggedIn);
router.use(requirePermission("payroll:manage"));

router.get("/preview", payrollController.previewPayroll);
router.post("/generate", payrollController.generatePayslips);
router.get("/history", payrollController.getPayslipHistory);

module.exports = router;
