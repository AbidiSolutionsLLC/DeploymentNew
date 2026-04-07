import moment from "moment-timezone";

export const TIMEZONE = "America/New_York";

/**
 * Returns today's date formatted as YYYY-MM-DD in EST.
 * Prevents the frontend from using local browser time.
 */
export const getTodayESTString = () => {
  return moment().tz(TIMEZONE).format('YYYY-MM-DD');
};

/**
 * Safely parses a "YYYY-MM-DD" string into a Date object in LOCAL time.
 * This prevents the default browser behavior of treating it as UTC.
 */
export const parseISOToLocalDate = (dateString) => {
  if (!dateString) return new Date();
  const datePart = dateString.split('T')[0];
  if (datePart.includes('-')) {
    const [year, month, day] = datePart.split('-').map(Number);
    // month is 0-indexed in JS Date
    return new Date(year, month - 1, day);
  }
  return new Date(dateString);
};

/**
 * Formats a "YYYY-MM-DD" string for display without timezone shifting.
 */
export const formatDisplayDate = (dateString, options = {}) => {
  if (!dateString) return "-";
  const dateObj = parseISOToLocalDate(dateString);
  return dateObj.toLocaleDateString('en-US', options);
};

export { moment };
