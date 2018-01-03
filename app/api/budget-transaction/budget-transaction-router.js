const AbstractRouter = require('../../lib/router/abstract-router');
const idParamValidators = require('../../lib/validators/id-param-validators');
const BudgetTransactionAPI = require('./budget-transaction-api');

const {
  budgetTransactionCreateValidators,
  budgetTransactionEditValidators,
  budgetTransactionQueryValidators
} = require('./validators');

class BudgetTransactionRouter extends AbstractRouter {
  init() {
    this.router.get(
      '/',
      budgetTransactionQueryValidators,
      this.route({
        apiCall: this.genericApiCall(BudgetTransactionAPI, 'query')
      })
    );
    this.router.post(
      '/',
      budgetTransactionCreateValidators,
      this.route({
        apiCall: this.genericApiCall(BudgetTransactionAPI, 'create')
      })
    );
    this.router.get(
      '/:id',
      [idParamValidators('company', true), idParamValidators('department'), idParamValidators()],
      this.route({
        apiCall: this.genericApiCall(BudgetTransactionAPI, 'query')
      })
    );
    this.router.put(
      '/:id',
      budgetTransactionEditValidators,
      this.route({
        apiCall: this.genericApiCall(BudgetTransactionAPI, 'edit')
      })
    );
    this.router.delete(
      '/:id',
      [idParamValidators('company', true), idParamValidators('department'), idParamValidators()],
      this.route({
        apiCall: this.genericApiCall(BudgetTransactionAPI, 'remove')
      })
    );
  }
}

const budgetTransactionRouter = new BudgetTransactionRouter({
  mergeParams: true
});
budgetTransactionRouter.init();
module.exports = budgetTransactionRouter.router;
