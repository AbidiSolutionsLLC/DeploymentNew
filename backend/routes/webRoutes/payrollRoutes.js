const express = require("express");
const payrollController = require("../../controllers/payrollController");
const { isLoggedIn, restrictTo } = require("../../middlewares/authMiddleware");

const router = express.Router();

router.use(isLoggedIn);
router.use(restrictTo("Super Admin", "Admin", "HR"));

router.get("/preview", payrollController.previewPayroll);
router.post("/generate", payrollController.generatePayslips);
router.get("/history", payrollController.getPayslipHistory);

module.exports = router;
