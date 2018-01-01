const { query } = require('express-validator/check');

const companyQueryValidators = [
  query('name')
    .optional()
    .trim()
];

module.exports = companyQueryValidators;
