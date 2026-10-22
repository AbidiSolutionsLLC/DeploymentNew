const express = require("express");
const router = express.Router();
const multer = require("multer");
const { userProfileStorage } = require("../../storageConfig");
const upload = multer({ 
  storage: userProfileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only .jpeg, .png, and .webp formats allowed!'), false);
    }
  }
});
const userController = require("../../controllers/userController");
const todoController = require("../../controllers/todoController");
const { userUpdateSchema, userSettingsSchema } = require("../../JoiSchema/UserJoiSchema");
const {
  createTodoSchema,
  updateTodoSchema,
} = require("../../JoiSchema/TodoJoiSchema");
const validationMiddleware = require("../../middlewares/validationMiddleware");
const { isLoggedIn, restrictTo } = require("../../middlewares/authMiddleware");

// User Routes
router
  .route("/")
  .post(isLoggedIn, upload.single("profilePhoto"), userController.createUser) // Locked
  .get(isLoggedIn, userController.getAllUsers); // <--- FIXED: Added isLoggedIn (Was missing!)

// Role & Hierarchy Routes
router.get("/:role/by-role", isLoggedIn, userController.getUserByRole);
router.get('/birthdays/upcoming', isLoggedIn, userController.getUpcomingBirthdays);
router.get("/org-chart", isLoggedIn, userController.getOrgChart);

// Actions
router.post("/:id/resend-invite", isLoggedIn, userController.resendInvitation);
router.post('/:id/upload-avatar', isLoggedIn, upload.single('avatar'), userController.uploadAvatar);
router.post('/:id/upload-cover', isLoggedIn, upload.single('coverImage'), userController.uploadCover);

// Search & Specific User
router.route("/search").get(isLoggedIn, userController.getUserById);

// My Profile & Settings (Must come before /:id)
router.put('/profile', isLoggedIn, userController.updateMyProfile);
router.put('/settings', isLoggedIn, validationMiddleware(userSettingsSchema), userController.updateMySettings);
router.get('/settings/notifications', isLoggedIn, userController.getNotificationSettings);
router.put('/project-portal-access', isLoggedIn, restrictTo('Super Admin', 'Admin'), userController.updateProjectPortalAccess);

router.get("/:id/summary", isLoggedIn, userController.getUserSummary);

router
  .route("/:id")
  .get(isLoggedIn, userController.getUserById)
  .put(isLoggedIn, upload.single("profilePhoto"), validationMiddleware(userUpdateSchema), userController.updateUser)
  .delete(isLoggedIn, userController.deleteUser);

// Dashboard & Extras
router.route('/:id/dashboard-cards').get(isLoggedIn, userController.getDashboardCards);
router.route('/:id/dashboard-cards/add').post(isLoggedIn, userController.addDashboardCard);
router.route('/:id/dashboard-cards/:cardId').delete(isLoggedIn, userController.removeDashboardCard);
router
  .route("/:id/todos")
  .get(isLoggedIn, todoController.getUserTodos)
  .post(isLoggedIn, validationMiddleware(createTodoSchema), todoController.createTodo);
router
  .route("/:id/todos/:todoId")
  .put(isLoggedIn, validationMiddleware(updateTodoSchema), todoController.updateTodo)
  .delete(isLoggedIn, todoController.deleteTodo);
router.route('/:id/leaves').get(isLoggedIn, userController.getUserLeaves).put(isLoggedIn, userController.updateUserLeaves);
router.route('/:id/leaves/history').get(isLoggedIn, userController.getUserLeaveHistory);

module.exports = router;