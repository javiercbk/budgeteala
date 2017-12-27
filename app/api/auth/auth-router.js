const AbstractRouter = require('../../lib/router/abstract-router');
const AuthAPI = require('./auth-api');
const { BUDGETEALA_AUTH_COOKIE } = require('../../lib/config');

const { createTokenValidators } = require('./validators');

const genericApiCall = method => (reqObj, options) => {
  const authAPI = new AuthAPI(options);
  return authAPI[method](reqObj);
};

class AuthRouter extends AbstractRouter {
  init() {
    this.router.post(
      '/',
      createTokenValidators,
      this.route({
        apiCall: genericApiCall('createToken'),
        responseHandler: function (res) {
          return (token) => {
            res.cookie(BUDGETEALA_AUTH_COOKIE, token, { httpOnly: true });
            res.status(204).send();
          };
        }
      })
    );
  }
}

const authRouter = new AuthRouter();
authRouter.init();
module.exports = authRouter.router;
