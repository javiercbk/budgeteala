const { param } = require('express-validator/check');

const userDetailValidators = [param('id').trim()];

module.exports = userDetailValidators;
