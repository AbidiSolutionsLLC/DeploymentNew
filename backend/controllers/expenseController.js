const Expense = require("../models/Expense");
const User = require("../models/userSchema");
const catchAsync = require("../utils/catchAsync");
const { BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError } = require("../utils/ExpressError");
const { processReceipt, processInvoice } = require("../utils/azureDocumentIntelligence");
const { containerClient } = require("../config/azureConfig");

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
    // Delete uploaded blob from Azure if validation fails
    if (req.file && (req.file.blobName || req.file.filename)) {
      try {
        const blobToDelete = req.file.blobName || req.file.filename;
        const blockBlobClient = containerClient.getBlockBlobClient(blobToDelete);
        await blockBlobClient.deleteIfExists();
      } catch (err) {
        console.error("Failed to cleanup Azure blob after validation failure:", err);
      }
    }
    throw new BadRequestError("Please provide all required fields");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new NotFoundError("User");
  }

  // Create expense
  const expense = await Expense.create({
    title,
    description: description || "",
    amount: parseFloat(amount),
    category,
    receiptUrl: req.file.url || req.file.path,
    receiptPublicId: req.file.blobName || req.file.filename,
    blobName: req.file.blobName,
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

  // Delete receipt blob from Azure
  if (expense.blobName || expense.receiptPublicId) {
    try {
      const blobToDelete = expense.blobName || expense.receiptPublicId;
      const blockBlobClient = containerClient.getBlockBlobClient(blobToDelete);
      await blockBlobClient.deleteIfExists();
    } catch (err) {
      console.error("Failed to delete expense receipt from Azure:", err);
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

// @desc    Process receipt image and extract expense data
// @route   POST /api/web/expenses/process-receipt
// @access  Private
exports.processReceipt = catchAsync(async (req, res, next) => {
  if (!req.file) {
    throw new BadRequestError("Receipt image is required");
  }

  // Get the document type (receipt or invoice)
  const { documentType } = req.body;
  const isInvoice = documentType === "invoice";

  // Get the file buffer from memory storage
  const fileBuffer = req.file.buffer;

  if (!fileBuffer) {
    throw new BadRequestError("Failed to read uploaded file");
  }

  let extractedData;

  try {
    // Process with Azure Document Intelligence
    if (isInvoice) {
      extractedData = await processInvoice(fileBuffer);
    } else {
      extractedData = await processReceipt(fileBuffer);
    }

    // Build formatted description with items, prices, and quantities
    let description = "";
    if (extractedData.merchantAddress || extractedData.vendorAddress) {
      description += (extractedData.merchantAddress || extractedData.vendorAddress) + "\n";
    }
    
    // Add items list with quantities and prices
    if (extractedData.items && extractedData.items.length > 0) {
      description += "\nItems:\n";
      extractedData.items.forEach((item, index) => {
        const qty = item.quantity || 1;
        const price = item.price || item.unitPrice || 0;
        const total = item.totalPrice || item.amount || 0;
        const itemDesc = item.description || `Item ${index + 1}`;
        description += `- ${itemDesc} (Qty: ${qty}) - $${price.toFixed(2)} each = $${total.toFixed(2)}\n`;
      });
    }
    
    // Add totals
    if (extractedData.subtotal) {
      description += `\nSubtotal: $${extractedData.subtotal.toFixed(2)}`;
    }
    if (extractedData.tax) {
      description += `\nTax: $${extractedData.tax.toFixed(2)}`;
    }
    if (extractedData.tip) {
      description += `\nTip: $${extractedData.tip.toFixed(2)}`;
    }
    if (extractedData.total) {
      description += `\nTotal: $${extractedData.total.toFixed(2)}`;
    }

    // Format the response for frontend consumption
    const formattedData = {
      title: extractedData.merchant || extractedData.vendor || "",
      description: description.trim(),
      amount: extractedData.total || 0,
      category: "other", // Default category, user can change
      vendor: extractedData.merchant || extractedData.vendor || "",
      date: extractedData.date || new Date().toISOString(),
      currency: extractedData.currency || "USD",
      items: extractedData.items || [],
      subtotal: extractedData.subtotal || 0,
      tax: extractedData.tax || 0,
      tip: extractedData.tip || 0,
      confidence: extractedData.confidence || 0,
      raw: extractedData // Include raw data for reference
    };

    res.status(200).json({
      success: true,
      message: "Receipt processed successfully",
      data: formattedData,
    });
  } catch (error) {
    if (error.message.includes("Azure Document Intelligence API key")) {
      throw new BadRequestError("Azure Document Intelligence service is not configured");
    }

    if (error.message.includes("No receipt data found") || error.message.includes("No invoice data found")) {
      throw new BadRequestError("Could not extract data from the image. Please ensure the image is clear and try again.");
    }

    throw new BadRequestError(error.message || "Failed to process receipt");
  }
});