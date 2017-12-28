const _ = require('lodash');
const Promise = require('bluebird');
const jwt = require('jsonwebtoken');

const { comparePassword } = require('../../lib/password');
const apiOptions = require('../../lib/endpoint/api-options');
const RestError = require('../../lib/error');

const INVALID_LOGIN = new RestError(401, { message: 'Invalid username or password' });

class AuthAPI {
  constructor(options) {
    apiOptions.apply(this, [options]);
  }

  async createToken(tokenRequest) {
    const query = {
      where: { email: tokenRequest.email }
    };
    const user = await this.db.User.findOne(query);
    if (!user) {
      throw INVALID_LOGIN;
    }
    try {
      await comparePassword(tokenRequest.password, user.password);
    } catch (e) {
      const message = e.message || e;
      if (message !== 'Password does not match') {
        this.logger.error(`Error checking password: ${message}`);
      }
      this.logger.debug(`Invalid login for user ${user.id}`);
      throw INVALID_LOGIN;
    }
    const token = await this._generateToken(user);
    this.logger.debug(`Auth token generated for user ${user.id}`);
    return token;
  }

  _generateToken(user) {
    // select the user's property that are going to be encoded in the token
    const tokenData = _.pick(user, ['id']);
    return new Promise((resolve, reject) => {
      jwt.sign(tokenData, this.config.BUDGETEALA_SECRET, {}, (err, token) => {
        if (err) {
          return reject(new RestError(500, { message: 'Error creating token' }));
        }
        resolve(token);
      });
    });
  }
}

module.exports = AuthAPI;
