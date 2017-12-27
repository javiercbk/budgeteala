const { body } = require('express-validator/check');

const userQueryValidators = [
  body('email')
    .optional()
    .trim(),
  body('name')
    .optional()
    .trim()
];

module.exports = userQueryValidators;
