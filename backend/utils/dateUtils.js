const moment = require('moment-timezone');

const TIMEZONE = "America/New_York";

/**
 * Returns a Date object representing the start of the day (00:00:00) in EST.
 */
exports.getStartOfESTDay = (date = new Date()) => {
    return moment(date).tz(TIMEZONE).startOf('day').toDate();
};

/**
 * Returns a Date object representing the end of the day (23:59:59.999) in EST.
 */
exports.getEndOfESTDay = (date = new Date()) => {
    return moment(date).tz(TIMEZONE).endOf('day').toDate();
};

/**
 * Returns the current time in EST as a Moment object.
 */
exports.getCurrentESTTime = () => {
    return moment().tz(TIMEZONE);
};

/**
 * Checks if a given date is a weekend in the EST timezone.
 */
exports.isESTWeekend = (date = new Date()) => {
    const day = moment(date).tz(TIMEZONE).day();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
};

exports.moment = moment;
exports.TIMEZONE = TIMEZONE;
