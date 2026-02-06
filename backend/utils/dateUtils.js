const moment = require('moment-timezone');

/**
 * Strictly define the company timezone to Eastern Standard Time.
 * All attendance and timesheet logic will anchor to this.
 */
const TIMEZONE = "America/New_York";

/**
 * Returns a Date object representing the start of the day (00:00:00) in EST.
 * Prevents local/UTC conversion shifts.
 */
exports.getStartOfESTDay = (date = new Date()) => {
    return moment.tz(date, TIMEZONE).startOf('day').toDate();
};

/**
 * Returns a Date object representing the end of the day (23:59:59.999) in EST.
 * Useful for building 24-hour database query windows.
 */
exports.getEndOfESTDay = (date = new Date()) => {
    return moment.tz(date, TIMEZONE).endOf('day').toDate();
};

/**
 * Returns the current time in EST as a Moment object.
 * Used for check-in/out logic.
 */
exports.getCurrentESTTime = () => {
    return moment().tz(TIMEZONE);
};

/**
 * Checks if a given date is a weekend in the EST timezone.
 * Used to restrict check-ins on Saturday and Sunday.
 */
exports.isESTWeekend = (date = new Date()) => {
    const day = moment.tz(date, TIMEZONE).day();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
};

/**
 * Export raw moment and TIMEZONE string for use in controller validation logic.
 * Needed for exports like moment(date).tz(TIMEZONE).format('YYYY-MM-DD').
 */
exports.moment = moment;
exports.TIMEZONE = TIMEZONE;
