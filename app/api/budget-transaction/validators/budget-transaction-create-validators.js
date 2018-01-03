const { body, param } = require('express-validator/check');
const { toMoment } = require('../../../lib/validators/date-validator');

const budgetCreateValidators = [
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
  body('status').isIn(['acknowledged', 'allocated']),
  body('date')
    .isISO8601()
    .custom(toMoment)
];

module.exports = budgetCreateValidators;
