const express = require("express");
const router = express.Router();
const multer = require("multer");
const { userProfileStorage } = require("../../storageConfig");
const upload = multer({ storage: userProfileStorage });
const userController = require("../../controllers/userController");
const { isLoggedIn } = require("../../middlewares/authMiddleware"); // <--- IMPORT THIS

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

router
  .route("/:id")
  .get(isLoggedIn, userController.getUserById)
  .put(isLoggedIn, upload.single("profilePhoto"), userController.updateUser)
  .delete(isLoggedIn, userController.deleteUser);

// Dashboard & Extras
router.route('/:id/dashboard-cards').get(isLoggedIn, userController.getDashboardCards);
router.route('/:id/dashboard-cards/add').post(isLoggedIn, userController.addDashboardCard);
router.route('/:id/dashboard-cards/:cardId').delete(isLoggedIn, userController.removeDashboardCard);
router.route('/:id/leaves').get(isLoggedIn, userController.getUserLeaves).put(isLoggedIn, userController.updateUserLeaves);

module.exports = router;