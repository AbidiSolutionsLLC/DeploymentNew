const Joi = require('joi');
const { BadRequestError } = require('../utils/ExpressError');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const msg = error.details.map((el) => el.message).join(', ');
    throw new BadRequestError(msg);
  } else {
    next();
  }
};

module.exports = validate;
