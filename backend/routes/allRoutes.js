const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");

const {
  createLeaveRequest,
  getLeaveRequests,
  getLeaveRequestById,
  updateLeaveRequest,
  deleteLeaveRequest,
  updateLeaveStatus
} = require("../controllers/leaveRequest");

const companyController = require("../controllers/registerCompany");
const userController = require("../controllers/userController");
const projectController = require("../controllers/projectController");
const taskController = require("../controllers/taskController");
const ticketController = require("../controllers/ticketController");
const timeTrackerController = require("../controllers/timeTrackerController");

// --- User Routes ---
router.post("/users", userController.createUser);
router.get("/users", userController.getAllUsers);
router.get("/users/:id", userController.getUserById);
router.put("/users/:id", userController.updateUser);
router.delete("/users/:id", userController.deleteUser);
router.post("/users/:id/resend-invite", userController.resendInvitation);

// --- Company Routes ---
router.post("/companies", companyController.createCompany);
router.get("/companies", companyController.getAllCompanies);
router.get("/companies/:id", companyController.getCompanyById);
router.put("/companies/:id", companyController.updateCompany);
router.delete("/companies/:id", companyController.deleteCompany);

// --- Project Routes ---
router.post("/projects", projectController.createProject);
router.get("/projects", projectController.getAllProjects);
router.get("/projects/:id", projectController.getProjectById);
router.put("/projects/:id", projectController.updateProject);
router.delete("/projects/:id", projectController.deleteProject);

// --- Task Routes ---
router.post("/tasks", taskController.createTask);
router.get("/tasks", taskController.getAllTasks);
router.get("/tasks/:id", taskController.getTaskById);
router.put("/tasks/:id", taskController.updateTask);
router.delete("/tasks/:id", taskController.deleteTask);

// --- Ticket Routes (FIXED ORDER) ---
// IMPORTANT: Specific paths must come BEFORE variable paths like /:id
router.get("/tickets/all", ticketController.getAllTickets); 
router.get("/tickets", ticketController.getAllTickets); 
router.post("/ticket", ticketController.createTicket);
router.get("/ticket", ticketController.getAllTickets); // Alias
router.get("/tickets/:id", ticketController.getTicketById);
router.put("/tickets/:id", ticketController.updateTicket);
router.delete("/tickets/:id", ticketController.deleteTicket);
router.patch("/tickets/:id/status", ticketController.updateTicketStatus);
router.post("/tickets/:id/response", ticketController.addTicketResponse);

// --- Time Tracker Routes ---
router.get("/timetrackers", timeTrackerController.getAllTimeLogs); 
router.post("/timetrackers", timeTrackerController.createTimeLog);
router.get("/timetrackers/:id", timeTrackerController.getTimeLogById);
router.put("/timetrackers/:id", timeTrackerController.updateTimeLog);
router.delete("/timetrackers/:id", timeTrackerController.deleteTimeLog);
// Legacy aliases
router.get("/timeTracker", timeTrackerController.getAllTimeLogs);
router.put("/timeTracker/:id", timeTrackerController.updateTimeLog);

// --- Leave Routes (UNCOMMENTED) ---
router.post("/leaves", catchAsync(createLeaveRequest));
router.get("/getAllLeaves", catchAsync(getLeaveRequests)); // Helper for Admin Panel
router.get("/leaves", catchAsync(getLeaveRequests)); 
router.get("/leaves/:id", catchAsync(getLeaveRequestById));
router.put("/leaves/:id", catchAsync(updateLeaveRequest));
router.delete("/leaves/:id", catchAsync(deleteLeaveRequest));
router.put("/leaves/:id/status", catchAsync(updateLeaveStatus)); // For approval
router.patch("/updateLeaveStatus/:id", catchAsync(updateLeaveStatus)); // Alias

module.exports = router;
