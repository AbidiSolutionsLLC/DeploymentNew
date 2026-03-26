const express = require("express");
const router = express.Router();
const expenseController = require("../../controllers/expenseController");
const catchAsync = require("../../utils/catchAsync");
const { isLoggedIn, restrictTo } = require("../../middlewares/authMiddleware");

// All routes require authentication
router.use(isLoggedIn);

// ============================================
// EXPENSE ROUTES
// ============================================

// Get statistics (admin/superadmin only)
router.get("/stats", restrictTo("admin", "superadmin"), catchAsync(expenseController.getExpenseStats));

// Get my expenses (for current user)
router.get("/my-expenses", catchAsync(expenseController.getMyExpenses));

// Get pending expenses (admin/superadmin only)
router.get("/pending", restrictTo("admin", "superadmin"), catchAsync(expenseController.getPendingExpenses));

// Main expense routes
router
  .route("/")
  .post(restrictTo("manager"), catchAsync(expenseController.createExpense))
  .get(catchAsync(expenseController.getAllExpenses));

// Single expense routes
router
  .route("/:id")
  .get(catchAsync(expenseController.getExpenseById))
  .put(catchAsync(expenseController.updateExpense))
  .delete(catchAsync(expenseController.deleteExpense));

// Approval/Rejection routes
router.put("/:id/approve", restrictTo("admin", "superadmin"), catchAsync(expenseController.approveExpense));
router.put("/:id/reject", restrictTo("admin", "superadmin"), catchAsync(expenseController.rejectExpense));

module.exports = router;