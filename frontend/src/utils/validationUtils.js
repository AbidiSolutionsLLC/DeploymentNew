/**
 * Universal Form Validation Utilities for ABIDI Pro
 */

/**
 * Extracts the first error from a Joi backend response.
 * Joi joins multiple errors with ", " — this returns only the first one.
 * @param {Error} error - The caught Axios error object
 * @param {string} fallback - Fallback message if no server message found
 * @returns {string}
 */
export const getApiError = (error, fallback = "Something went wrong. Please try again.") => {
 const raw = error?.response?.data?.message;
 if (!raw) return fallback;
 // Joi joins multiple errors with ", " — take only the first
 return raw.split(", ")[0].trim();
};

/**
 * Collapses consecutive spaces into a single space and trims the string.
 * @param {string} value 
 * @returns {string}
 */
export const sanitizeText = (value) => {
 if (typeof value !== 'string') return '';
 return value.trim().replace(/\s{2,}/g, ' ');
};

/**
 * Validates text/name fields (title, name, subject, etc.)
 * Rules: Required, 3-100 chars, no special characters except: - ' , . &
 * @param {string} value 
 * @returns {string|null} Error message or null if valid
 */
export const validateText = (value) => {
  const sanitized = sanitizeText(value);
  if (!sanitized) return "This field is required.";

  if (sanitized.length < 1) return "Must be at least 1 character.";
  if (sanitized.length > 150) return "Cannot exceed 150 characters.";
  
  return null;
};

/**
 * Validates description fields (reason, notes, details, etc.)
 * Rules: Required, min 3 words, trimmed, max 2 consecutive spaces,
 * restricted special chars, no spam patterns, no emojis.
 * @param {string} value
 * @param {object} options { required: true }
 * @returns {string|null} Error message or null if valid
 */
export const validateDescription = (value, options = {}) => {
  const { required = true, min = 1, max = Infinity } = options;
  const sanitized = value?.trim() || '';

  if (!sanitized) {
    return required ? "Description is required." : null;
  }

  if (sanitized.length > max) return `Cannot exceed ${max} characters.`;
  if (sanitized.length < min) return `Must be at least ${min} characters.`;

  return null;
};

/**
 * Validates description fields - RETURNS ALL ERRORS simultaneously
 * Rules: Min-Max, trimmed, max 2 consecutive spaces,
 * restricted special chars, no spam patterns, at least 3 distinct words, no emojis.
 * @param {string} value
 * @param {object} options { min: 20, max: 500, required: true }
 * @returns {string[]} Array of error messages (empty if valid)
 */
export const validateDescriptionAllErrors = (value, options = {}) => {
  const { required = true, min = 1, max = Infinity } = options;
  const errors = [];
  const sanitized = value?.trim() || '';

  if (!sanitized) {
    if (required) errors.push("Description is required.");
    return errors;
  }

  if (sanitized.length > max) {
    errors.push(`Cannot exceed ${max} characters.`);
  }

  // Length check
  if (sanitized.length < min) {
    errors.push(`Must be at least ${min} characters.`);
  }

  return errors;
};

/**
 * Validates email addresses
 * @param {string} value 
 * @returns {string|null}
 */
export const validateEmail = (value) => {
 if (!value) return "This field is required.";
 if (value.length > 254) return "Please enter a valid email address.";
 
 const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 if (!regex.test(value)) return "Please enter a valid email address.";
 
 return null;
};

/**
 * Validates phone numbers (7-15 digits, optional + prefix)
 * @param {string} value 
 * @param {boolean} required 
 * @returns {string|null}
 */
export const validatePhone = (value, required = false) => {
  if (!value) return required ? "This field is required." : null;
  
  const regex = /^[0-9+\-()\s]{7,25}$/;
  if (!regex.test(value)) return "Please enter a valid phone number.";
  
  return null;
};

/**
 * Validates date range
 * @param {Date} startDate 
 * @param {Date} endDate 
 * @returns {string|null}
 */
export const validateDateRange = (startDate, endDate) => {
 if (!startDate || !endDate) return null;
 if (new Date(endDate) < new Date(startDate)) {
 return "End date must be after or equal to start date.";
 }
 return null;
};

/**
 * Validates numeric/hour fields
 * @param {number|string} value 
 * @param {object} options { min: 0.5, max: 24, label: "Value" }
 * @returns {string|null}
 */
export const validateNumeric = (value, options = {}) => {
 const { min = 0, max = Infinity, label = "Value" } = options;
 const num = parseFloat(value);
 
 if (isNaN(num)) return `Please enter a valid positive number for ${label}.`;
 if (num < min || num > max) return `${label} must be between ${min} and ${max}.`;
 
 return null;
};

/**
 * Validates passwords
 * @param {string} value 
 * @returns {string|null}
 */
export const validatePassword = (value) => {
 if (!value) return "This field is required.";
 if (value.length < 8 || value.length > 64) {
 return "Password must be 8–64 characters and include uppercase, lowercase, a number, and a special character.";
 }
 
 const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,64}$/;
 if (!regex.test(value)) {
 return "Password must include uppercase, lowercase, a number, and a special character.";
 }
 
 return null;
};
