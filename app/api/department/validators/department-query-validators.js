const { query } = require('express-validator/check');

const idParamValidators = require('../../../lib/validators/id-param-validators');

const departmentQueryValidators = [
  idParamValidators('company', true),
  query('name')
    .optional()
    .trim()
];

const departmentHierarchicalQueryValidators = paramName =>
  departmentQueryValidators.concat(idParamValidators(paramName));

module.exports = {
  departmentHierarchicalQueryValidators,
  departmentQueryValidators
};
