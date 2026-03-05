const express = require("express");
const router = express.Router();
const catchAsync = require("../utils/catchAsync");

const {
  createLeaveRequest,
  getLeaveRequests,
  getLeaveRequestById,
  updateLeaveRequest,
  deleteLeaveRequest
} = require("../controllers/leaveRequest");


const companyController = require("../controllers/registerCompany");
const userController = require("../controllers/userController");
const projectController = require("../controllers/projectController");
const taskController = require("../controllers/taskController");
// const fileController = require("../controllers/fileManagementController");
const ticketController = require("../controllers/ticketController");
const timeTrackerController = require("../controllers/timeTrackerController");


// // User Routes
// router.post("/users", userController.createUser);
// router.get("/users", userController.getAllUsers);
// router.get("/users/:id", userController.getUserById);
// router.put("/users/:id", userController.updateUser);
// router.delete("/users/:id", userController.deleteUser);

// // Company Routes
// router.post("/companies", companyController.createCompany);
// router.get("/companies", companyController.getAllCompanies);
// router.get("/companies/:id", companyController.getCompanyById);
// router.put("/companies/:id", companyController.updateCompany);
// router.delete("/companies/:id", companyController.deleteCompany);

// //Project Routes
// router.post("/projects", projectController.createProject);
// router.get("/projects", projectController.getAllProjects);
// router.get("/projects/:id", projectController.getProjectById);
// router.put("/projects/:id", projectController.updateProject);
// router.delete("/projects/:id", projectController.deleteProject);

// // Tasks Routes
// router.post("/tasks", taskController.createTask);
// router.get("/tasks", taskController.getAllTasks);
// router.get("/tasks/:id", taskController.getTaskById);
// router.put("/tasks/:id", taskController.updateTask);
// router.delete("/tasks/:id", taskController.deleteTask);

// // // File Management Controller Routes
// // router.post("/file", fileController.createFile);
// // router.get("/file", fileController.getAllFiles);
// // router.get("/file/:id", fileController.getFileById);
// // router.put("/file/:id", fileController.updateFile);
// // router.delete("/file/:id", fileController.deleteFile);

// // Ticket Routes
// router.post("/ticket", ticketController.createTicket);
// router.get("/ticket", ticketController.getAllTickets);
// router.get("/ticket/:id", ticketController.getTicketById);
// router.put("/ticket/:id", ticketController.updateTicket);
// router.delete("/ticket/:id", ticketController.deleteTicket);

// // Time Tracker Routes
// router.post("/timeTracker", timeTrackerController.createTimeLog);
// router.get("/timeTracker", timeTrackerController.getAllTimeLogs);
// router.get("/timeTracker/:id", timeTrackerController.getTimeLogById);
// router.put("/timeTracker/:id", timeTrackerController.updateTimeLog);
// router.delete("/timeTracker/:id", timeTrackerController.deleteTimeLog);

//Leave Routes
// router.post("/createLeave", catchAsync(createLeaveRequest));
// router.get("/getAllLeaves", catchAsync(getLeaveRequests));
// router.get("/getLeave/:id", catchAsync(getLeaveRequestById));
// router.put("/updateLeave/:id", catchAsync(updateLeaveRequest));
// router.delete("/deleteLeave/:id", catchAsync(deleteLeaveRequest));

module.exports = router;