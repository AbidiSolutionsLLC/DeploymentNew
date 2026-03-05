// projectRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { projectsStorage } = require("../../storageConfig");
const upload = multer({ storage: projectsStorage });
const projectController = require("../../controllers/projectController");
const { isLoggedIn } = require("../../middlewares/authMiddleware");

router
  .route("/")
  .post(isLoggedIn, upload.array("attachments", 5), projectController.createProject)
  .get(isLoggedIn, projectController.getAllProjects);

router.get("/user", isLoggedIn, projectController.getUserProjects);

router
  .route("/:id")
  .get(isLoggedIn, projectController.getProjectById)
  .put(isLoggedIn, upload.array("attachments", 5), projectController.updateProject)
  .delete(isLoggedIn, projectController.deleteProject);

module.exports = router;