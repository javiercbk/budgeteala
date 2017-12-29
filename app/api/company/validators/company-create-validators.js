const { body } = require('express-validator/check');

const companyCreateValidators = [body('name').isLength({ min: 1 })];

module.exports = companyCreateValidators;
