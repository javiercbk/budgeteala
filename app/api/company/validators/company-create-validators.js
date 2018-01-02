const { body } = require('express-validator/check');

const companyCreateValidators = [body('name').isLength({ min: 1, max: 100 })];

module.exports = companyCreateValidators;
