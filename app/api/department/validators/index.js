const departmentCreateValidators = require('./department-create-validators');
const departmentEditValidators = require('./department-edit-validators');
const {
  departmentHierarchicalQueryValidators,
  departmentQueryValidators
} = require('./department-query-validators');

module.exports = {
  departmentCreateValidators,
  departmentEditValidators,
  departmentHierarchicalQueryValidators,
  departmentQueryValidators
};
