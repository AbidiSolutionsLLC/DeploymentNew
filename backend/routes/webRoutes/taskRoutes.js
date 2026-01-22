// taskRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { tasksStorage } = require("../../storageConfig");
const upload = multer({ storage: tasksStorage });
const taskController = require("../../controllers/taskController");
const { isLoggedIn } = require("../../middlewares/authMiddleware");

router
  .route("/")
  .post(isLoggedIn, upload.array("attachments", 5), taskController.createTask)
  .get(isLoggedIn, taskController.getAllTasks);

router.get("/project/:projectId", isLoggedIn, taskController.getProjectTasks);
router.get("/user", isLoggedIn, taskController.getUserTasks);

router
  .route("/:id")
  .get(isLoggedIn, taskController.getTaskById)
  .put(isLoggedIn, upload.array("attachments", 5), taskController.updateTask)
  .delete(isLoggedIn, taskController.deleteTask);

router.post("/:id/comments", isLoggedIn, taskController.addComment);

module.exports = router;
