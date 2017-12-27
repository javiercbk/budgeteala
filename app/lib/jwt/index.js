const { BUDGETEALA_AUTH_COOKIE } = require('../../lib/config');

const jwt = options => ({
  secret: options.secret,
  getToken: (req) => {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      return req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies[BUDGETEALA_AUTH_COOKIE]) {
      // fallback to cookie if no header is found
      return req.cookies[BUDGETEALA_AUTH_COOKIE];
    }
    return null;
  }
});

module.exports = jwt;
