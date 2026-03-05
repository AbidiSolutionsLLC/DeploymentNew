const moment = require('moment-timezone');

const TIMEZONE = "America/New_York";

/**
 * Returns a Date object representing the start of the day (00:00:00) in the specified timezone,
 * but converted to a JS Date object (which will technically be UTC timestamp, e.g. 05:00 UTC).
 * This ensures that "Today" is consistently defined by the wall-clock time in New York.
 * 
 * @param {Date|string} date - The date to convert (defaults to now)
 * @returns {Date} - Javascript Date object representing 00:00 EST/EDT
 */
exports.getStartOfESTDay = (date = new Date()) => {
    return moment(date).tz(TIMEZONE).startOf('day').toDate();
};

/**
 * Returns a Date object representing the end of the day (23:59:59.999) in the specified timezone.
 * 
 * @param {Date|string} date - The date to convert (defaults to now)
 * @returns {Date} - Javascript Date object representing end of EST/EDT day
 */
exports.getEndOfESTDay = (date = new Date()) => {
    return moment(date).tz(TIMEZONE).endOf('day').toDate();
};

/**
 * Returns the current time in the specified timezone as a Moment object.
 */
exports.getCurrentESTTime = () => {
    return moment().tz(TIMEZONE);
};

exports.moment = moment;
exports.TIMEZONE = TIMEZONE;
