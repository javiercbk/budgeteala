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
  body('start')
    .isISO8601()
    .custom(toMoment),
  body('end')
    .isISO8601()
    .custom(toMoment)
];

module.exports = budgetCreateValidators;
