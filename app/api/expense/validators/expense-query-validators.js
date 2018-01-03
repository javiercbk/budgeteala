const { query, param } = require('express-validator/check');
const { toMoment } = require('../../../lib/validators/date-validator');

const expenseQueryValidators = [
  param('company')
    .optional()
    .isNumeric()
    .toInt(),
  param('department')
    .isNumeric()
    .toInt(),
  query('concept')
    .optional()
    .isLength({ max: 100 }),
  query('from')
    .optional()
    .isISO8601()
    .custom(toMoment),
  query('to')
    .optional()
    .isISO8601()
    .custom(toMoment)
];

module.exports = expenseQueryValidators;
