const userCreateValidators = require('./user-create-validators');
const idParamValidators = require('../../../lib/validators/id-param-validators');

const userEditValidators = userCreateValidators.concat(idParamValidators());

module.exports = userEditValidators;
