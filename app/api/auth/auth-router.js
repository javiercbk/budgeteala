const AbstractRouter = require('../../lib/router/abstract-router');
const AuthAPI = require('./auth-api');
const { BUDGETEALA_AUTH_COOKIE } = require('../../lib/config');

const { createTokenValidators } = require('./validators');

class AuthRouter extends AbstractRouter {
  init() {
    this.router.post(
      '/',
      createTokenValidators,
      this.route({
        apiCall: this.genericApiCall(AuthAPI, 'createToken'),
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
