const { body, param } = require('express-validator/check');

const idParamValidators = require('../../../lib/validators/id-param-validators');

const departmentCreateValidators = [
  body('name').isLength({ min: 1, max: 100 }),
  param('parent')
    .optional()
    .isNumeric()
    .toInt(),
  idParamValidators('company')
];

module.exports = departmentCreateValidators;
