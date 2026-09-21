const PERMISSIONS = require('../constants/permissions');
const { ForbiddenError } = require('../utils/ExpressError');

exports.requirePermission = (action) => (req, res, next) => {
  if (!req.user || !req.user.role) {
    return next(new ForbiddenError("Unauthorized access."));
  }

  const allowedRoles = PERMISSIONS[action];
  if (!allowedRoles) {
    return next(new ForbiddenError("Unknown permission requested."));
  }

  if (allowedRoles.includes('*')) {
    return next();
  }

  const userRole = req.user.role.replace(/\s+/g, '').toLowerCase();
  if (!allowedRoles.includes(userRole)) {
    return next(new ForbiddenError("You lack the permission: " + action));
  }

  next();
};
