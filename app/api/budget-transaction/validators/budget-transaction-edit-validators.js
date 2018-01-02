const { body, param } = require('express-validator/check');
const { toMoment } = require('../../../lib/validators/date-validator');

const budgetEditValidators = [
  param('id')
    .isNumeric()
    .toInt(),
  param('companyId')
    .optional()
    .isNumeric()
    .toInt(),
  param('departmentId')
    .isNumeric()
    .toInt(),
  body('amount')
    .isNumeric()
    .toFloat(),
  body('status').isIn(['acknowledged', 'allocated', 'cancelled']),
  body('date')
    .isISO8601()
    .custom(toMoment)
];

module.exports = budgetEditValidators;
