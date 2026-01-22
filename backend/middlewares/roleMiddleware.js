const { ForbiddenError } = require('../utils/ExpressError');
const { error } = require('../utils/logger');


const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      error(`User with role ${req.user.role} attempted to access restricted route`);
      throw new ForbiddenError('You do not have permission to perform this action');
    }
    next();
  };
};

module.exports = { restrictTo };
