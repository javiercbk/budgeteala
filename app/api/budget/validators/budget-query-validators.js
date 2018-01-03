const { query, param } = require('express-validator/check');
const { toMoment } = require('../../../lib/validators/date-validator');

const userQueryValidators = [
  param('company')
    .optional()
    .isNumeric()
    .toInt(),
  param('department')
    .isNumeric()
    .toInt(),
  query('fromStart')
    .optional()
    .isISO8601()
    .custom(toMoment),
  query('toStart')
    .optional()
    .isISO8601()
    .custom(toMoment),
  query('fromEnd')
    .optional()
    .isISO8601()
    .custom(toMoment),
  query('toEnd')
    .optional()
    .isISO8601()
    .custom(toMoment)
];

module.exports = userQueryValidators;
