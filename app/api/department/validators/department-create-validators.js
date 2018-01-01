const { body } = require('express-validator/check');

const departmentCreateValidators = [
  body('name').isLength({ min: 1 }),
  body('parentId')
    .optional()
    .isNumeric()
    .toInt(),
  body('companyId')
    .isNumeric()
    .toInt()
];

module.exports = departmentCreateValidators;
