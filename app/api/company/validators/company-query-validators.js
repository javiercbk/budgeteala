const { query } = require('express-validator/check');

const userQueryValidators = [
  query('name')
    .optional()
    .trim()
];

module.exports = userQueryValidators;
