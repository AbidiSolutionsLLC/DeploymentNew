const express = require("express");
const router = express.Router();
const departmentController = require("../../controllers/departmentController");
const validate = require("../../middlewares/validationMiddleware");
const { departmentSchema } = require("../../JoiSchema/DepartmentJoiSchema");
const authMiddleware = require("../../middlewares/authMiddleware"); // Ensure you have auth

router.post("/", validate(departmentSchema), departmentController.createDepartment); // POST /api/departments
router.get("/", departmentController.getAllDepartments); // GET /api/departments
router.get("/:id", departmentController.getDepartmentById); // GET /api/departments/:id

module.exports = router;