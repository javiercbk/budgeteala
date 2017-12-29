const { param } = require('express-validator/check');

const idParamValidators = (id = 'id') => [
  param(id)
    .isNumeric()
    .toInt()
    .trim()
];

module.exports = idParamValidators;
