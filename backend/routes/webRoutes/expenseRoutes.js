const express = require("express");
const router = express.Router();
const expenseController = require("../../controllers/expenseController");
const { isLoggedIn, restrictTo } = require("../../middlewares/authMiddleware");
const { expensesStorage } = require("../../storageConfig");
const { commonFileFilter, handleUpload } = require("../../middlewares/uploadMiddleware");
const validate = require("../../middlewares/validationMiddleware");
const { expenseSchema, rejectExpenseSchema } = require("../../JoiSchema/ExpenseJoiSchema");
const multer = require("multer");
const path = require("path");

// Multer upload middleware
const upload = multer({
  storage: expensesStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: commonFileFilter
}).single("receipt");

// Multer upload middleware for receipt processing (temporary upload)
const uploadForProcessing = multer({
  storage: multer.memoryStorage(), // Use memory storage for processing
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for receipt processing
  fileFilter: commonFileFilter
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
  .post(validate(expenseSchema), handleUpload(upload), expenseController.createExpense)
  .get(expenseController.getAllExpenses);

// Single expense routes
router
  .route("/:id")
  .get(expenseController.getExpenseById)
  .put(expenseController.updateExpense)
  .delete(expenseController.deleteExpense);

// Approval/Rejection routes
router.put("/:id/approve", restrictTo("admin", "manager", "superadmin"), expenseController.approveExpense);
router.put("/:id/reject", restrictTo("admin", "manager", "superadmin"), validate(rejectExpenseSchema), expenseController.rejectExpense);

// Receipt processing route (for Azure Document Intelligence)
router.post("/process-receipt", handleUpload(uploadForProcessing), expenseController.processReceipt);

module.exports = router;