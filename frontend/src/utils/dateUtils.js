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
 * Converts any date into a clean YYYY-MM-DD string in EST.
 */
export const formatToESTDate = (date) => {
  if (!date) return "";
  return moment(date).tz(TIMEZONE).format('YYYY-MM-DD');
};

export { moment };
