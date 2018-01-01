const AbstractRouter = require('../../lib/router/abstract-router');
const idParamValidators = require('../../lib/validators/id-param-validators');
const DepartmentAPI = require('./department-api');

const {
  departmentCreateValidators,
  departmentEditValidators,
  departmentHierarchicalQueryValidators,
  departmentQueryValidators
} = require('./validators');

class DepartmentRouter extends AbstractRouter {
  init() {
    this.router.get(
      '/',
      departmentQueryValidators,
      this.route({
        apiCall: this.genericApiCall(DepartmentAPI, 'query')
      })
    );
    this.router.post(
      '/',
      departmentCreateValidators,
      this.route({
        apiCall: this.genericApiCall(DepartmentAPI, 'create')
      })
    );
    this.router.get(
      '/:id',
      idParamValidators(),
      this.route({
        apiCall: this.genericApiCall(DepartmentAPI, 'details')
      })
    );
    this.router.get(
      '/:parentId/department',
      departmentHierarchicalQueryValidators('parentId'),
      this.route({
        apiCall: this.genericApiCall(DepartmentAPI, 'query')
      })
    );
    this.router.put(
      '/:id',
      departmentEditValidators,
      this.route({
        apiCall: this.genericApiCall(DepartmentAPI, 'edit')
      })
    );
    this.router.delete(
      '/:id',
      idParamValidators(),
      this.route({
        apiCall: this.genericApiCall(DepartmentAPI, 'remove')
      })
    );
  }
}

const departmentRouter = new DepartmentRouter();
departmentRouter.init();
module.exports = departmentRouter.router;
