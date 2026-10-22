// taskRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { tasksStorage } = require("../../storageConfig");
const { commonFileFilter, handleUpload } = require("../../middlewares/uploadMiddleware");
const upload = multer({
  storage: tasksStorage,
  limits: { fileSize: 100 * 1024 * 1024, files: 5 },
  fileFilter: commonFileFilter,
});
const taskController = require("../../controllers/taskController");
const { isLoggedIn, restrictTo } = require("../../middlewares/authMiddleware");
const validate = require("../../middlewares/validationMiddleware");
const { taskSchema, taskUpdateSchema, taskStatusSchema } = require("../../JoiSchema/TaskJoiSchema");

router
  .route("/")
  .post(isLoggedIn, restrictTo('Super Admin', 'Admin', 'Manager'), handleUpload(upload.array("attachments", 5)), validate(taskSchema), taskController.createTask)
  .get(isLoggedIn, taskController.getAllTasks);

router.get("/project/:projectId", isLoggedIn, taskController.getProjectTasks);
router.get("/user", isLoggedIn, taskController.getUserTasks);

router
  .route("/:id")
  .get(isLoggedIn, taskController.getTaskById)
  .put(isLoggedIn, handleUpload(upload.array("attachments", 5)), validate(taskUpdateSchema), taskController.updateTask)
  .delete(isLoggedIn, restrictTo('Super Admin', 'Admin', 'Manager'), taskController.deleteTask);

router.post("/:id/comments", isLoggedIn, handleUpload(upload.array("attachments", 5)), taskController.addComment);
router.get("/:id/comments", isLoggedIn, taskController.getTaskComments);
router.delete("/:id/comments/:commentId", isLoggedIn, taskController.deleteComment);
router.patch("/:id/status", isLoggedIn, validate(taskStatusSchema), taskController.updateTaskStatus);

module.exports = router;
