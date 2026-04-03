const express = require("express");
const router = express.Router();
const holidayController = require("../../controllers/holidayController");
const { isLoggedIn } = require("../../middlewares/authMiddleware");
const validate = require("../../middlewares/validationMiddleware");
const { holidaySchema } = require("../../JoiSchema/HolidayJoiSchema");

// Protect all holiday routes
router.use(isLoggedIn); 

router
  .route("/")
  .post(validate(holidaySchema), holidayController.createHoliday)
  .get(holidayController.getAllHolidays);

router.get("/year/:year", holidayController.getHolidaysByYear);

router
  .route("/:id")
  .get(holidayController.getHolidayById)
  .put(holidayController.updateHoliday)
  .delete(holidayController.deleteHoliday);

module.exports = router;