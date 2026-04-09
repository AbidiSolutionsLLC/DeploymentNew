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

/**
 * Format a Date object to YYYY-MM-DD string for API
 * Uses local time components to avoid timezone shifts
 * @param {Date} date - Date object to format
 * @returns {string} Formatted date string (YYYY-MM-DD)
 */
export const formatDateForAPI = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Calculate working days between two dates (excluding weekends)
 * Counts Monday (1) through Friday (5) only
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} Number of working days (excluding weekends)
 */
export const calculateWorkingDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  
  let count = 0;
  // Create new dates and normalize to midnight to avoid time-based issues
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  current.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    const day = current.getDay();
    // Count only weekdays (Monday=1 to Friday=5), skip Sunday (0) and Saturday (6)
    if (day !== 0 && day !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};
