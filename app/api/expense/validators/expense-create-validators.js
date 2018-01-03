const { body, param } = require('express-validator/check');
const { toMoment } = require('../../../lib/validators/date-validator');

const expenseCreateValidators = [
  param('company')
    .optional()
    .isNumeric()
    .toInt(),
  param('department')
    .isNumeric()
    .toInt(),
  body('amount')
    .isFloat({ gt: 0 })
    .toFloat(),
  body('concept')
    .optional()
    .isLength({ max: 100 }),
  body('date')
    .isISO8601()
    .custom(toMoment)
];

module.exports = expenseCreateValidators;
