const { param } = require('express-validator/check');
const budgetCreateValidators = require('./budget-create-validators');

const budgetEditValidators = budgetCreateValidators.concat([
  param('id')
    .isNumeric()
    .toInt()
]);

module.exports = budgetEditValidators;
