const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");

const companyController = require("../controllers/registerCompany");
const userController = require("../controllers/userController");
const projectController = require("../controllers/projectController");
const taskController = require("../controllers/taskController");
const ticketController = require("../controllers/ticketController");
const timeTrackerController = require("../controllers/timeTrackerController");
const leaveController = require("../controllers/leaveRequest");

// --- User Routes ---
router.post("/users", catchAsync(userController.createUser));
router.get("/users", catchAsync(userController.getAllUsers));
router.get("/users/:id", catchAsync(userController.getUserById));
router.put("/users/:id", catchAsync(userController.updateUser));
router.delete("/users/:id", catchAsync(userController.deleteUser));
router.post("/users/:id/resend-invite", catchAsync(userController.resendInvitation));

// --- Company Routes ---
router.post("/companies", catchAsync(companyController.createCompany));
router.get("/companies", catchAsync(companyController.getAllCompanies));
router.get("/companies/:id", catchAsync(companyController.getCompanyById));
router.put("/companies/:id", catchAsync(companyController.updateCompany));
router.delete("/companies/:id", catchAsync(companyController.deleteCompany));

// --- Project Routes ---
router.post("/projects", catchAsync(projectController.createProject));
router.get("/projects", catchAsync(projectController.getAllProjects));
router.get("/projects/:id", catchAsync(projectController.getProjectById));
router.put("/projects/:id", catchAsync(projectController.updateProject));
router.delete("/projects/:id", catchAsync(projectController.deleteProject));

// --- Task Routes ---
router.post("/tasks", catchAsync(taskController.createTask));
router.get("/tasks", catchAsync(taskController.getAllTasks));
router.get("/tasks/:id", catchAsync(taskController.getTaskById));
router.put("/tasks/:id", catchAsync(taskController.updateTask));
router.delete("/tasks/:id", catchAsync(taskController.deleteTask));

// --- Ticket Routes ---
router.get("/tickets/all", catchAsync(ticketController.getAllTickets));
router.get("/tickets", catchAsync(ticketController.getAllTickets));
router.post("/ticket", catchAsync(ticketController.createTicket));
router.get("/ticket", catchAsync(ticketController.getAllTickets));
router.get("/tickets/:id", catchAsync(ticketController.getTicketById));
router.put("/tickets/:id", catchAsync(ticketController.updateTicket));
router.delete("/tickets/:id", catchAsync(ticketController.deleteTicket));
router.patch("/tickets/:id/status", catchAsync(ticketController.updateTicketStatus));
router.post("/tickets/:id/response", catchAsync(ticketController.addTicketResponse));

// --- Time Tracker Routes ---
router.get("/timetrackers", catchAsync(timeTrackerController.getAllTimeLogs));
router.post("/timetrackers", catchAsync(timeTrackerController.createTimeLog));
router.get("/timetrackers/:id", catchAsync(timeTrackerController.getTimeLogById));
router.put("/timetrackers/:id", catchAsync(timeTrackerController.updateTimeLog));
router.delete("/timetrackers/:id", catchAsync(timeTrackerController.deleteTimeLog));

// --- Leave Routes ---
router.post("/leaves", catchAsync(leaveController.createLeaveRequest));
router.get("/leaves", catchAsync(leaveController.getLeaveRequests));
router.get("/leaves/:id", catchAsync(leaveController.getLeaveRequestById));
router.put("/leaves/:id", catchAsync(leaveController.updateLeaveRequest));
router.delete("/leaves/:id", catchAsync(leaveController.deleteLeaveRequest));
router.put("/leaves/:id/status", catchAsync(leaveController.updateLeaveStatus));
router.patch("/updateLeaveStatus/:id", catchAsync(leaveController.updateLeaveStatus));

module.exports = router;
