const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middlewares/authMiddleware");

// --- STEP 1: Import Controllers for the "Bridge" Routes ---
const leaveController = require("../controllers/leaveRequest");
const timesheetController = require("../controllers/timesheetController");
const expenseController = require("../controllers/expenseController"); // NEW

// --- STEP 2: Import Existing Route Files ---
const authRoutes = require("./webRoutes/authRoutes");
const userRoutes = require("./webRoutes/userRoutes");
const leaveRoutes = require("./webRoutes/leaveRoutes");
const logRoutes = require("./webRoutes/logRoutes");
const companyRoutes = require("./webRoutes/companyRoutes");
const projectRoutes = require("./webRoutes/projectRoutes");
const taskRoutes = require("./webRoutes/taskRoutes");
const ticketRoutes = require("./webRoutes/ticketRoutes");
const timeTrackerRoutes = require("./webRoutes/timeTrackerRoutes");
const holidayRoutes = require("./webRoutes/holidayRoutes");
const timeLogRoutes = require("./webRoutes/timeLogRoutes");
const timesheetRoutes = require("./webRoutes/timesheetRoutes");
const departmentRoutes = require("./webRoutes/departmentRoutes");
const adminDashboardRoutes = require("./webRoutes/adminDashboardRoutes");
const expenseRoutes = require("./webRoutes/expenseRoutes"); // NEW

// --- STEP 3: THE FIX (Bridge Routes) ---
// Fix for Leave Management
router.get("/getAllLeaves", isLoggedIn, leaveController.getLeaveRequests);

// Fix for Approve Timesheets
router.get("/getAllTimesheets", isLoggedIn, timesheetController.getAllTimesheets);
router.get("/getWeeklyTimesheets", isLoggedIn, timesheetController.getWeeklyTimesheets);

// NEW: Bridge routes for Expenses (if frontend calls root endpoints)
router.get("/getAllExpenses", isLoggedIn, expenseController.getAllExpenses);
router.get("/getPendingExpenses", isLoggedIn, expenseController.getPendingExpenses);
router.get("/getMyExpenses", isLoggedIn, expenseController.getMyExpenses);

// --- STEP 4: Standard Route Mounting ---
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/leaves", leaveRoutes);
router.use("/logs", logRoutes);
router.use("/companies", companyRoutes);
router.use("/projects", projectRoutes);
router.use("/tasks", taskRoutes);
router.use("/tickets", ticketRoutes);
router.use("/timetrackers", timeTrackerRoutes);
router.use("/holidays", holidayRoutes);
router.use("/time-logs", timeLogRoutes);
router.use("/timesheets", timesheetRoutes);
router.use("/departments", departmentRoutes);
router.use("/admin-dashboard", adminDashboardRoutes);
router.use("/expenses", expenseRoutes); // NEW

module.exports = router;