const AbstractRouter = require('../../lib/router/abstract-router');
const idParamValidators = require('../../lib/validators/id-param-validators');
const DepartmentAPI = require('./department-api');

const budgetRouter = require('../budget/budget-router');
const budgetTransactionRouter = require('../budget-transaction/budget-transaction-router');
const expenseRouter = require('../expense/expense-router');

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
    this.router.post(
      '/:parentId/',
      departmentCreateValidators,
      this.route({
        apiCall: this.genericApiCall(DepartmentAPI, 'create')
      })
    );
    this.router.get(
      '/:id',
      [idParamValidators(), idParamValidators('customerId', true)],
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
    this.router.use('/:departmentId/budget', budgetRouter);
    this.router.use('/:departmentId/budget-transaction', budgetTransactionRouter);
    this.router.use('/:departmentId/expense', expenseRouter);
  }
}

const departmentRouter = new DepartmentRouter({ mergeParams: true });
departmentRouter.init();
module.exports = departmentRouter.router;
