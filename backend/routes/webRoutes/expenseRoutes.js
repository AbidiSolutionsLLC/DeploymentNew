const express = require("express");
const router = express.Router();
const expenseController = require("../../controllers/expenseController");
const { isLoggedIn, restrictTo } = require("../../middlewares/authMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directory exists
const uploadDir = "./uploads/receipts";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `receipt-${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only images and PDF files are allowed"));
  }
};

// Multer upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter,
}).single("receipt");

// All routes require authentication
router.use(isLoggedIn);

// ============================================
// EXPENSE ROUTES
// ============================================

// Get statistics (admin/manager/superadmin only)
router.get("/stats", restrictTo("admin", "manager", "superadmin"), expenseController.getExpenseStats);

// Get my expenses (for current user)
router.get("/my-expenses", expenseController.getMyExpenses);

// Get pending expenses (admin/manager/superadmin only)
router.get("/pending", restrictTo("admin", "manager", "superadmin"), expenseController.getPendingExpenses);

// Main expense routes
router
  .route("/")
  .post(upload, expenseController.createExpense)
  .get(expenseController.getAllExpenses);

// Single expense routes
router
  .route("/:id")
  .get(expenseController.getExpenseById)
  .put(expenseController.updateExpense)
  .delete(expenseController.deleteExpense);

// Approval/Rejection routes
router.put("/:id/approve", restrictTo("admin", "manager", "superadmin"), expenseController.approveExpense);
router.put("/:id/reject", restrictTo("admin", "manager", "superadmin"), expenseController.rejectExpense);

module.exports = router;