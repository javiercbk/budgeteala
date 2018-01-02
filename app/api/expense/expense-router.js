const AbstractRouter = require('../../lib/router/abstract-router');
const idParamValidators = require('../../lib/validators/id-param-validators');
const ExpenseAPI = require('./expense-api');

const {
  expenseCreateValidators,
  expenseEditValidators,
  expenseQueryValidators
} = require('./validators');

class ExpenseRouter extends AbstractRouter {
  init() {
    this.router.get(
      '/',
      expenseQueryValidators,
      this.route({
        apiCall: this.genericApiCall(ExpenseAPI, 'query')
      })
    );
    this.router.post(
      '/',
      expenseCreateValidators,
      this.route({
        apiCall: this.genericApiCall(ExpenseAPI, 'create')
      })
    );
    this.router.get(
      '/me',
      this.route({
        apiCall: this.genericApiCall(ExpenseAPI, 'currentExpense')
      })
    );
    this.router.get(
      '/:id',
      idParamValidators(),
      this.route({
        apiCall: this.genericApiCall(ExpenseAPI, 'query')
      })
    );
    this.router.put(
      '/:id',
      expenseEditValidators,
      this.route({
        apiCall: this.genericApiCall(ExpenseAPI, 'edit')
      })
    );
    this.router.delete(
      '/:id',
      idParamValidators(),
      this.route({
        apiCall: this.genericApiCall(ExpenseAPI, 'remove')
      })
    );
  }
}

const expenseRouter = new ExpenseRouter({ mergeParams: true });
expenseRouter.init();
module.exports = expenseRouter.router;
