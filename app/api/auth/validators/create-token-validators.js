const { body } = require('express-validator/check');

const validatorMiddleware = [
  body('email')
    .isEmail()
    .withMessage('must be an email')
    .trim(),
  body('password', 'passwords must be at least 5 chars long and contain one number').isLength({
    min: 5
  })
];

module.exports = validatorMiddleware;
