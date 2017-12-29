const AbstractRouter = require('../../lib/router/abstract-router');
const idParamValidators = require('../../lib/validators/id-param-validators');
const CompanyAPI = require('./company-api');

const {
  companyCreateValidators,
  companyEditValidators,
  companyQueryValidators
} = require('./validators');

const genericApiCall = method => (reqObj, options) => {
  const userAPI = new CompanyAPI(options);
  return userAPI[method](reqObj);
};

class UserRouter extends AbstractRouter {
  init() {
    this.router.get(
      '/',
      companyQueryValidators,
      this.route({
        apiCall: genericApiCall('query')
      })
    );
    this.router.post(
      '/',
      companyCreateValidators,
      this.route({
        apiCall: genericApiCall('create')
      })
    );
    this.router.get(
      '/:id',
      idParamValidators(),
      this.route({
        apiCall: genericApiCall('details')
      })
    );
    this.router.put(
      '/:id',
      companyEditValidators,
      this.route({
        apiCall: genericApiCall('edit')
      })
    );
    this.router.delete(
      '/:id',
      idParamValidators(),
      this.route({
        apiCall: genericApiCall('remove')
      })
    );
  }
}

const homeRouter = new UserRouter();
homeRouter.init();
module.exports = homeRouter.router;
