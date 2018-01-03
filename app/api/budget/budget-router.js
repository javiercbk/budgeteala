const AbstractRouter = require('../../lib/router/abstract-router');
const idParamValidators = require('../../lib/validators/id-param-validators');
const BudgetAPI = require('./budget-api');

const {
  budgetCreateValidators,
  budgetEditValidators,
  budgetQueryValidators
} = require('./validators');

class BudgetRouter extends AbstractRouter {
  init() {
    this.router.get(
      '/',
      budgetQueryValidators,
      this.route({
        apiCall: this.genericApiCall(BudgetAPI, 'query')
      })
    );
    this.router.post(
      '/',
      budgetCreateValidators,
      this.route({
        apiCall: this.genericApiCall(BudgetAPI, 'create')
      })
    );
    this.router.get(
      '/:id',
      [idParamValidators('company', true), idParamValidators('department'), idParamValidators()],
      this.route({
        apiCall: this.genericApiCall(BudgetAPI, 'query')
      })
    );
    this.router.put(
      '/:id',
      budgetEditValidators,
      this.route({
        apiCall: this.genericApiCall(BudgetAPI, 'edit')
      })
    );
    this.router.delete(
      '/:id',
      [idParamValidators('company', true), idParamValidators('department'), idParamValidators()],
      this.route({
        apiCall: this.genericApiCall(BudgetAPI, 'remove')
      })
    );
  }
}

const budgetRouter = new BudgetRouter({
  mergeParams: true
});
budgetRouter.init();
module.exports = budgetRouter.router;
