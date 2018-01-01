const departmentCreateValidators = require('./department-create-validators');
const idParamValidators = require('../../../lib/validators/id-param-validators');

const departmentEditValidators = departmentCreateValidators.concat(idParamValidators());

module.exports = departmentEditValidators;
