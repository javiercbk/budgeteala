const companyCreateValidators = require('./company-create-validators');
const idParamValidators = require('../../../lib/validators/id-param-validators');

const companyEditValidators = companyCreateValidators.concat(idParamValidators());

module.exports = companyEditValidators;
