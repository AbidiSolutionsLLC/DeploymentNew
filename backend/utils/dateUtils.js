const moment = require('moment-timezone');

/**
 * Default fallback timezone if neither header nor user profile is available.
 */
const FALLBACK_TIMEZONE = "America/New_York";

/**
 * Returns a Date object representing the start of the day in the given timezone.
 */
exports.getStartOfDay = (date = new Date(), timezone = FALLBACK_TIMEZONE) => {
    return moment.tz(date, timezone).startOf('day').toDate();
};

/**
 * Returns a Date object representing the end of the day in the given timezone.
 */
exports.getEndOfDay = (date = new Date(), timezone = FALLBACK_TIMEZONE) => {
    return moment.tz(date, timezone).endOf('day').toDate();
};

/**
 * Returns the current time as a Moment object in the given timezone.
 */
exports.getCurrentTime = (timezone = FALLBACK_TIMEZONE) => {
    return moment().tz(timezone);
};

/**
 * Checks if a given date is a weekend in the given timezone.
 */
exports.isWeekend = (date = new Date(), timezone = FALLBACK_TIMEZONE) => {
    const day = moment.tz(date, timezone).day();
    return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
};

/**
 * Calculate business days between two dates (excluding weekends)
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {number} Number of business days (excluding weekends)
 */
exports.calculateBusinessDays = (startDate, endDate) => {
    const start = moment.utc(startDate, 'YYYY-MM-DD').startOf('day');
    const end = moment.utc(endDate, 'YYYY-MM-DD').startOf('day');
    
    let businessDays = 0;
    let currentDate = start.clone();
    
    while (currentDate.isSameOrBefore(end, 'day')) {
        const dayOfWeek = currentDate.day();
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            businessDays++;
        }
        currentDate.add(1, 'day');
    }
    
    return businessDays;
};

exports.moment = moment;
exports.TIMEZONE = FALLBACK_TIMEZONE;
