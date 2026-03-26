const Expense = require("../models/Expense");
const User = require("../models/userSchema");
const catchAsync = require("../utils/catchAsync");
const { BadRequestError, NotFoundError, UnauthorizedError } = require("../utils/ExpressError");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ============================================
// FILE UPLOAD CONFIGURATION
// ============================================

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
    cb(new AppError("Only images and PDF files are allowed", 400));
  }
};

// Multer upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter,
}).single("receipt");

// ============================================
// EXPENSE CONTROLLERS
// ============================================

// @desc    Create new expense
// @route   POST /api/web/expenses
// @access  Private (Manager only)
exports.createExpense = catchAsync(async (req, res, next) => {
  // Handle file upload with multer
  upload(req, res, async (err) => {
    if (err) {
      return next(new AppError(err.message, 400));
    }

    if (!req.file) {
      return next(new AppError("Receipt is required", 400));
    }

    try {
      const { title, description, amount, category } = req.body;

      // Validation
      if (!title || !amount || !category) {
        // Delete uploaded file if validation fails
        fs.unlinkSync(req.file.path);
        return next(new AppError("Please provide all required fields", 400));
      }

      // Get user name
      const user = await User.findById(req.user._id);
      if (!user) {
        fs.unlinkSync(req.file.path);
        return next(new AppError("User not found", 404));
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
    } catch (error) {
      // Delete uploaded file if expense creation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return next(error);
    }
  });
});

// @desc    Get all expenses (Admin/Superadmin see all, Managers see their own)
// @route   GET /api/web/expenses
// @access  Private
exports.getAllExpenses = catchAsync(async (req, res, next) => {
    try{
  let query;
  console.log(req.user, "req.user");
  // Check user role
  if (req.user.role === "manager") {
    // Managers see only their own expenses
    query = Expense.find({ submittedBy: req.user.id });
  } else {
    // Admins and Superadmins see all
    query = Expense.find();
  }
console.log(query, "hammad//////////////////////")
  // Sort by newest first
  query = query.sort("-createdAt");

  const expenses = await query;
console.log(expenses, "expenses");
console.log(query, "query");
return res.status(200).json({
    success: true,
    count: expenses.length,
    data: expenses,
  });
}catch(error){
  console.error("getAllExpenses Error//////////////////////////////////////:", error);
  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
}
});

// @desc    Get pending expenses (for admin approval)
// @route   GET /api/web/expenses/pending
// @access  Private (Admin/Superadmin)
exports.getPendingExpenses = catchAsync(async (req, res, next) => {
  // Check if user has admin privileges
  if (req.user.role === "manager") {
    return next(new AppError("You do not have permission to access this resource", 403));
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
    return next(new AppError("Expense not found", 404));
  }

  // Check if manager owns this expense
  if (req.user.role === "manager" && expense.submittedBy._id.toString() !== req.user._id.toString()) {
    return next(new AppError("You do not have permission to view this expense", 403));
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
    return next(new AppError("Expense not found", 404));
  }

  // Check permissions
  const isSuperAdmin = req.user.role === "superadmin";
  const isOwner = expense.submittedBy._id.toString() === req.user._id.toString();
  const isPending = expense.status === "pending";

  if (!isSuperAdmin && !(isOwner && isPending)) {
    return next(new AppError("You do not have permission to update this expense", 403));
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
// @access  Private (Admin/Superadmin)
exports.approveExpense = catchAsync(async (req, res, next) => {
  // Check if user has admin privileges
  if (req.user.role === "manager") {
    return next(new AppError("You do not have permission to approve expenses", 403));
  }

  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    return next(new AppError("Expense not found", 404));
  }

  if (expense.status !== "pending") {
    return next(new AppError("This expense has already been processed", 400));
  }

  expense.status = "approved";
  expense.approvedBy = req.user._id;
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
// @access  Private (Admin/Superadmin)
exports.rejectExpense = catchAsync(async (req, res, next) => {
  // Check if user has admin privileges
  if (req.user.role === "manager") {
    return next(new AppError("You do not have permission to reject expenses", 403));
  }

  const { reason } = req.body;

  if (!reason) {
    return next(new AppError("Rejection reason is required", 400));
  }

  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    return next(new AppError("Expense not found", 404));
  }

  if (expense.status !== "pending") {
    return next(new AppError("This expense has already been processed", 400));
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
    return next(new AppError("Expense not found", 404));
  }

  // Check permissions
  const isSuperAdmin = req.user.role === "superadmin";
  const isOwner = expense.submittedBy._id.toString() === req.user._id.toString();
  const isPending = expense.status === "pending";

  if (!isSuperAdmin && !(isOwner && isPending)) {
    return next(new AppError("You do not have permission to delete this expense", 403));
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
// @access  Private (Admin/Superadmin)
exports.getExpenseStats = catchAsync(async (req, res, next) => {
  // Check if user has admin privileges
  if (req.user.role === "manager") {
    return next(new AppError("You do not have permission to view statistics", 403));
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