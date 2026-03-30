const Expense = require("../models/Expense");
const User = require("../models/userSchema");
const catchAsync = require("../utils/catchAsync");
const { BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError } = require("../utils/ExpressError");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// @desc    Create new expense
// @route   POST /api/web/expenses
// @access  Private (Manager only)
exports.createExpense = catchAsync(async (req, res, next) => {
  if (!req.file) {
    throw new BadRequestError("Receipt is required");
  }

  const { title, description, amount, category } = req.body;

  // Validation
  if (!title || !amount || !category) {
    // Delete uploaded file if validation fails
    if (req.file) fs.unlinkSync(req.file.path);
    throw new BadRequestError("Please provide all required fields");
  }

  // Get user name
  const user = await User.findById(req.user._id);
  if (!user) {
    if (req.file) fs.unlinkSync(req.file.path);
    throw new NotFoundError("User");
  }

  // Create expense
  const expense = await Expense.create({
    title,
    description: description || "",
    amount: parseFloat(amount),
    category,
    receiptUrl: `/uploads/receipts/${req.file.filename}`,
    receiptPublicId: req.file.filename,
    submittedBy: req.user._id,
    submittedByName: user.name,
  });

  res.status(201).json({
    success: true,
    data: expense,
  });
});

// @desc    Get all expenses (Admin/Superadmin see all, Managers see their own)
// @route   GET /api/web/expenses
// @access  Private
exports.getAllExpenses = catchAsync(async (req, res, next) => {
  let query;
  
  const userRole = req.user.role.replace(/\s+/g, '').toLowerCase();
  
  if (userRole === "manager") {
    query = Expense.find({ submittedBy: req.user.id });
  } else {
    query = Expense.find();
  }

  query = query.sort("-createdAt");
  const expenses = await query;

  res.status(200).json({
    success: true,
    count: expenses.length,
    data: expenses,
  });
});

// @desc    Get pending expenses (for admin/manager approval)
// @route   GET /api/web/expenses/pending
// @access  Private (Admin/Manager/Superadmin)
exports.getPendingExpenses = catchAsync(async (req, res, next) => {
  const userRole = req.user.role.replace(/\s+/g, '').toLowerCase();
  if (userRole === "employee" || userRole === "technician" || userRole === "hr") {
    throw new ForbiddenError("You do not have permission to access this resource");
  }

  const expenses = await Expense.find({ status: "pending" }).sort("-createdAt");

  res.status(200).json({
    success: true,
    count: expenses.length,
    data: expenses,
  });
});

// @desc    Get current user's expenses
// @route   GET /api/web/expenses/my-expenses
// @access  Private
exports.getMyExpenses = catchAsync(async (req, res, next) => {
  const expenses = await Expense.find({ submittedBy: req.user._id }).sort("-createdAt");

  res.status(200).json({
    success: true,
    count: expenses.length,
    data: expenses,
  });
});

// @desc    Get single expense
// @route   GET /api/web/expenses/:id
// @access  Private
exports.getExpenseById = catchAsync(async (req, res, next) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    throw new NotFoundError("Expense");
  }

  const userRole = req.user.role.replace(/\s+/g, '').toLowerCase();
  // Check if manager owns this expense
  if (userRole === "manager" && expense.submittedBy._id.toString() !== req.user._id.toString()) {
    throw new ForbiddenError("You do not have permission to view this expense");
  }

  res.status(200).json({
    success: true,
    data: expense,
  });
});

// @desc    Update expense (Superadmin only or Manager for pending expenses)
// @route   PUT /api/web/expenses/:id
// @access  Private
exports.updateExpense = catchAsync(async (req, res, next) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    throw new NotFoundError("Expense");
  }

  const userRole = req.user.role.replace(/\s+/g, '').toLowerCase();
  // Check permissions
  const isSuperAdmin = userRole === "superadmin";
  const isOwner = expense.submittedBy._id.toString() === req.user._id.toString();
  const isPending = expense.status === "pending";

  if (!isSuperAdmin && !(isOwner && isPending)) {
    throw new ForbiddenError("You do not have permission to update this expense");
  }

  // Fields that can be updated
  const allowedUpdates = ["title", "description", "amount", "category"];
  if (isSuperAdmin) {
    allowedUpdates.push("status", "rejectionReason");
  }

  // Filter updates
  const updates = {};
  Object.keys(req.body).forEach((key) => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  // If status is being updated to approved, set approvedBy
  if (updates.status === "approved" && isSuperAdmin) {
    updates.approvedBy = req.user._id;
    updates.approvedByName = req.user.name;
    updates.approvedAt = Date.now();
  }

  // Update expense
  const updatedExpense = await Expense.findByIdAndUpdate(
    req.params.id,
    updates,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    data: updatedExpense,
  });
});

// @desc    Approve expense
// @route   PUT /api/web/expenses/:id/approve
// @access  Private (Admin/Manager/Superadmin)
exports.approveExpense = catchAsync(async (req, res, next) => {
  const userRole = req.user.role.replace(/\s+/g, '').toLowerCase();
  if (userRole === "employee" || userRole === "technician" || userRole === "hr") {
    throw new ForbiddenError("You do not have permission to approve expenses");
  }

  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    throw new NotFoundError("Expense");
  }

  if (expense.status !== "pending") {
    throw new BadRequestError("This expense has already been processed");
  }

  expense.status = "approved";
  expense.approvedBy = req.user._id || req.user.id;
  expense.approvedByName = req.user.name;
  expense.approvedAt = Date.now();

  await expense.save();

  res.status(200).json({
    success: true,
    data: expense,
  });
});

// @desc    Reject expense
// @route   PUT /api/web/expenses/:id/reject
// @access  Private (Admin/Manager/Superadmin)
exports.rejectExpense = catchAsync(async (req, res, next) => {
  const userRole = req.user.role.replace(/\s+/g, '').toLowerCase();
  if (userRole === "employee" || userRole === "technician" || userRole === "hr") {
    throw new ForbiddenError("You do not have permission to reject expenses");
  }

  const { reason } = req.body;

  if (!reason) {
    throw new BadRequestError("Rejection reason is required");
  }

  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    throw new NotFoundError("Expense");
  }

  if (expense.status !== "pending") {
    throw new BadRequestError("This expense has already been processed");
  }

  expense.status = "rejected";
  expense.rejectionReason = reason;

  await expense.save();

  res.status(200).json({
    success: true,
    data: expense,
  });
});

// @desc    Delete expense
// @route   DELETE /api/web/expenses/:id
// @access  Private (Superadmin or Manager for pending expenses)
exports.deleteExpense = catchAsync(async (req, res, next) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    throw new NotFoundError("Expense");
  }

  const userRole = req.user.role.replace(/\s+/g, '').toLowerCase();
  // Check permissions
  const isSuperAdmin = userRole === "superadmin";
  const isOwner = expense.submittedBy._id.toString() === req.user._id.toString();
  const isPending = expense.status === "pending";

  if (!isSuperAdmin && !(isOwner && isPending)) {
    throw new ForbiddenError("You do not have permission to delete this expense");
  }

  // Delete receipt file
  if (expense.receiptUrl) {
    const filePath = path.join(__dirname, "../../", expense.receiptUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  await expense.deleteOne();

  res.status(200).json({
    success: true,
    message: "Expense deleted successfully",
  });
});

// @desc    Get expense statistics
// @route   GET /api/web/expenses/stats
// @access  Private (Admin/Manager/Superadmin)
exports.getExpenseStats = catchAsync(async (req, res, next) => {
  const userRole = req.user.role.replace(/\s+/g, '').toLowerCase();
  if (userRole === "employee" || userRole === "technician" || userRole === "hr") {
    throw new ForbiddenError("You do not have permission to view statistics");
  }

  const stats = await Expense.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);

  // Get pending expenses count
  const pendingCount = stats.find(s => s._id === "pending")?.count || 0;
  const approvedCount = stats.find(s => s._id === "approved")?.count || 0;
  const rejectedCount = stats.find(s => s._id === "rejected")?.count || 0;

  // Get total expenses count
  const totalCount = await Expense.countDocuments();

  // Get total approved amount
  const totalApproved = stats.find(s => s._id === "approved")?.totalAmount || 0;
  const totalPending = stats.find(s => s._id === "pending")?.totalAmount || 0;

  res.status(200).json({
    success: true,
    data: {
      total: totalCount,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      totalApproved,
      totalPending,
      stats,
    },
  });
});