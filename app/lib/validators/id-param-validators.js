const { param } = require('express-validator/check');

const idParamValidators = (id = 'id', optional = false) => {
  let validator = param(id)
    .isNumeric()
    .toInt()
    .trim();
  if (optional) {
    validator = validator.optional();
  }
  return [validator];
};

module.exports = idParamValidators;
