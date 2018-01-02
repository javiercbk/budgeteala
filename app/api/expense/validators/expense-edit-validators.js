const { param } = require('express-validator/check');
const expenseCreateValidators = require('./expense-create-validators');

const expenseEditValidators = expenseCreateValidators.concat([
  param('id')
    .isNumeric()
    .toInt()
]);

module.exports = expenseEditValidators;
