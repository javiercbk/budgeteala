const { body, param } = require('express-validator/check');
const { toMoment } = require('../../../lib/validators/date-validator');

const expenseCreateValidators = [
  param('companyId')
    .optional()
    .isNumeric()
    .toInt(),
  param('departmentId')
    .isNumeric()
    .toInt(),
  body('amount')
    .isFloat({ min: 0 })
    .toFloat(),
  body('concept')
    .optional()
    .isLength({ max: 100 }),
  body('date')
    .isISO8601()
    .custom(toMoment)
];

module.exports = expenseCreateValidators;
