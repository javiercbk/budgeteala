const AbstractRouter = require('../../lib/router/abstract-router');
const idParamValidators = require('../../lib/validators/id-param-validators');
const UserAPI = require('./user-api');

const { userCreateValidators, userEditValidators, userQueryValidators } = require('./validators');

const genericApiCall = method => (reqObj, options) => {
  const userAPI = new UserAPI(options);
  return userAPI[method](reqObj);
};

class UserRouter extends AbstractRouter {
  init() {
    this.router.get(
      '/',
      userQueryValidators,
      this.route({
        apiCall: genericApiCall('query')
      })
    );
    this.router.post(
      '/',
      userCreateValidators,
      this.route({
        apiCall: genericApiCall('create')
      })
    );
    this.router.get(
      '/me',
      this.route({
        apiCall: genericApiCall('currentUser')
      })
    );
    this.router.get(
      '/:id',
      idParamValidators(),
      this.route({
        apiCall: genericApiCall('query')
      })
    );
    this.router.put(
      '/:id',
      userEditValidators,
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
