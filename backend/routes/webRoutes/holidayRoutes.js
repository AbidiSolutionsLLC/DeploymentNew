const express = require("express");
const router = express.Router();
const holidayController = require("../../controllers/holidayController");
const { isLoggedIn, restrictTo } = require("../../middlewares/authMiddleware");
const validate = require("../../middlewares/validationMiddleware");
const { holidaySchema } = require("../../JoiSchema/HolidayJoiSchema");

const holidayRestrict = restrictTo('Super Admin', 'Admin', 'HR');

// Protect all holiday routes
router.use(isLoggedIn); 

router
  .route("/")
  .post(holidayRestrict, validate(holidaySchema), holidayController.createHoliday)
  .get(holidayController.getAllHolidays);

router.get("/year/:year", holidayController.getHolidaysByYear);

router
  .route("/:id")
  .get(holidayController.getHolidayById)
  .put(holidayRestrict, validate(holidaySchema), holidayController.updateHoliday)
  .delete(holidayRestrict, holidayController.deleteHoliday);

module.exports = router;