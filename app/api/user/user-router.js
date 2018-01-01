const AbstractRouter = require('../../lib/router/abstract-router');
const idParamValidators = require('../../lib/validators/id-param-validators');
const UserAPI = require('./user-api');

const { userCreateValidators, userEditValidators, userQueryValidators } = require('./validators');

class UserRouter extends AbstractRouter {
  init() {
    this.router.get(
      '/',
      userQueryValidators,
      this.route({
        apiCall: this.genericApiCall(UserAPI, 'query')
      })
    );
    this.router.post(
      '/',
      userCreateValidators,
      this.route({
        apiCall: this.genericApiCall(UserAPI, 'create')
      })
    );
    this.router.get(
      '/me',
      this.route({
        apiCall: this.genericApiCall(UserAPI, 'currentUser')
      })
    );
    this.router.get(
      '/:id',
      idParamValidators(),
      this.route({
        apiCall: this.genericApiCall(UserAPI, 'query')
      })
    );
    this.router.put(
      '/:id',
      userEditValidators,
      this.route({
        apiCall: this.genericApiCall(UserAPI, 'edit')
      })
    );
    this.router.delete(
      '/:id',
      idParamValidators(),
      this.route({
        apiCall: this.genericApiCall(UserAPI, 'remove')
      })
    );
  }
}

const userRouter = new UserRouter();
userRouter.init();
module.exports = userRouter.router;
