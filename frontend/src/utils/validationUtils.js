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
  if (sanitized.length < 3) return "Must be at least 3 characters.";
  if (sanitized.length > 100) return "Cannot exceed 100 characters.";
  
  const regex = /^[a-zA-Z0-9\s\-'.,&]+$/;
  if (!regex.test(sanitized)) return "Special characters are not allowed.";
  
  return null;
};

/**
 * Validates description fields (reason, notes, details, etc.)
 * Rules: Min-Max (default 20-500), trimmed, max 2 consecutive spaces, 
 * restricted special chars, no spam patterns, at least 3 distinct words.
 * @param {string} value 
 * @param {object} options { min: 20, max: 500, required: true }
 * @returns {string|null} Error message or null if valid
 */
export const validateDescription = (value, options = {}) => {
  const { min = 20, max = 500, required = true } = options;
  const sanitized = value?.trim() || '';
  
  if (!sanitized) {
    return required ? "Description is required." : null;
  }
  
  if (sanitized.length < min) {
    return `Description must be at least ${min} characters. Please provide a meaningful description.`;
  }
  
  if (sanitized.length > max) {
    return `Description cannot exceed ${max} characters.`;
  }
  
  // Consecutive spaces check (max 2 allowed)
  if (/\s{3,}/.test(sanitized)) {
    return "Please avoid excessive spaces.";
  }
  
  // Restricted characters check
  // Block: @, #, $, %, ^, *, {, }, [, ], |, \, <, >, /, ~, `
  const allowedRegex = /^[a-zA-Z0-9\s.,!?'\-"():;]+$/;
  if (!allowedRegex.test(sanitized)) {
    return "Special characters like @, #, $, %, ^ are not allowed in the description.";
  }
  
  // Spam: Repeated characters (e.g. "aaaaa" or ".....")
  if (/(.)\1{4,}/.test(sanitized)) {
    return "Please enter a meaningful description.";
  }
  
  // Spam: All-caps longer than 10 characters
  const capsMatch = sanitized.match(/[A-Z]{11,}/);
  if (capsMatch) {
    return "Please enter a meaningful description.";
  }
  
  // Spam: Min 3 words
  const words = sanitized.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 3) {
    return "Description must contain at least 3 words.";
  }
  
  return null;
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
  
  const regex = /^\+?[0-9]{7,15}$/;
  if (!regex.test(value)) return "Please enter a valid phone number (7–15 digits, optional + prefix).";
  
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
