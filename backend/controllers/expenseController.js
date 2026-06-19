const expenseService = require("../services/expenseService");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

exports.createExpense = catchAsync(async (req, res) => {
  const expense = await expenseService.createExpense(req.user, req.companyId, req.body, req.file);
  res.status(201).json(ApiResponse.success(expense, "Expense created successfully"));
});

exports.getAllExpenses = catchAsync(async (req, res) => {
  const result = await expenseService.getAllExpenses(req.user, req.companyId, req.query);
  res.status(200).json(ApiResponse.success(result.data, "Expenses retrieved", {
    total: result.total,
    count: result.count,
    page: result.page,
    limit: result.limit
  }));
});

exports.getPendingExpenses = catchAsync(async (req, res) => {
  const expenses = await expenseService.getPendingExpenses(req.user, req.companyId);
  res.status(200).json(ApiResponse.success(expenses, "Pending expenses retrieved", { count: expenses.length }));
});

exports.getMyExpenses = catchAsync(async (req, res) => {
  const expenses = await expenseService.getMyExpenses(req.user._id);
  res.status(200).json(ApiResponse.success(expenses, "My expenses retrieved", { count: expenses.length }));
});

exports.getExpenseById = catchAsync(async (req, res) => {
  const expense = await expenseService.getExpenseById(req.user, req.companyId, req.params.id);
  res.status(200).json(ApiResponse.success(expense));
});

exports.updateExpense = catchAsync(async (req, res) => {
  const updatedExpense = await expenseService.updateExpense(req.user, req.companyId, req.params.id, req.body);
  res.status(200).json(ApiResponse.success(updatedExpense, "Expense updated successfully"));
});

exports.approveExpense = catchAsync(async (req, res) => {
  const expense = await expenseService.approveExpense(req.user, req.companyId, req.params.id);
  res.status(200).json(ApiResponse.success(expense, "Expense approved"));
});

exports.rejectExpense = catchAsync(async (req, res) => {
  const expense = await expenseService.rejectExpense(req.user, req.companyId, req.params.id, req.body.reason);
  res.status(200).json(ApiResponse.success(expense, "Expense rejected"));
});

exports.deleteExpense = catchAsync(async (req, res) => {
  await expenseService.deleteExpense(req.user, req.companyId, req.params.id);
  res.status(200).json(ApiResponse.success(null, "Expense deleted successfully"));
});

exports.getExpenseStats = catchAsync(async (req, res) => {
  const stats = await expenseService.getExpenseStats(req.user, req.companyId);
  res.status(200).json(ApiResponse.success(stats));
});

exports.processReceipt = catchAsync(async (req, res) => {
  const formattedData = await expenseService.processReceipt(req.file, req.body.documentType);
  res.status(200).json(ApiResponse.success(formattedData, "Receipt processed successfully"));
});

exports.exportExpenses = catchAsync(async (req, res) => {
  const csv = await expenseService.exportExpenses(req.user, req.companyId);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=expenses.csv');
  res.status(200).send(csv);
});