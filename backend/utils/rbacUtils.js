/**
 * Normalizes a role string to a consistent lowercase key without spaces.
 * Example: 'Super Admin' -> 'superadmin'
 * @param {string} role - The role string to normalize
 * @returns {string} - The normalized role key
 */
const normalizeRole = (role) => {
  if (!role) return '';
  return role.replace(/\s+/g, '').toLowerCase();
};

/**
 * Checks if a user has a specific role or set of roles.
 * @param {Object|string} userOrRole - The user object or a role string
 * @param {string|string[]} targetRoles - A role or array of roles to check against
 * @returns {boolean} - True if the user has the role
 */
const hasRole = (userOrRole, targetRoles) => {
  const roleStr = typeof userOrRole === 'object' ? userOrRole?.role : userOrRole;
  if (!roleStr) return false;
  
  const normalizedUserRole = normalizeRole(roleStr);
  const normalizedTargets = Array.isArray(targetRoles) 
    ? targetRoles.map(normalizeRole) 
    : [normalizeRole(targetRoles)];
    
  return normalizedTargets.includes(normalizedUserRole);
};

const isAdmin = (user) => hasRole(user, ['superadmin', 'admin']);
const isHR = (user) => hasRole(user, ['hr']);
const isManager = (user) => hasRole(user, ['manager']);

module.exports = {
  normalizeRole,
  hasRole,
  isAdmin,
  isHR,
  isManager
};
