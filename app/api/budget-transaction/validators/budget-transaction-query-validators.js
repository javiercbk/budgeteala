const { query, param } = require('express-validator/check');
const { toMoment } = require('../../../lib/validators/date-validator');

const budgetQueryValidators = [
  param('companyId')
    .optional()
    .isNumeric()
    .toInt(),
  param('departmentId')
    .isNumeric()
    .toInt(),
  query('from')
    .optional()
    .isISO8601()
    .custom(toMoment),
  query('to')
    .optional()
    .isISO8601()
    .custom(toMoment)
];

module.exports = budgetQueryValidators;
