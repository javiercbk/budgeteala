const AbstractRouter = require('../../lib/router/abstract-router');
const idParamValidators = require('../../lib/validators/id-param-validators');
const CompanyAPI = require('./company-api');

const departmentRouter = require('../department/department-router');

const {
  companyCreateValidators,
  companyEditValidators,
  companyQueryValidators
} = require('./validators');

class CompanyRouter extends AbstractRouter {
  init() {
    this.router.get(
      '/',
      companyQueryValidators,
      this.route({
        apiCall: this.genericApiCall(CompanyAPI, 'query')
      })
    );
    this.router.post(
      '/',
      companyCreateValidators,
      this.route({
        apiCall: this.genericApiCall(CompanyAPI, 'create')
      })
    );
    this.router.get(
      '/:id',
      idParamValidators(),
      this.route({
        apiCall: this.genericApiCall(CompanyAPI, 'details')
      })
    );
    this.router.put(
      '/:id',
      companyEditValidators,
      this.route({
        apiCall: this.genericApiCall(CompanyAPI, 'edit')
      })
    );
    this.router.delete(
      '/:id',
      idParamValidators(),
      this.route({
        apiCall: this.genericApiCall(CompanyAPI, 'remove')
      })
    );
    this.router.use('/:companyId/department', departmentRouter);
  }
}

const companyRouter = new CompanyRouter();
companyRouter.init();
module.exports = companyRouter.router;
