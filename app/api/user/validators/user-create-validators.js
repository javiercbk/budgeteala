const { body } = require('express-validator/check');

const userQueryValidators = [
  body('email')
    .isEmail()
    .trim(),
  body('firstName').exists(),
  body('lastName').optional(),
  body('password').isLength({ min: 5 })
];

module.exports = userQueryValidators;
