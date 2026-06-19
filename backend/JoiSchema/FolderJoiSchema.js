const Joi = require("joi");

const folderSchema = Joi.object({
  name: Joi.string().trim().min(1).max(150).required().messages({
    'string.empty': 'Folder name is required.',
    'any.required': 'Folder name is required.'
  }),
  parentId: Joi.string().allow(null, "", "root").optional(),
  description: Joi.string().trim().allow("", null).optional()
});

module.exports = { folderSchema };
