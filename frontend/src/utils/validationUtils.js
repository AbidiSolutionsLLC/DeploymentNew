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

  // Check for emojis
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F170}-\u{1F1FF}]|[\u{200D}]|[\u{20E3}]|[\u{E0020}-\u{E007F}]/u;
  if (emojiRegex.test(sanitized)) return "Emojis are not allowed.";

  // Check for numbers only
  if (/^\d+$/.test(sanitized)) return "Numbers are not allowed.";

  if (sanitized.length < 5) return "Must be at least 5 characters.";
  if (sanitized.length > 100) return "Cannot exceed 100 characters.";
  
  const regex = /^[a-zA-Z0-9\s\-'.,&]+$/;
  if (!regex.test(sanitized)) return "Special characters are not allowed.";
  
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
  const { required = true } = options;
  const sanitized = value?.trim() || '';

  if (!sanitized) {
    return required ? "Description is required." : null;
  }

  // Check for emojis first
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F170}-\u{1F1FF}]|[\u{200D}]|[\u{20E3}]|[\u{E0020}-\u{E007F}]/u;
  if (emojiRegex.test(sanitized)) return "Emojis are not allowed.";

  // Min 3 words check
  const words = sanitized.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 3) {
    return "3 words are required.";
  }

  // Consecutive spaces check (max 2 allowed)
  if (/\s{3,}/.test(sanitized)) {
    return "Please avoid excessive spaces.";
  }

  // Spam checks
  if (/(.)\1{4,}/.test(sanitized)) return "Please enter a meaningful description.";
  if (/[A-Z]{11,}/.test(sanitized)) return "Please enter a meaningful description.";

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
  const { required = true, min = 10 } = options;
  const errors = [];
  const sanitized = value?.trim() || '';

  if (!sanitized) {
    if (required) errors.push("Description is required.");
    return errors;
  }

  // Check for emojis
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F170}-\u{1F1FF}]|[\u{200D}]|[\u{20E3}]|[\u{E0020}-\u{E007F}]/u;
  if (emojiRegex.test(sanitized)) {
    errors.push("Emojis are not allowed.");
  }

  // Length check
  if (sanitized.length < min) {
    errors.push(`Must be at least ${min} characters.`);
  }

  // Consecutive spaces check (max 2 allowed)
  if (/\s{3,}/.test(sanitized)) {
    errors.push("Please avoid excessive spaces.");
  }

  // Spam: Repeated characters (e.g. "aaaaa" or ".....")
  if (/(.)\1{4,}/.test(sanitized)) {
    errors.push("Please enter a meaningful description.");
  }

  // Spam: All-caps longer than 10 characters
  if (/[A-Z]{11,}/.test(sanitized)) {
    errors.push("Please enter a meaningful description.");
  }

  // Min 3 words check
  const words = sanitized.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 3) {
    errors.push("Must contain at least 3 words.");
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
