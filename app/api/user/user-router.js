const AbstractRouter = require('../../lib/router/abstract-router');
const UserAPI = require('./user-api');

const { userDetailValidators, userQueryValidators } = require('./validators');

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
        apiCall: genericApiCall('currentUser')
      })
    );
    this.router.get(
      '/me',
      this.route({
        apiCall: genericApiCall('retrieveUserDetails')
      })
    );
    this.router.get(
      '/:id',
      userDetailValidators,
      this.route({
        apiCall: genericApiCall('retrieveUserDetails')
      })
    );
  }
}

const homeRouter = new UserRouter();
homeRouter.init();
module.exports = homeRouter.router;
