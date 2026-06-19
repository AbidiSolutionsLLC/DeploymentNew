// taskRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { tasksStorage } = require("../../storageConfig");
const upload = multer({ storage: tasksStorage });
const taskController = require("../../controllers/taskController");
const { isLoggedIn } = require("../../middlewares/authMiddleware");
const validate = require("../../middlewares/validationMiddleware");
const { taskSchema, taskUpdateSchema, taskStatusSchema } = require("../../JoiSchema/TaskJoiSchema");

router
  .route("/")
  .post(isLoggedIn, upload.array("attachments", 5), validate(taskSchema), taskController.createTask)
  .get(isLoggedIn, taskController.getAllTasks);

router.get("/project/:projectId", isLoggedIn, taskController.getProjectTasks);
router.get("/user", isLoggedIn, taskController.getUserTasks);

router
  .route("/:id")
  .get(isLoggedIn, taskController.getTaskById)
  .put(isLoggedIn, upload.array("attachments", 5), validate(taskUpdateSchema), taskController.updateTask)
  .delete(isLoggedIn, taskController.deleteTask);

router.post("/:id/comments", isLoggedIn, taskController.addComment);
router.patch("/:id/status", isLoggedIn, validate(taskStatusSchema), taskController.updateTaskStatus);

module.exports = router;
