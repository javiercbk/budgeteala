const { body, param } = require('express-validator/check');

const idParamValidators = require('../../../lib/validators/id-param-validators');

const departmentCreateValidators = [
  body('name').isLength({ min: 1 }),
  param('parentId')
    .optional()
    .isNumeric()
    .toInt(),
  idParamValidators('customerId', true)
];

module.exports = departmentCreateValidators;
